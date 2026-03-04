# ADR-0005: 2D 交互态（手型）下滚轮缩放偶发卡住排查记录

## Status

Investigating

## Date

2026-03-04

## Context

在 `gdhz-vue-2999` 的 2D（Leaflet）地图中，用户反馈：

1. 鼠标移入沿海城市相关可交互区域后会变成手型（这是预期行为，需保留点击详情）。
2. 页面刷新后的早期阶段（约前 10~60 秒）更容易出现滚轮缩放卡顿/失效。
3. 随时间推移，该问题触发概率下降，但未完全消失。

该问题已与 Gemini 联合分析（`CCB_REQ_ID: 20260304-155159-941-38756-17`），结论为：
高概率是“初始化期主线程负载 + 交互命中检测 + wheel 事件竞争”叠加导致。

## Reproduction

1. 打开 `http://localhost:2999`，硬刷新页面。
2. 在 10 秒内将鼠标移动到会出现手型的地图可交互区域。
3. 连续滚动滚轮进行缩放。
4. 观察到偶发：滚轮无响应或短时卡住。

## Decision (Current Mitigation)

在不牺牲“手型 + 点击详情”能力的前提下，先实施事件通道级缓解：

1. 2D 地图启用 `preferCanvas: true`，降低初始化期渲染压力。
2. 关闭 Leaflet 内置滚轮缩放：`scrollWheelZoom: false`。
3. 在地图外层容器捕获 `wheel`（`passive: false, capture: true`），统一转为 `setZoomAround(...)`。
4. 使用 `requestAnimationFrame` 合并滚轮事件（wheel coalescing），减少高频 wheel 抢占。
5. 仅当鼠标坐标位于地图矩形内时触发自定义缩放，避免误捕获非地图区域。

涉及文件：

- `src/components/map/MapContainer.vue`

## Result

1. 问题复现概率显著下降。
2. 但在刷新早期窗口（约前 10 秒）仍存在偶发“手型状态下滚轮卡住”。
3. 结论：当前方案为“有效缓解”，尚未达到“完全消除”。

## Non-Negotiable Guardrails

后续修复必须遵守：

1. 不得通过取消手型或禁用点击来“规避”问题。
2. 不得回退为全局禁用交互图层（会损失业务详情能力）。
3. 修复应优先保证“交互可用性 + 缩放连续性”，再做视觉优化。

## Next Investigation Plan

1. 增加短期开关式调试埋点（仅开发环境）：
   - 记录 wheel 捕获次数、命中地图矩形次数、实际执行 zoom 次数。
   - 记录卡住时是否有 Long Task（>50ms）。
2. 使用 Chrome Performance 在刷新后 30 秒窗口抓取轨迹：
   - 重点看 Main Thread Long Task、事件处理时长、Layout/Paint 峰值。
3. 对复杂行政区几何做预处理对比实验：
   - 原始 GeoJSON vs 简化后 GeoJSON（简化精度分档）。
   - 比较交互命中和滚轮响应差异。
4. 检查是否存在第三方/组件层的 wheel 监听竞争：
   - Overlay 面板、弹窗、时间轴等组件是否在捕获阶段拦截 wheel。
5. 若证实是初始化高负载导致：
   - 将重绘任务分帧（`requestIdleCallback` / 分批渲染）；
   - 避免首屏集中构建过多 path/label 实体。

## Verification Checklist (for Future Closure)

1. 刷新后前 10 秒内，在手型区域连续滚轮缩放无卡顿。
2. 刷新后前 60 秒内，在手型区域连续滚轮缩放无失效。
3. 点击详情能力保持正常（手型、点击弹窗、业务联动不退化）。
4. `npm run build` 通过。

