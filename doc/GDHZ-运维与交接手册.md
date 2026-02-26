# GDHZ 运维与交接手册

## 1. 文档目的

本手册用于指导以下工作：

1. 日常运维巡检与故障处理。
2. 版本更新后的发布与回滚。
3. 其他 AI/工程师接手时快速建立上下文。

适用环境：当前线上部署主机（单机部署，`nginx + gdhz-vue + bff + AionUi + mihomo`）。

---

## 2. 当前架构与访问拓扑

### 2.1 对外入口（公网）

只对外开放：

1. `22/tcp`：SSH 运维。
2. `3000/tcp`：统一 Web 入口（由 `nginx` 提供）。

### 2.2 对内服务（本机回环/内网）

1. `gdhz-vue`（Vite）监听 `127.0.0.1:3100`。
2. `gdhz-bff` 监听 `*:3001`。
3. `AionUi` 监听 `*:25808`（通过防火墙阻断公网直连）。
4. `mihomo` 监听 `*:9090`（通过防火墙阻断公网直连）。

### 2.3 统一访问路径（用户侧）

1. `http://<IP>:3000/` -> gdhz 前端。
2. `http://<IP>:3000/aionui/` -> AionUi WebUI（含模型供应商/模型管理）。
3. `http://<IP>:3000/mihomo/` -> mihomo 仪表盘（zashboard）。
4. `http://<IP>:3000/mihomo-api/*` -> mihomo API（nginx 注入鉴权头）。

---

## 3. 关键配置文件

### 3.1 代码仓库

1. 仓库根目录：`/usr/local/project/dzh/gdhz-vue`
2. 前端目录：`/usr/local/project/dzh/gdhz-vue/gdhz-vue`
3. BFF 目录：`/usr/local/project/dzh/gdhz-vue/bff`

### 3.2 systemd

1. 前端服务：`/etc/systemd/system/gdhz-frontend.service`
2. BFF 服务：`/etc/systemd/system/gdhz-bff.service`
3. BFF 环境变量：`/etc/gdhz/gdhz-bff.env`

### 3.3 反向代理

1. nginx 站点配置：`/etc/nginx/sites-available/gdhz-proxy`
2. 启用链接：`/etc/nginx/sites-enabled/gdhz-proxy`

### 3.4 防火墙

1. `ufw` 负责公网入口收口。
2. 目标策略：允许 `22/3000`，拒绝 `25808/9090`。

---

## 4. 启动与重启流程

### 4.1 查看服务状态

```bash
systemctl is-active nginx
systemctl is-active gdhz-frontend
systemctl is-active gdhz-bff
```

### 4.2 重启（推荐顺序）

```bash
systemctl restart gdhz-frontend
systemctl restart gdhz-bff
systemctl restart nginx
```

### 4.3 开机自启检查

```bash
systemctl is-enabled gdhz-frontend
systemctl is-enabled gdhz-bff
systemctl is-enabled nginx
```

---

## 5. 变更发布流程（标准）

### 5.1 拉取代码并安装依赖

```bash
cd /usr/local/project/dzh/gdhz-vue
git pull --ff-only
cd gdhz-vue && npm install
cd ../bff && npm install
```

### 5.2 配置核对

核对以下是否符合线上预期：

1. `/etc/gdhz/gdhz-bff.env` 中 `AIONUI_BASE_URL`、`BFF_ALLOWED_ORIGINS`、`BFF_AI_VISIBLE_BACKENDS`。
2. `/etc/nginx/sites-available/gdhz-proxy` 中 `/aionui/`、`/aionui-ws`、`/mihomo/`、`/mihomo-api/`。
3. `gdhz-vue/vite.config.js` 是否启用 `VITE_HOST`/`VITE_PORT` 环境化监听。

### 5.3 生效

```bash
nginx -t
systemctl restart gdhz-frontend
systemctl restart gdhz-bff
systemctl restart nginx
```

---

## 6. 发布后验收（必须）

### 6.1 HTTP 验收

```bash
curl -sS -o /tmp/out -w '%{http_code}\n' http://127.0.0.1:3000/
curl -sS -o /tmp/out -w '%{http_code}\n' http://127.0.0.1:3000/aionui/
curl -sS -o /tmp/out -w '%{http_code}\n' http://127.0.0.1:3000/mihomo/
curl -sS -o /tmp/out -w '%{http_code}\n' http://127.0.0.1:3000/mihomo-api/version
```

预期：

1. `/` 为 `200`。
2. `/aionui/` 为 `200`。
3. `/mihomo/` 为 `200`（仪表盘 HTML）。
4. `/mihomo-api/version` 为 `200` 且返回版本 JSON。

### 6.2 AI 目录接口验收

```bash
curl -sS http://127.0.0.1:3000/api/ai/catalog | jq '.providers[].backend'
```

预期只包含：

1. `gemini`
2. `codex`

### 6.3 聊天接口验收

