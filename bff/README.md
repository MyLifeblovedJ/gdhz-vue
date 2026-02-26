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
- 会话路由与消息历史先使用内存存储（后续可替换数据库）。
