# gdhz-bff（阶段1基线）

## 1. 安装与启动

```bash
cd bff
npm install
cp .env.example .env
# 只需填写 AIONUI_PASSWORD（模型配置可保持默认）
npm run dev
```

默认监听：`http://127.0.0.1:3001`

## 2. 已实现接口

- `POST /api/ai/chat`
- `POST /api/ai/summary/current`
- `GET /api/ai/history?chatSessionId=...`
- `GET /api/ai/catalog`
- `GET /api/health`

## 3. 当前实现说明

- 已接入 AionUi：`/login` + WebSocket + `create-conversation` + `chat.send.message` + `chat.response.stream`。
- 已接入 AionUi 目录：`/api/ai/catalog`（读取 AionUi 本地配置 + `acpTypes.ts` 探测规则，不改 AionUi 代码）。
- 默认走 CLI 登录态，不依赖模型 API Key。
- 已实现心跳 `ping/pong`。
- 已实现 CSRF + cookie 维护，并优先使用 `/api/auth/refresh` 做 token 续期。
- 会话与消息为本地 JSON 持久化：
  - `data/ai-sessions.json`
  - `data/ai-messages.json`
- 会话隔离键：`tenantId + userId + chatSessionId`。
- 会话空闲自动回收：
  - 回收阈值 `AI_SESSION_IDLE_RELEASE_MS`（默认 30 分钟）
  - 扫描间隔 `AI_SESSION_RECYCLE_SCAN_INTERVAL_MS`（默认 60 秒）
  - 回收动作：调用 AionUi `reset-conversation`，会话状态标记为 `released`，历史消息保留。

## 4. 关键环境变量（会话治理）

- `AI_STORE_DIR`：持久化目录（默认 `bff/data`）。
- `AI_SESSION_STORE_FILE`：会话存储文件（默认 `data/ai-sessions.json`）。
- `AI_MESSAGE_STORE_FILE`：消息存储文件（默认 `data/ai-messages.json`）。
- `AI_SESSION_IDLE_RELEASE_MS`：空闲会话释放阈值（默认 `1800000`）。
- `AI_SESSION_RECYCLE_SCAN_INTERVAL_MS`：回收扫描间隔（默认 `60000`）。

## 5. 阶段1专项验证脚本

```bash
cd bff
AIONUI_PASSWORD='<AionUi密码>' npm run verify:stage1
```

脚本会依次验证：

- `auth-expired -> refresh/login -> WS 重建`
- 双用户并发隔离（不同 `x-user-id`）
- 同会话尾包干扰场景（第二问不混入第一问）

并在 `../doc/verification/` 生成 JSON 报告。