```bash
curl -sS -H 'Content-Type: application/json' \
  -X POST http://127.0.0.1:3000/api/ai/chat \
  -d '{"message":"你好","selection":{"backend":"gemini"}}'
```

预期：

1. HTTP `200`。
2. 返回包含真实 `reply`，不是演示兜底文案。

---

## 7. 端口与安全策略

### 7.1 UFW 目标规则

```bash
ufw status numbered
```

应满足：

1. `ALLOW IN 22/tcp`
2. `ALLOW IN 3000/tcp`
3. `DENY IN 25808/tcp`
4. `DENY IN 9090/tcp`

### 7.2 云厂商安全组

建议与 UFW 保持一致，避免双重放行不一致：

1. 放行 `22`、`3000`。
2. 关闭 `25808`、`9090` 公网入口。

---

## 8. 日常巡检清单（建议每日/每次发布后）

1. `systemctl is-active` 三服务状态。
2. `nginx -t` 配置有效性。
3. `curl` 验证四个关键 URL（`/`、`/aionui/`、`/mihomo/`、`/mihomo-api/version`）。
4. `curl /api/ai/catalog` 检查供应商是否仍为 `gemini/codex`。
5. 浏览器人工抽检：
`http://<IP>:3000/aionui/#/guid` 模型供应商和模型列表能正常显示。

---

## 9. 常见故障与处理

### 9.1 `http://<IP>:3000/aionui/` 白屏

排查顺序：

1. 检查 nginx 是否包含 `/aionui/` 的 `sub_filter` 规则。
2. 检查是否存在 `/aionui-ws` 路由。
3. 强刷浏览器缓存（`Ctrl+F5`）后重试。
4. 查看 `nginx access/error` 是否有静态资源 404/5xx。

### 9.2 `#/guid` 没有模型供应商/模型

排查顺序：

1. 确认登录状态：`/aionui/login` 重新登录。
2. 确认 AionUi WebSocket 走 `3000/aionui-ws`。
3. 检查 `gdhz-bff` 与 `AionUi` 连通：`AIONUI_BASE_URL=http://127.0.0.1:25808`。
4. 检查 `/api/ai/catalog` 是否返回 `providers`。

### 9.3 聊天回复变成演示兜底文案

排查顺序：

1. 检查前端是否是最新代码（已移除 mock fallback）。
2. 检查 BFF CORS：`BFF_ALLOWED_ORIGINS=*` 或正确白名单。
3. 直接调 `POST /api/ai/chat`，确认服务端是否正常返回。

### 9.4 外部访问返回 502

排查顺序：

1. `systemctl status nginx gdhz-frontend gdhz-bff`。
2. `tail -n 100 /var/log/nginx/error.log`。
3. `ss -ltnp` 检查 `3100/3001/25808/9090` 是否监听。
4. `curl 127.0.0.1` 本机链路验证，区分“应用问题”与“公网链路问题”。

---

## 10. 日志与诊断命令

### 10.1 nginx

```bash
tail -n 200 /var/log/nginx/access.log
tail -n 200 /var/log/nginx/error.log
```

### 10.2 systemd

```bash
journalctl -u gdhz-frontend -n 200 --no-pager
journalctl -u gdhz-bff -n 200 --no-pager
journalctl -u nginx -n 200 --no-pager
```

### 10.3 端口监听

```bash
ss -ltnp | egrep ':(80|3000|3001|3100|25808|9090)\b'
```

---

## 11. 回滚流程

### 11.1 代码回滚

```bash
cd /usr/local/project/dzh/gdhz-vue
git log --oneline -n 20
git checkout <稳定提交SHA>
systemctl restart gdhz-frontend
systemctl restart gdhz-bff
```

### 11.2 nginx 回滚

如果存在备份文件（如 `gdhz-proxy.bak.*`）：

```bash
cp /etc/nginx/sites-available/gdhz-proxy.bak.<timestamp> /etc/nginx/sites-available/gdhz-proxy
nginx -t
systemctl restart nginx
```

---

## 12. AI 接手最小上下文

新的 AI 接手时，先读取：

1. 本文档：`doc/GDHZ-运维与交接手册.md`
2. 实施记录：`doc/gdhz-ai-bff-aionui-implementation-plan.md`
3. 关键代码：
`bff/src/app.js`、`bff/src/shared/config.js`、`bff/src/modules/ai/ai.service.js`、`gdhz-vue/src/components/map/FloatingToolbar.vue`

接手后第一轮动作：

1. 查服务状态。
2. 查监听端口。
3. 跑四条 URL 验收。
4. 查 `catalog` 和 `chat` 接口。
5. 再开始定位业务问题。

---

## 13. 当前基线（2026-02-26）

1. 公网入口统一为 `3000`。
2. `25808/9090` 已通过 UFW 拒绝公网访问。
3. `/aionui` 与 `/mihomo` 均通过 nginx 子路径代理。
4. gdhz 的 AI 供应商列表收敛为 `gemini`、`codex`。
5. 聊天接口已切换为真实后端调用，不使用演示兜底回复。

