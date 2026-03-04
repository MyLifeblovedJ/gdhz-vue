# ADR-0002: 2D->3D 切换复播 welcome-5173 飞入动画

## Status

Accepted

## Date

2026-03-04

## Context

在 `gdhz-vue-2999` 的地图模式切换中，`2D -> 3D` 曾出现两类体验问题：

1. 直接停留在远景地球，用户需要二次操作才能回到业务视角。
2. 强行对齐 2D 当前尺度时，镜头跳动突兀，不符合既有产品体验。

产品基准明确为 `welcome-5173` 的动画风格：切换后有完整飞入过程，且落点稳定在广东业务视角。

## Decision

`2D -> 3D` 统一采用“两步动画”：

1. 执行 `viewer.scene.morphTo3D(0.6)` 完成场景维度切换。
2. 切换完成后自动执行一次 `camera.flyTo(...)`，复播 welcome-5173 飞入动画。

固定落点参数：

- `Cartesian3.fromDegrees(113.5, 22.5, 1500000)`
- `duration: 1.8`

初始化与复位保持同一默认视角，避免同页面不同入口出现镜头不一致。

## Rationale

- 兼顾一致性与可预期性：行为与 `welcome-5173` 对齐。
- 避免远景停留造成“黑屏/迷航”感。
- 避免强制按 Leaflet 尺度换算造成的突兀镜头跳变。

## Non-Negotiable Guardrails

后续改动地图模式切换时，禁止：

1. 删除 `2D -> 3D` 后的自动 `flyTo`。
2. 将切换后的默认落点改为无业务语义的远景地球。
3. 在无体验验收情况下引入“2D 尺度硬对齐”的相机跳转。

## Verification Checklist

1. 在 2D 下任意平移/缩放后切换到 3D。
2. 确认出现“切换 + 飞入”完整动画，而非停在远景。
3. 飞入落点应稳定在广东业务区域（`113.5, 22.5` 附近）。
4. 运行 `npm run build` 确认无编译错误。

## Related

- `docs/adr/0001-cesium-base-url-hardening.md`
- `apps/welcome-5173/src/components/MapStage.vue`

