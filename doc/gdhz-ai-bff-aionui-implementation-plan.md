# gdhz AI 组件接入 AionUi（BFF 模式）实施方案

## 1. 背景与现状

当前有两个独立系统：

- `AionUi`：已经在服务器公网暴露 `25808`，并有用户在使用；其 WebUI 能力可驱动多类 AI Agent/CLI。
- `gdhz-vue`：AI 组件目前是前端 mock 问答，未接入真实后端。

`gdhz-vue` 现状代码：

- `src/components/map/FloatingToolbar.vue` 的 `sendMessage()` 使用本地模拟延迟和 `getMockResponse()`。
- `src/components/ai/AIAssistant.vue` 也是 mock 逻辑。

结论：`gdhz` 现在“有 AI UI、无真实 AI 服务”。

---

## 2. 本期目标与约束

## 2.1 目标

在尽量少改动前端的前提下，让 `gdhz` AI 组件可以真实问答，并支持多用户隔离。

## 2.2 本期约束（按当前决策执行）

- 暂不引入 HTTPS。
- 暂不轮换 AionUi 密码。
- 暂不关闭二维码登录。
- 优先“先能用”，安全加固和平台化能力后置。

---

## 3. 总体方案（推荐）

采用 `BFF` 中间层，不让 `gdhz` 前端直接对接 AionUi 协议细节。

架构：

```text
Browser(gdhz-vue)
   -> /api/ai/chat
gdhz-bff
   -> AionUi HTTP /login（拿会话 cookie）
   -> AionUi WebSocket（bridge 协议）
   -> 调用 create-conversation / chat.send.message
   <- 监听 chat.response.stream
   -> 回传给 gdhz 前端
```

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

2. 增强层（本期建议实现）：
- BFF 本地镜像消息（user/assistant/time/traceId）。
- 优点：便于审计、回放、故障恢复，不依赖 AionUi 内部库结构。

---

## 5. AionUi 配合方式

## 5.1 必要能力

BFF 需要完成 3 件事：

1. 登录 AionUi（HTTP）并维护会话 cookie。
2. 建立到 AionUi 的 WebSocket 长连接。
3. 调用/监听 bridge 事件：
- `create-conversation`
- `chat.send.message`
- `chat.response.stream`

## 5.2 关键实现建议

不要在前端或 BFF 手搓 AionUi 私有协议细节，优先复用 AionUi 同构桥接能力（`@office-ai/platform` + 事件适配模式）。

原因：

- AionUi provider 调用是“事件 + 回调”模型，不是普通 REST。
- 若手写协议，版本升级风险高、调试成本高。

## 5.3 与 AionUi 的职责边界

- AionUi：Agent 执行、工具调用、流式消息产生。
- BFF：业务身份、多用户隔离、会话映射、输出裁剪、错误标准化。
- gdhz 前端：仅负责 UI 展示和输入。

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

### 2) `GET /api/ai/history?chatSessionId=...`

返回会话历史（从 BFF 本地库读取）。

## 6.3 BFF 内部流程（阻塞式首版）

1. 根据登录态拿到 `tenant_id/user_id`。
2. 查映射表是否已有 `aionui_conversation_id`。
3. 无则调用 `create-conversation` 创建。
4. 调用 `chat.send.message` 发送提问。
5. 监听 `chat.response.stream`，按 `conversation_id` 聚合文本。
6. 收到完成信号或超时后返回最终 `reply`。
7. 写入会话表和消息表。

## 6.4 并发控制

按 `conversation_id` 做串行队列，禁止同一会话并发发送，避免流式内容交叉。

## 6.5 超时与重试

- 单次问答超时建议：`90s`。
- AionUi WS 断线自动重连；重连后恢复会话映射。
- 问答失败返回标准错误码，不把 AionUi 内部错误原文直接暴露前端。

---

## 7. gdhz 前端改造点（最小化）

只改 AI 发送逻辑，不改 UI 样式：

- 改造 `FloatingToolbar.vue` 的 `sendMessage()`：
  - 从 mock 改为 `POST /api/ai/chat`
  - 返回后写入 `messages`
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

## 阶段 1（本期）

- 新建 BFF。
- 接通 AionUi 登录、WS、会话创建、消息发送、流式聚合。
- 前端 `FloatingToolbar` 改为调用 `/api/ai/chat`。
- 实现用户会话映射与基础历史。

验收标准：

- 多个用户同时问答不串话。
- 同一用户连续提问有上下文。
- 前端无 mock，真实返回 AI 内容。

## 阶段 2（下一期）

- 改为 SSE/WS 前端流式渲染（打字效果）。
- 增加 `/api/ai/confirm` 处理工具调用审批。
- 历史查询分页、会话管理（重命名/删除）。

## 阶段 3（后续）

- 安全加固（HTTPS、鉴权细化、最小暴露、审计）。
- 监控告警、限流、灰度发布。

---

## 10. 风险与规避

1. AionUi 协议变更风险：
- 规避：BFF 封装 `aionui.client.ts` 单点适配，禁止业务层直接依赖协议字段。

2. 单实例 AionUi 性能瓶颈：
- 规避：BFF 限流 + 会话队列；必要时扩展为多 AionUi 实例池。

3. 问答长耗时导致接口超时：
- 规避：本期可先阻塞式 + 90s 超时；下一期切 SSE。

---

## 11. 实施备注（给改造执行方）

1. 本期不要把安全项扩大为阻塞条件（按当前约束执行）。
2. 先保交付：问答可用 + 用户隔离可验证 + 会话可追踪。
3. 所有与 AionUi 的交互统一收敛在 `aionui.client.ts`，不要散落到 controller。

