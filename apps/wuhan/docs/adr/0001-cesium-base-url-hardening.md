# ADR-0001: Cesium 资源基路径固定，避免 3D 黑屏

## Status

Accepted

## Date

2026-03-04

## Context

`2999` 模块出现 3D 黑屏，控制台报错：

- `Uncaught (in promise) SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`
- 触发点在 Cesium 内部 `JSON.parse(...)`。

根因是 Cesium 资源路径在部分时序下解析为 `/Assets/...`（错误），服务返回 `index.html`，被当作 JSON 解析后抛错，最终导致 3D 场景初始化异常。

已验证的现象：

- 正确路径：`/cesium/Assets/approximateTerrainHeights.json` -> `application/json`
- 错误路径：`/Assets/approximateTerrainHeights.json` -> `text/html`（`index.html`）

## Decision

在应用入口强制固定 Cesium 基路径，双保险设置：

1. `window.CESIUM_BASE_URL = '/cesium/'`
2. `buildModuleUrl.setBaseUrl('/cesium/')`

实现位置：

- `src/main.js`

## Rationale

- 仅依赖 `window.CESIUM_BASE_URL` 在模块加载时序上不够稳健。
- `buildModuleUrl.setBaseUrl(...)` 是 Cesium 官方模块 URL 解析入口，能稳定覆盖 `Assets/Workers/ThirdParty/Widgets` 等资源定位。
- 与 `vite-plugin-cesium` 生成的 `/cesium` 静态资源目录一致。

## Non-Negotiable Guardrails

后续改动 `2999` 地图初始化时，以下项禁止删除或回退：

1. 不得移除 `src/main.js` 中的 `buildModuleUrl.setBaseUrl('/cesium/')`。
2. 不得将 `window.CESIUM_BASE_URL` 改为 `/Assets`、相对路径或空值。
3. 不得在未验证情况下改动 `vite-plugin-cesium` 插件挂载。
4. 若调整部署子路径（非根路径），必须同步调整上述 base URL 并做回归验证。

## Verification Checklist (改动前后都要跑)

1. 启动服务：`npm run dev`
2. 打开 3D 页面，确认无黑屏。
3. 浏览器 Network 验证：
   - `/cesium/Assets/approximateTerrainHeights.json` 返回 `200` 且 `content-type` 为 JSON。
   - 不应出现 `/Assets/approximateTerrainHeights.json` 请求。
4. 控制台不应出现 `Unexpected token '<' ... is not valid JSON`。
5. 构建验证：`npm run build`。

## Consequences

### Positive

- 消除 Cesium JSON 资源误路由导致的 3D 黑屏。
- 路径行为稳定，可预测，可验证。

### Negative

- 对入口初始化顺序提出硬约束（必须先配置 base URL 再使用 Cesium）。

## Related

- `docs/2999-layout-map-mode.md`

