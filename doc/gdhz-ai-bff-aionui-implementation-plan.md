# gdhz AI 组件接入 AionUi（BFF 模式）实施方案

## 1. 背景与现状

当前有两个独立系统：

- `AionUi`：已经在服务器公网暴露 `25808`，并有用户在使用；其 WebUI 能力可驱动多类 AI Agent/CLI。
- `gdhz-vue`：AI 组件目前是前端 mock 问答，未接入真实后端。

`gdhz-vue` 现状代码：

- `src/components/map/FloatingToolbar.vue` 的 `sendMessage()` 使用本地模拟延迟和 `getMockResponse()`。
- `src/components/ai/AIAssistant.vue` 也是 mock 逻辑。

结论：`gdhz` 现在"有 AI UI、无真实 AI 服务"。

---

## 2. 本期目标与约束

## 2.1 目标

在尽量少改动前端的前提下，交付两类 AI 能力，并支持多用户隔离：

1. 自然问答接口（聊天）。
2. 业务调用接口（生成"当前灾情摘要/总结"）。

## 2.2 本期约束（按当前决策执行）

- 暂不引入 HTTPS。
- 暂不轮换 AionUi 密码。
- 暂不关闭二维码登录。
- 优先"先能用"，安全加固和平台化能力后置。

---

## 3. 总体方案（推荐）

采用 `BFF` 中间层，不让 `gdhz` 前端直接对接 AionUi 协议细节。

架构：

```text
Browser(gdhz-vue)
   -> /api/ai/chat                 (自然问答，长会话复用)
   -> /api/ai/summary/current      (业务 API，独立短会话)
gdhz-bff
   -> AionUi HTTP POST /login（拿 JWT Token）
   -> AionUi WebSocket 连接（携带 Token，{ name, data } JSON 格式）
   -> 发送 bridge 事件：create-conversation / chat.send.message
   <- 监听 bridge 广播：chat.response.stream（按 conversation_id 过滤）
   -> 聚合流式响应后回传给 gdhz 前端
```

> **协议说明**：AionUi 的 bridge 是全量广播模式（所有 WebSocket 客户端收到所有事件），
> BFF 须在内部按 `conversation_id` 做路由过滤，丢弃不属于自己的消息。
> bridge 事件格式由 `@office-ai/platform` 定义，`buildProvider` 为请求-回调模式，
> `buildEmitter` 为单向推送模式，具体回调约定须通过 **阶段0 PoC** 验证后固化。

这样做的价值：

- 前端只改一次 API，后续可换底层引擎。
- 多用户隔离、会话映射、历史策略都可在 BFF 统一治理。
- 避免前端绑定 AionUi 内部事件协议。

---

## 4. 用户隔离与历史记录策略（核心决策）

## 4.1 隔离单元

隔离键建议定义为：

`tenant_id + user_id + chat_session_id`

映射到唯一 `aionui_conversation_id`，禁止跨用户复用 conversation。

## 4.2 会话策略

- 每个 `chat_session_id` 在 AionUi 内创建一个 conversation。
- 用户同一会话连续提问复用同一个 `conversation_id`，保证上下文连续。
- 用户新开会话时新建 conversation，避免上下文串线。

## 4.3 历史记录是否需要

建议分两层：

1. 必需层（本期必须）：

- 在 BFF 数据库保存 `用户会话 -> AionUi conversation_id` 映射。
- 保存最后活跃时间、状态、错误信息。

1. 增强层（本期建议实现）：

- BFF 本地镜像消息（user/assistant/time/traceId）。
- 优点：便于审计、回放、故障恢复，不依赖 AionUi 内部库结构。

---

## 5. AionUi 配合方式

## 5.1 必要能力

BFF 需要完成 4 件事：

1. 登录 AionUi（`POST /login`）获取 JWT Token。
2. 建立到 AionUi 的 WebSocket 长连接。Token 传递方式（**不支持 URL query**）：
   - `Authorization: Bearer <token>`（推荐）
   - `Cookie: aionui-session=<token>`
   - `Sec-WebSocket-Protocol: <token>`（仅当前两种不可用时）
3. 发送 bridge 事件（JSON `{ name, data }` 格式）：
   - `create-conversation`（创建会话，最小 payload 见下方 5.4）
   - `chat.send.message`（发送消息，参数含 `input`, `msg_id`, `conversation_id`）
   - `chat.stop.stream`（停止会话）
4. 监听 bridge 广播事件：
   - `chat.response.stream`（流式响应，含 `conversation_id`, `msg_id`, `type`, `data`）
   - `ping`（心跳，需回复 `pong`）

## 5.2 关键实现建议

AionUi 的 `@office-ai/platform` bridge 协议是"事件 + 回调"模型（`buildProvider` 有回调约定），不是普通 REST。

**实施策略**：

