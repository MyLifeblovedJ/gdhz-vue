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

### 2.4 当前实施阶段（2026-02-27）

当前定位：`gdhz-ai-bff-aionui-implementation-plan.md` 所定义的“阶段2核心能力已完成，审批项待定”。

已完成（可验收）：

1. SSE 流式聊天链路（`POST /api/ai/chat/stream`）。
2. 会话管理（列表/重命名/删除）与历史分页。
3. 会话回收、消息裁剪、会话上限策略配置化。
4. 阶段2验证脚本通过（`doc/verification/stage2-core-verify-2026-02-26T16-57-11.json`，`PASS`）。

待决项（进入阶段3前建议明确）：

1. 是否启用 `/api/ai/confirm` 工具调用审批（当前默认不拦截）。
2. 是否补齐独立 PoC 协议文档（用于替代“仅代码即协议”的交接方式）。

近期前端决策（2026-02-27）：

1. AI 面板模型选择控件移入输入框内，并按模型文本自适应宽度。
2. 模型选择样式采用白色细线边框版本，避免过长背景条。
3. 供应商切换区去外层白边、保留分隔线并放大图标。

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

### 6.4 阶段1专项验证（强制过期 + 并发 + 尾包）

```bash
cd /usr/local/project/dzh/gdhz-vue/bff
AIONUI_PASSWORD='<AionUi密码>' npm run verify:stage1
```

预期：

1. 输出 `[1/3] PASS`、`[2/3] PASS`、`[3/3] PASS`。
2. 最终输出 `总结果: PASS`。
3. 生成报告文件：`/usr/local/project/dzh/gdhz-vue/doc/verification/stage1-closeout-*.json`。

### 6.5 阶段2核心验证（不含审批）

```bash
cd /usr/local/project/dzh/gdhz-vue/bff
npm run verify:stage2
```

预期：

1. 最终输出 `\"result\": \"PASS\"`。
2. 包含 `chatStream`、`historyPagination`、`sessionRename`、`sessionOverflowEviction`、`messageTrim`、`sessionDelete` 等检查项。
3. 生成报告文件：`/usr/local/project/dzh/gdhz-vue/doc/verification/stage2-core-verify-*.json`。

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

### 9.5 AI 问答超时（AionUi 线程数打满）

症状：

1. 前端提示超时或长时间无返回。
2. AionUi 日志出现 `pthread_create: Resource temporarily unavailable`。

排查顺序：

1. `systemctl show aionui-webui.service -p TasksCurrent -p TasksMax`
2. `journalctl -u aionui-webui.service -n 200 --no-pager | grep -E 'pthread_create|Resource temporarily unavailable'`
3. 确认 override 参数包含 `TasksMax=2048`、`LimitNPROC=8192`。
4. 必要时重启：`systemctl restart aionui-webui gdhz-bff`。

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
6. BFF 会话与消息已持久化到本地 JSON（`bff/data/*.json`）。
7. 刷新页面可恢复历史会话，不再默认新建会话 ID。
8. 空闲会话会自动回收（释放 AionUi 运行态 task），历史可继续。
9. `aionui-webui.service` 已启用重启自愈与资源上限（内存/任务数）。
10. 系统已启用 `8G` swap。
11. 阶段2核心接口已可用：`/api/ai/chat/stream`、`/api/ai/history` 分页、`/api/ai/sessions`（查/改名/删）。
12. 后台清理策略已配置化：会话上限、消息上限、标题长度上限。

---

## 14. AI 会话生命周期与关键决策

### 14.1 会话 ID 创建与复用

1. 首次聊天或本地无会话 ID 时，由 BFF 生成 `chatSessionId`。
2. 前端刷新后会从 `localStorage` 恢复 `chatSessionId`，并调用 `/api/ai/history` 回放历史。
3. 切换供应商或模型时，会主动清空当前 `chatSessionId`，新问题触发新会话。

### 14.2 会话隔离键