- BFF 封装 `aionui.client.ts`，所有与 AionUi 的交互统一收敛在此模块。
- **阶段0 必须先做 PoC**：用 raw WebSocket 抓取 `create-conversation` 和 `chat.send.message` 的真实 invoke -> callback 往返协议，确认回调是通过函数返回值还是独立事件完成。
- PoC 结论固化为协议文档后再正式开发，避免基于猜测编码。
- 锁定 AionUi 版本，升级前先在测试环境验证 bridge 兼容性。

## 5.3 与 AionUi 的职责边界

- AionUi：Agent 执行、工具调用、流式消息产生。
- BFF：业务身份、多用户隔离、会话映射、输出裁剪、错误标准化。
- gdhz 前端：仅负责 UI 展示和输入。

## 5.4 `create-conversation` 入参契约（不可变更）

AionUi 的 `ICreateConversationParams` 接口要求以下必填字段（源自 `ipcBridge.ts`）：

```typescript
{
  id?: string,  // 可选，BFF 应主动传入自生成的 UUID（见下方说明）
  type: 'gemini' | 'acp' | 'codex' | 'openclaw-gateway' | 'nanobot',
  model: TProviderWithModel,  // 完整 provider 配置（见下方）
  extra: {
    workspace?: string,       // 工作目录（可选）
    backend?: string,         // ACP 后端类型（acp 类型时需要）
    agentName?: string,       // Agent 名称（可选）
    webSearchEngine?: string  // 搜索引擎（可选）
  }
}
```

### `model` 字段：完整 `TProviderWithModel` 类型

> [!CAUTION]
> `model` **不是** `{ id, useModel }` 两字段对象，而是完整的 `TProviderWithModel`。
> 源自 `ipcBridge.ts:419`、`storage.ts:309`、`storage.ts:347`。

```typescript
// TProviderWithModel 完整定义
interface TProviderWithModel {
  id: string;           // provider 唯一标识（必填）
  platform: string;     // 平台标识（如 'google', 'openai'）
  name: string;         // provider 名称
  baseUrl: string;      // API 基础地址
  apiKey: string;       // API 密钥
  useModel: string;     // 模型标识（如 'gemini-2.0-flash'）
  // ...其他 provider 配置字段
}
```

BFF 需要在配置中维护一套**完整的默认 model 配置**（含 `platform/name/baseUrl/apiKey/useModel` 等），
参考前端占位模型写法：`useGuidSend.ts:102`。避免硬编码到业务逻辑。
具体可用的 `type` 和 `model` 组合，须在阶段0 PoC 中确认。

### `id` 字段：BFF 主动传入 conversation_id

> [!IMPORTANT]
> **BFF 必须主动生成 `id`（UUID）并在 `create-conversation` 时传入。**
>
> WebSocket 路径下 `create-conversation` 的回调返回值会被丢弃（`adapter.ts:36` 证实 `emitter.emit()` 无 return），
> 因此 BFF 无法从回调中获取 `conversation_id`。同理，`database.getUserConversations` 也走同一 provider 回调链路，
> 同样拿不到返回值——**轮询不是可行的兜底方案**。
>
> 代码已支持自定义 `id`：`ipcBridge.ts:417`、`conversationService.ts:162`。
>
> **正确做法**：BFF 在调用 `create-conversation` 前自行生成 UUID 作为 `id` 传入，
> 后续直接使用该 `conversation_id` 发送消息，无需等待任何回调。

### 新会话首问：确定性握手策略（P0）

> [!CAUTION]
> **时序竞争风险**：WS 入口 `emitter.emit()` 不 await（`adapter.ts:36`），`create-conversation` 和
> `chat.send.message` 都是 fire-and-forget。如果 BFF 在 `create` 后立即发 `sendMessage`，
> 后端可能还未完成会话初始化，导致 `conversation not found`（`conversationBridge.ts:416`）。
>
> **这是上线阻断点**，必须在阶段0 PoC 中验证并固化策略。

**BFF 新会话首问时序**：

```text
BFF                              AionUi WS
 |-- create-conversation(id=X) --> |
 |                                 | (emit → 异步初始化会话)
 |   ┌──────────────────────────┐  |
 |   │ 等待 ack 或固定延迟      │  |
 |   └──────────────────────────┘  |
 |-- chat.send.message(id=X) ----> |
```

**三种候选策略（PoC 验证后选一固化）**：

| 策略 | 描述 | 优点 | 缺点 |
|------|------|------|------|
| A. 固定延迟 | `create` 后等待固定时间（如 500ms）再发 `sendMessage` | 实现最简单 | 不确定性高，慢环境可能不够 |
| B. 重试补偿 | `sendMessage` 失败时短间隔重试（最多3次，间隔200ms） | 兼容性好 | 增加首问延迟 |
| C. 事件确认 | 监听会话创建完成的广播事件（如有），收到后再发 `sendMessage` | 最可靠 | 依赖 AionUi 是否广播创建完成事件 |

> **PoC 必须验证**：`create-conversation` 后最短多久可以安全发送 `sendMessage`，
> 以及是否有可监听的"会话就绪"广播事件。验证结论固化到协议文档中。

---

## 6. BFF 设计（可直接实施）

## 6.1 目录建议

在 `gdhz-vue` 下新增服务目录（示例）：

```text
gdhz-vue/bff/
  src/
    app.ts
    modules/ai/
      ai.controller.ts
      ai.service.ts
      aionui.client.ts
      session.repository.ts
      message.repository.ts
```

## 6.2 对外 API（给 gdhz 前端）

### 1) `POST /api/ai/chat`

请求：

```json
{
  "chatSessionId": "optional-or-null",
  "message": "用户问题",
  "context": {
    "page": "overview",
    "region": "gd"
  }
}
```

响应（本期推荐先做阻塞式）：

```json
{
  "chatSessionId": "generated-or-existing",
  "reply": "AI 回复全文",
  "traceId": "uuid"
}
```

### 2) `POST /api/ai/summary/current`

用途：供前端业务模块一键获取"当前灾情摘要"，不依赖聊天面板的自由提问。

**核心原则**：结构化数字由代码保证权威性，AI 只负责生成文本描述。

请求：

```json
{
  "region": "gd",
  "timeRange": "24h",
  "detailLevel": "standard",
  "snapshot": {
    "alertCount": 12,
    "maxTyphoonLevel": "12",
    "affectedPopulation": 1200000,
    "evacuatedPopulation": 8500
  }
}
```

响应：

```json
{
  "snapshot": {
    "alertCount": 12,
    "maxTyphoonLevel": "12",
    "affectedPopulation": 1200000,
    "evacuatedPopulation": 8500
  },
  "summaryText": "当前灾情总体为III级响应，粤东和珠三角沿海风险较高。建议继续组织渔船回港，加强堤防和低洼区巡查。",
  "generatedAt": 1730000000000,
  "traceId": "uuid"
}
```

说明：

- `snapshot` 原样返回（代码权威数据），前端直接用于数字/卡片渲染。
- `summaryText` 由 AI 生成（纯文本），使用强约束 Prompt 限制"仅可引用 snapshot 提供的数据，不得编造数值"。
- 前端对 `snapshot` 和 `summaryText` 分开渲染：数字区域用 snapshot，文字区域用 summaryText。
- 本期 `snapshot` 由前端传入（快速落地）；下一期改为 BFF 自行聚合数据源。

### 3) `GET /api/ai/history?chatSessionId=...`

返回会话历史（从 BFF 本地库读取）。

## 6.3 BFF 内部流程（阻塞式首版）

### A. 自然问答流程（`/api/ai/chat`）

1. 根据登录态拿到 `tenant_id/user_id`。
2. 查会话路由表是否已有 `aionui_conversation_id`。
3. 无则发送 `create-conversation(id=UUID)` 创建，按 §5.4 首问握手策略等待就绪后再发消息。
4. 进入该 `conversation_id` 的**串行队列**（同一会话同一时刻只允许一个请求在跑）。
5. 发送 `chat.send.message`（含 `input`, `msg_id`, `conversation_id`）。
6. 监听 `chat.response.stream` 广播，**双层过滤 + 状态机聚合**：
   - **第一层过滤**：按 `conversation_id` 过滤，不属于当前路由表的 -> 丢弃。
   - **第二层过滤**：仅接受 `type='content' && typeof data === 'string'` 的消息追加到缓冲区。
   - `type='thought'` / `type='tool_group'` / `type='agent_status'` 等非内容事件 -> 记录日志但不追加到响应。
   - `type='system'` -> 忽略（Agent 内部系统消息），避免串入用户回复。

7. **每个会话维护活跃请求状态机**：

   ```text
   [idle] --sendMessage--> [active: 等待首包]
     ^                          |
     |                    收到content
     |                          |
     |                    [streaming: 聚合中]
     |                          |
     |                  finish/error/超时
     |                          |
     +----[cooldown: 300ms静默期]<-+
   ```

   - **活跃请求窗口**：`active`/`streaming` 期间接受 stream 消息。
   - **终止态**：收到 `finish`/`error`/超时后进入 `cooldown`，丢弃该窗口内的迟到包。
   - **短暂静默期**（300ms）：防止"同会话尾包串入下一问"（全量广播 + 多 Agent 事件导致的延迟包）。
   - 静默期结束后回到 `idle`，队列中的下一个请求方可执行。

8. **完成判定（三条件，满足任一即结束）**：
   - 收到 `type='finish'` -> 正常完成，返回最终 `reply`。
   - 收到 `type='error'` -> 异常完成，返回错误信息。
   - 超时触发 -> 返回已聚合的部分内容或超时错误。
9. 写入会话表和消息表（`msg_id` 作为辅助追踪字段写入日志）。

### B. 灾情摘要流程（`/api/ai/summary/current`）