1. BFF 使用 `tenantId + userId + chatSessionId` 作为隔离键。
2. `tenantId/userId` 由请求头 `x-tenant-id/x-user-id` 决定。
3. 前端会持久化 `x-user-id`（`gdhz.ai.userId.v1`），保证刷新后仍是同一用户身份。

### 14.3 持久化与恢复

1. 会话映射：`bff/data/ai-sessions.json`
2. 消息历史：`bff/data/ai-messages.json`
3. BFF 重启后会自动恢复会话与历史，不再丢失上下文映射。

### 14.4 自动回收与过期

1. 空闲阈值：`AI_SESSION_IDLE_RELEASE_MS`（当前 `600000`，10 分钟）。
2. 扫描间隔：`AI_SESSION_RECYCLE_SCAN_INTERVAL_MS`（当前 `30000`，30 秒）。
3. 回收动作：调用 AionUi `reset-conversation`，会话状态改为 `released`。
4. 历史消息不删除；用户继续发言时同 `chatSessionId` 会恢复为 `active`，并重建新的上游 `conversation_id`。

### 14.5 会话状态语义

1. `active`：会话可用/最近活跃。
2. `error`：最近一次调用失败。
3. `released`：运行态已释放，历史保留，可重新激活。

### 14.6 上限与裁剪策略（阶段2）

1. 每用户会话上限：`AI_MAX_SESSIONS_PER_USER`（默认 `50`）。
2. 单会话消息上限：`AI_MAX_MESSAGES_PER_SESSION`（默认 `200`）。
3. 会话标题最大长度：`AI_SESSION_TITLE_MAX_LENGTH`（默认 `80`）。
4. 达到会话上限时，按 `updatedAt` 淘汰旧会话，并同步删除其历史消息。
5. 达到消息上限时，按时间滚动裁剪最旧消息。

---

## 15. systemd 与资源治理基线

### 15.1 `aionui-webui.service`

配置路径：

1. 主配置：`/etc/systemd/system/aionui-webui.service`
2. override：`/etc/systemd/system/aionui-webui.service.d/override.conf`

关键参数（当前）：

1. `Restart=always`
2. `RestartSec=5`
3. `MemoryHigh=3584M`
4. `MemoryMax=5120M`
5. `TasksMax=2048`
6. `LimitNPROC=8192`
7. `StartLimitIntervalSec=300`
8. `StartLimitBurst=10`

### 15.2 `gdhz-bff.service`

配置路径：

1. 服务文件：`/etc/systemd/system/gdhz-bff.service`
2. 环境文件：`/etc/gdhz/gdhz-bff.env`（建议权限 `600`）

关键要求：

1. `AIONUI_PASSWORD` 只放在 `EnvironmentFile`，不要写在命令行和仓库。
2. `gdhz-bff.service` 与 `aionui-webui.service` 均启用开机自启。
3. 当前重启与资源参数：
   - `Restart=always`
   - `RestartSec=5`
   - `MemoryHigh=768M`
   - `MemoryMax=1024M`
   - `TasksMax=128`

### 15.3 swap 与内核参数

配置路径：

1. swap：`/swapfile`
2. 持久化挂载：`/etc/fstab`
3. 内核参数：`/etc/sysctl.d/99-swap-tuning.conf`

当前参数：

1. `swap=8G`
2. `vm.swappiness=10`
3. `vm.vfs_cache_pressure=50`

---

## 16. 关键验收命令（会话治理专项）

```bash
# 1) 看会话是否持久化
ls -lh /usr/local/project/dzh/gdhz-vue/bff/data

# 2) 看当前服务资源上限是否生效
systemctl show aionui-webui.service -p MemoryHigh -p MemoryMax -p TasksMax -p Restart

# 3) 看 BFF 环境文件是否接管密码（输出前请注意脱敏）
systemctl show gdhz-bff.service -p EnvironmentFiles

# 4) 看 swap 状态
free -h
swapon --show

# 5) 跑阶段2核心验收（不依赖外部模型）
cd /usr/local/project/dzh/gdhz-vue/bff && npm run verify:stage2
```