1. 接收 `region/timeRange` 和 `snapshot`（本期由前端传入）。
2. 组装"强约束 Prompt"：仅允许基于 `snapshot` 输出文本描述，不得编造数值。
3. 使用独立短会话（从摘要会话池分配，不复用用户自由聊天会话）。
4. 发送 `chat.send.message`，同样进入串行队列。
5. 聚合 `chat.response.stream`，提取 AI 生成的文本。
6. 返回 `{ snapshot（原样返回）, summaryText（AI 文本）, traceId }`。

建议：

- 摘要接口用完即释放会话，或使用专用会话池。
- AI 只输出 `summaryText` 纯文本，结构化数字全部由 `snapshot` 保证。

## 6.4 会话路由表与并发控制

**路由表**（BFF 内存 Map）：

```text
conversation_id -> { userId, sessionId, type('chat'|'summary'), responseBuffer, status }
```

- 收到 `chat.response.stream` 广播时，查路由表找到对应用户请求。
- 不在路由表中的 `conversation_id`（如 AionUi 桌面端操作）-> 直接丢弃。

**并发策略**：

- 按 `conversation_id` 做**串行队列**，同一会话同一时刻只有一个请求在执行。
- 不同 `conversation_id` 之间可并行，互不影响。
- `msg_id` 作为辅助追踪字段，用于日志和诊断，不作为路由主键。

## 6.5 超时与重试

**三级超时策略**：

| 超时类型 | 时长 | 含义 |
|----------|------|------|
| 首包超时 | `30s` | 发送 `chat.send.message` 后，30s 内未收到任何 stream 数据 -> AI 可能无响应 |
| 空闲超时 | `15s` | 两条 stream 数据之间超过 15s 无新内容 -> 可能卡住 |
| 总超时 | `120s` | 单次问答从发送到完成的总时长上限 |

- AionUi WS 心跳：收到 `ping` 需回复 `pong`，否则会被服务端断开。
- 问答失败返回标准错误码，不把 AionUi 内部错误原文直接暴露前端。

## 6.6 WS 断线重连与 Token 刷新

> [!WARNING]
> AionUi Token 默认有效期 24h（`constants.ts:21`），过期后服务端推送 `auth-expired` 并断开连接（`WebSocketManager.ts:199`）。
> 仅重连不换 Token 会导致持续失败。

**BFF 重连状态机**：

```text
[已连接] --WS断开--> [判断断开原因]
                          |
                  +-------+-------+
                  |               |
            [网络抖动]      [auth-expired]
                  |               |
            [指数退避重连]   [POST /api/auth/refresh]
                  |               |
                  |         [refresh失败?]
                  |               |
                  |         [POST /login 兜底]
                  |               |
                  |         [拿到新Token]
                  |               |
                  +-------+-------+
                          |
                   [用(新)Token重建WS]
                          |
                   [恢复会话映射]
```

- **网络断线**：指数退避重连（1s -> 2s -> 4s -> ...最大30s），复用现有 Token。
- **`auth-expired` 断线**：先尝试 `POST /api/auth/refresh` 续期，若失败再兜底 `POST /login` 重新登录，用新 Token 重建 WS。
- **Token 主动刷新**：BFF 在 Token 到期前（如 23h 时）调用 `/api/auth/refresh`（`authRoutes.ts:281`）主动续期，避免临界断线。`/api/auth/refresh` 不受登录限流约束，优先使用；仅在 refresh 失败时才回退到 `/login`。
- **重连后**：恢复会话映射，正在进行的请求返回超时错误让前端重试。

**`/api/auth/refresh` 调用前置条件（必须实现）**：

> [!IMPORTANT]
> `/api/auth/refresh` 是 POST 接口，受全局 CSRF 保护；`/login` 是例外（在排除列表）。
> 因此 BFF 不能仅带 token 就调用 refresh，需满足以下条件。

- 携带会话 token：请求体中传 `token`（`authRoutes.ts:283`）。
- 携带 CSRF：从前序响应获取 `aionui-csrf-token`，并在 POST body 中携带 `_csrf` 字段（tiny-csrf 读取 body）。
- 维持 cookie jar：保证 `aionui-session` 与 `aionui-csrf-token` 在同一会话上下文中发送。

> 实施建议：BFF 将 `login -> refresh -> ws` 统一走同一个 HTTP 客户端实例（带 cookie jar），
> 并封装 `withCsrf(body)` 自动注入 `_csrf`，避免调用方遗漏。

**登录刷新保护（必须实现）**：

> [!WARNING]
> AionUi `/login` 有严格限流（`security.ts:14`、`authRoutes.ts:100`），多协程同时重登会触发限流拒绝。

- **Single-flight**：全局只允许一个 `/login` 请求在飞，其他协程等待同一个 Promise 结果。
- **指数退避**：登录失败后退避重试（1s -> 2s -> 4s），避免密集打击。
- **熔断时间窗**：连续登录失败 3 次后进入 60s 熔断期，期间直接返回"服务不可用"，不再尝试登录。

---

## 7. gdhz 前端改造点（最小化）

只改 AI 发送逻辑，不改 UI 样式：

- 改造 `FloatingToolbar.vue` 的 `sendMessage()`：
  - 从 mock 改为 `POST /api/ai/chat`
  - 返回后写入 `messages`
- 新增一个摘要调用方法（供业务按钮或面板初始化时触发）：
  - `POST /api/ai/summary/current`
  - 将 `snapshot` 渲染到数字区域，`summaryText` 渲染到文字区域
- 可选：抽一个 `src/api/ai.js`，避免组件内直接写 fetch。

后续可再改造 `AIAssistant.vue` 复用同一 API。

---

## 8. 数据模型建议（BFF）

## 8.1 `ai_chat_sessions`

- `id` (chat_session_id)
- `tenant_id`
- `user_id`
- `aionui_conversation_id`
- `status` (`active|closed|error`)
- `created_at`
- `updated_at`
- `last_active_at`

唯一索引建议：

- `(tenant_id, user_id, id)`

## 8.2 `ai_chat_messages`

- `id`
- `chat_session_id`
- `tenant_id`
- `user_id`
- `role` (`user|assistant|system`)
- `content`
- `trace_id`
- `created_at`

索引建议：

- `(chat_session_id, created_at)`

---

## 9. 分阶段实施计划

## 阶段 0（PoC 预验证，1-2 天）

用 Node.js 脚本验证 AionUi bridge 协议的完整链路：

- [ ] `POST /login` 获取 JWT Token，确认 Token 格式（Cookie / Body）。
- [ ] WebSocket 连接（用 `Authorization` header 传 Token），维持心跳（`ping/pong`）。
- [ ] 发送 `create-conversation`（BFF 自行生成 UUID 作为 `id` 传入，含完整 `TProviderWithModel` 作为 `model`）：
  - 验证传入自定义 `id` 后，后续发送 `chat.send.message` 使用该 `id` 是否正常工作。
  - ~~场景B（已废弃）：`database.getUserConversations` 轮询不可行，因走同一 provider 回调链路。~~
- [ ] **首问握手验证**：`create-conversation` 后立即发 `sendMessage`，测量最短安全间隔，确认握手策略（A/B/C）。
- [ ] 发送 `chat.send.message`，完整记录 `chat.response.stream` 事件序列。
- [ ] 确认每种 `type`（content/thought/finish/error/tool_group/agent_status/system）的 `data` 结构。
- [ ] 验证完成信号：`finish` 和 `error` 哪些会出现、是否还有其他终止类型。
- [ ] 验证 `finish` 后是否仍有迟到包（尾包问题），确认静默期策略的必要性。
- [ ] 并发测试：同时两个 conversation 各发消息，验证 `conversation_id` 隔离。
- [ ] Token 过期测试：验证 `auth-expired` 事件格式，确认 `refresh优先 + login兜底` 链路可恢复。
- [ ] 输出：**协议文档**（固化事件名、数据格式、回调约定），作为 BFF 开发的基准。

**PoC 通过标准（阶段1 启动门禁，不可变更）**：

1. `create-conversation`（BFF 传入自定义 `id`）-> 后续 `chat.send.message` 使用该 `id` 正常工作。
2. **新会话首问握手策略已固化**：确认 `create` 与 `sendMessage` 的安全时序（A/B/C 选一），写入协议文档。
3. `chat.send.message` -> `chat.response.stream` 全链路在 WebSocket 侧已验证通过。
4. 完成判定策略已验证：`finish`/`error` 信号 + 尾包静默期是否必要。
5. Token 刷新链路已验证：`auth-expired` -> `/api/auth/refresh` -> (失败则 `/login`) -> 重建 WS 可正常恢复。
6. 协议文档已产出并包含：事件名、入参结构（含完整 `TProviderWithModel`）、完成信号、错误格式。

**若 `create-conversation` 自定义 `id` 方案或首问握手策略未跑通，阶段1 不得启动。**

## 阶段 1（本期）

- 新建 BFF（基于 PoC 协议文档开发 `aionui.client.ts`）。
- 接通 AionUi 登录、WS、会话创建、消息发送、流式聚合。
- 实现 conversation_id 串行队列 + 路由表过滤 + unknown 消息丢弃。
- 前端 `FloatingToolbar` 改为调用 `/api/ai/chat`。
- 新增 `/api/ai/summary/current` 并在前端接入一个入口（按钮或自动加载）。
- 实现用户会话映射与基础历史。

验收标准：

- 多个用户同时问答不串话（conversation_id 隔离 + 串行队列）。
- 同一用户连续提问有上下文（长会话复用 conversation_id）。
- 摘要 API 能稳定返回 `{ snapshot + summaryText }`（数字由代码保证，文本由 AI 生成）。
- 前端无 mock，真实返回 AI 内容。

## 阶段 1 当前执行状态（2026-02-26）

### A. 已完成（代码已落地）

- [x] `gdhz-vue/bff` 已创建并可启动，已提供：
  - `POST /api/ai/chat`
  - `POST /api/ai/summary/current`
  - `GET /api/ai/history`
  - `GET /api/ai/catalog`
- [x] BFF 已接通 AionUi 登录与 WebSocket（含 `ping/pong`）。
- [x] BFF 已实现 `create-conversation(id=UUID)` + `chat.send.message` 调用链路。
- [x] 已按 AionUi `@office-ai/platform` 协议修正 provider 调用方式：`subscribe-<event>` -> `subscribe.callback-<event><id>`。
- [x] BFF 已实现按 `conversation_id` 的串行队列（同会话串行，不同会话并行）。
- [x] BFF 已实现 `chat.response.stream` 聚合与超时控制（首包/空闲/总超时 + finish cooldown）。
- [x] BFF 已实现 CSRF + cookie 维护，并优先 `POST /api/auth/refresh`，失败再 `/login`。
- [x] 前端 `FloatingToolbar.vue` 已接 `/api/ai/chat` 与 `/api/ai/summary/current`，不再走本地 mock。
- [x] 前端已支持“供应商 + 模型”选择，选择项来源为 `/api/ai/catalog`，不在前端硬编码。
- [x] 目录对齐策略已落地：`/api/ai/catalog` 由 BFF 读取 AionUi 本地配置（`acp.customAgents`、`acp.cachedModels`、`guid.lastSelectedAgent`）并按 AionUi `acpTypes.ts` 探测规则生成列表（不修改 AionUi 代码）。
- [x] custom/preset 选择语义已对齐：使用 `backendKey`（如 `custom:xxx`）区分具体助手，`backend` 维持 `custom`。
- [x] 会话创建已按后端路由到正确 `type`（`gemini`/`codex`/`openclaw-gateway`/`nanobot`/`acp`），避免 `Unsupported backend`。
- [x] 模型默认值与 AionUi 对齐：Gemini 默认 `auto`（Google Auth 占位 provider），Codex 默认 `gpt-5.2-codex`。
- [x] `chat.send.message` provider 超时已按总超时动态放宽，兼容 Codex 长耗时首轮。

### B. 尚未完成或待专项验证

- [ ] 阶段0“协议文档产物”未单独沉淀为独立 PoC 文档（当前以实现代码为准）。
- [x] `auth-expired -> refresh/login -> WS 重建` 的“强制过期演练”已实机验证通过（见 `doc/verification/stage1-closeout-2026-02-26_14-49-59.json`）。
- [x] “双用户并发压测 + 尾包干扰场景”已按验收脚本验证通过（见 `doc/verification/stage1-closeout-2026-02-26_14-49-59.json`）。

## 阶段 1 增量执行状态（2026-02-26 晚）

### A. 本次增量已完成（部署与运维侧）

- [x] 公网入口收口为 `3000` 单入口访问（`gdhz`、`aionui`、`mihomo` 全部走 nginx 子路径）。
- [x] 已补齐 AionUi 子路径代理适配：`/aionui/` 下静态资源、登录与 API 路径可正常工作。
- [x] 已新增 AionUi WebSocket 代理入口：`/aionui-ws`（用于浏览器侧桥接连接）。
- [x] 已固定 mihomo 面板入口为 `/mihomo/`（代理到 `9090/ui/`），不再直接落到 controller 根路径。
- [x] 已提供 mihomo API 代理 `/mihomo-api/`（nginx 注入 `Authorization`）。
- [x] 防火墙策略已收口：`ALLOW 22/3000`，`DENY 25808/9090`（避免 AionUi 与 mihomo 直暴公网）。
- [x] 运维交接文档已补充：`doc/GDHZ-运维与交接手册.md`。

### B. 当前阶段定位

> 阶段1收尾专项验证已完成，主干能力、部署链路与稳定性验证均可用，可进入阶段2准备项。

### C. 下一步准备清单（建议按顺序执行）

1. 阶段1收尾验证：
   - [x] 执行“强制 token 过期演练”，验证 `auth-expired -> refresh/login -> WS 重建` 全链路。
   - [x] 执行双用户并发压测（不同 `x-user-id`）并记录“不串话”证据。
   - [x] 执行“尾包干扰”场景并确认 `finish cooldown` 策略稳定。
2. 文档固化：
   - [ ] 产出独立 PoC 协议文档（事件名、入参、回调、完成信号、错误格式），补齐阶段0产物缺口。
3. 阶段2启动准备：
   - [ ] 明确流式输出改造边界（SSE/WS 二选一）。
   - [ ] 明确审批接口 `/api/ai/confirm` 的前后端契约。

## 阶段 1 部署链路确认（本期）

本期部署链路按以下方式执行（与你描述一致）：

```text
公网浏览器
  -> gdhz Web（同域 /api 反代到 gdhz-bff）
  -> gdhz-bff（本机:3001）
  -> AionUi（本机:25808）
```

关键配置：

- `bff/.env` 中设置 `AIONUI_BASE_URL=http://127.0.0.1:25808`
- 前端统一请求 `/api/*`（由反向代理转发到 BFF）

> 说明：即使 AionUi 当前对外暴露 25808，本方案下 gdhz 业务链路应固定走“BFF -> 本机 25808”，前端不直接访问 AionUi。

## 阶段 1 验收验证步骤（可逐条打勾）

### 1) 基础连通

- [ ] AionUi 正常监听：`ss -ltnp | grep 25808`
- [ ] BFF 正常监听：`ss -ltnp | grep 3001`
- [ ] 健康检查通过：`curl -s http://127.0.0.1:3001/api/health`

### 2) 目录一致性（供应商/模型）

- [ ] 执行：`curl -s http://127.0.0.1:3001/api/ai/catalog | jq`
- [ ] 验证返回包含 `providers[].backendKey`、`providers[].backend`、`providers[].models`
- [ ] 验证存在 `custom:*` 类型 `backendKey`（如配置了内置/自定义助手）
- [ ] 打开 gdhz 页面，确认下拉项与 AionUi WebUI 的有效助手集合一致

### 3) 聊天链路

- [ ] 页面发送第1条消息，返回真实 AI 回复（非 mock 文案）
- [ ] 同一会话继续追问，能保持上下文连续
- [ ] 切换供应商或模型后再发消息，能成功返回（新配置生效）

### 4) 摘要链路

- [ ] 调用摘要接口：
  `curl -s -X POST http://127.0.0.1:3001/api/ai/summary/current -H 'Content-Type: application/json' -d '{"region":"gd","timeRange":"24h","detailLevel":"standard","snapshot":{"alertCount":1}}' | jq`
- [ ] 验证返回同时包含 `snapshot` 和 `summaryText`

### 5) 稳定性与隔离

- [ ] 两个不同用户标识并发请求（`x-user-id` 不同）不串话
- [ ] 同会话连发（第二问在第一问未完成时入队）不出现尾包干扰
- [ ] 人为断开/重启 AionUi 后，BFF 能恢复连接并继续可用

## 阶段 1 本地自测记录（2026-02-26）

- [x] `AionUi` 本机服务可达：`GET http://127.0.0.1:25808/api/auth/status` 返回 `success=true`。
- [x] `BFF` 可启动且 `GET /api/health` 返回 `status=ok`。
- [x] `GET /api/ai/catalog` 返回结构正确，包含 `providers[].backendKey/backend/models`，且存在 `custom:*` 形式 `backendKey`。
- [x] `catalog` 中 `gemini`/`codex` 均返回可选模型列表与默认模型（`auto` / `gpt-5.2-codex`）。
- [x] `AIONUI_PASSWORD` 已配置后，BFF warmup 显示 `AionUi warmup success`（登录链路可用）。
- [x] `POST /api/ai/summary/current`（`selection.backendKey=gemini`）可稳定返回 `summaryText`（默认模型自动回落 `auto`）。
- [x] `POST /api/ai/chat`（`selection.backendKey=gemini`）可稳定返回真实回复（非 mock）。
- [x] `POST /api/ai/summary/current`（`selection.backendKey=codex`）可稳定返回 `summaryText`（默认模型 `gpt-5.2-codex`）。
- [x] `POST /api/ai/chat`（`selection.backendKey=codex`）可稳定返回真实回复（非 mock）。
- [x] 连通性补充验证：配置 dummy 密码时，`summary/chat` 返回 `Invalid username or password`（证明 BFF -> AionUi 登录校验路径可达）。
- [x] 阶段1专项验证脚本已落地：`bff/scripts/stage1-closeout-verify.mjs`（命令：`npm run verify:stage1`）。
- [x] 强制过期演练通过：`auth-expired -> refresh/login -> WS 重建`。
- [x] 双用户并发隔离通过：同 `chatSessionId` + 不同 `x-user-id`，返回不串话。
- [x] 尾包干扰场景通过：同会话排队请求下第二问返回正确 token，不混入第一问尾流。
- [x] 最新专项验证报告：`doc/verification/stage1-closeout-2026-02-26_14-49-59.json`（`PASS`）。

## 阶段 1.5 会话治理与运维加固（2026-02-26）

### 已完成

- [x] 前端 `chatSessionId` 本地持久化与刷新恢复：
  - `localStorage` 键：`gdhz.ai.chatSession.v1`
  - 刷新后自动调用 `/api/ai/history` 回放历史。
- [x] 前端 `x-user-id` 本地持久化，避免刷新后用户身份漂移：
  - `localStorage` 键：`gdhz.ai.userId.v1`
- [x] BFF 会话映射持久化：
  - `bff/data/ai-sessions.json`
- [x] BFF 消息历史持久化：
  - `bff/data/ai-messages.json`
- [x] 会话自动回收（释放 AionUi 运行态任务）：
  - 阈值：`AI_SESSION_IDLE_RELEASE_MS`（当前 `600000`）
  - 扫描：`AI_SESSION_RECYCLE_SCAN_INTERVAL_MS`（当前 `30000`）
  - 状态：`active/error/released`
- [x] AionUi 资源保护与自愈：
  - `Restart=always`
  - `MemoryHigh=3584M`
  - `MemoryMax=5120M`
  - `TasksMax=2048`
  - `LimitNPROC=8192`
- [x] 主机内存回压能力：
  - `swapfile=8G`
  - `vm.swappiness=10`
  - `vm.vfs_cache_pressure=50`
- [x] BFF systemd 常驻 + `EnvironmentFile` 托管敏感配置：
  - 服务：`/etc/systemd/system/gdhz-bff.service`
  - 环境：`/etc/gdhz/gdhz-bff.env`

### 关键决策固化

- 会话创建条件：
  - 无历史会话 ID 时创建新会话
  - 切换供应商/模型后创建新会话
- 刷新行为：
  - 默认恢复同一会话（非新建）
- 过期与回收：
  - 空闲会话释放运行态，但保留历史并可继续话题
  - 被释放会话恢复时，会保留 `chatSessionId`/历史消息并重建新的上游 `conversation_id`
- 历史继续：
  - 依赖 `tenantId + userId + chatSessionId` 三元组定位
  - BFF 重启后仍可恢复（会话/消息已落盘）

## 阶段 2（当前状态：核心能力已完成，审批项待定）

- [x] 改为 SSE 前端流式渲染（打字效果）：
  - BFF：`POST /api/ai/chat/stream`
  - 前端：`FloatingToolbar.vue` 已接流式增量渲染
- [x] AI 面板交互重构（参考 AionUi 布局逻辑）：
  - 左侧新建/历史会话侧栏（按“今天/过去7天/更早”分组）
  - 新建会话先选供应商（Gemini/Codex）再进入对话
  - 会话头部显示当前会话标题与模型
  - 对话输入区保留供应商与模型选择
  - 欢迎语改为打字机式渐进展示
- [ ] 增加 `/api/ai/confirm` 处理工具调用审批（待产品决策，当前默认不拦截）
- [x] 历史查询分页：
  - `GET /api/ai/history?chatSessionId=...&page=...&pageSize=...`
- [x] 会话管理：
  - `GET /api/ai/sessions`
  - `PATCH /api/ai/sessions/:chatSessionId`（重命名）
  - `DELETE /api/ai/sessions/:chatSessionId`（删除）
- [x] 后台清理策略配置化：
  - `AI_MAX_SESSIONS_PER_USER`
  - `AI_MAX_MESSAGES_PER_SESSION`
  - `AI_SESSION_TITLE_MAX_LENGTH`
- [x] 阶段2核心验证脚本：
  - `bff/scripts/stage2-core-verify.mjs`
  - 报告：`doc/verification/stage2-core-verify-2026-02-26T16-04-41.json`

## 阶段 3（后续）

- 安全加固（HTTPS、鉴权细化、最小暴露、审计）。
- 监控告警、限流、灰度发布。

---

## 10. 风险与规避

1. AionUi bridge 协议变更风险：

- 规避：BFF 封装 `aionui.client.ts` 单点适配，禁止业务层直接依赖协议字段。
- 锁定 AionUi 版本，升级前先在测试环境验证兼容性。

1. 单实例 AionUi 性能瓶颈：

- 规避：BFF 限流 + 会话队列；必要时扩展为多 AionUi 实例池。

1. 问答长耗时导致接口超时：

- 规避：本期可先阻塞式 + 总超时 120s（与 §6.5 三级超时策略一致）；下一期切 SSE。

1. 摘要接口"幻觉"风险：

- 规避：摘要入参使用结构化 `snapshot`，Prompt 限制"仅可引用提供数据"。
- `snapshot` 由代码保证权威性，AI 只生成 `summaryText`，不产核心结构化数字。

1. bridge invoke 回调协议不确定性：

- 规避：阶段0 PoC 先验证完整协议，固化文档后再开发。

---

## 11. 实施备注（给改造执行方）

1. 本期不要把安全项扩大为阻塞条件（按当前约束执行）。
2. 先保交付：问答可用 + 用户隔离可验证 + 会话可追踪。
3. 所有与 AionUi 的交互统一收敛在 `aionui.client.ts`，不要散落到 controller。
4. **阶段0 PoC 是阶段1 的前置依赖**，PoC 协议文档未产出前不启动 BFF 正式开发。
5. `msg_id` 定位为辅助追踪字段（日志/诊断），不作为路由或并发控制的主键。
