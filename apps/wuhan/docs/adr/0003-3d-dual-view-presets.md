# ADR-0003: 3D 双视角预设（当前业务视角 + 5173 复刻视角）

## Status

Accepted

## Date

2026-03-04

## Context

近期 3D 视角调优频繁，存在两个稳定需求：

1. 业务演示默认视角：南海 + 广东整体构图（当前需求）。
2. 历史复刻视角：与 `welcome-5173` 一致的飞入落点，用于对齐验收和回归。

如果仅保留单一参数，后续 AI 或维护人员容易误改导致体验偏移，且无法快速回滚到已确认视角。

## Decision

在 `MapContainer.vue` 中固定两个 3D 视角预设，并提供 UI 切换：

- `decision`（默认）
  - `destination`: `lng=112.3, lat=11.9, height=1080000`
  - `orientation`: `heading=4deg, pitch=-46deg, roll=0`
- `legacy5173`（复刻）
  - `destination`: `lng=113.5, lat=22.5, height=1500000`
  - `orientation`: `null`（与 welcome-5173 保持一致，使用原始 flyTo 方式）

行为约束：

1. 默认预设固定为 `decision`。
2. `2D -> 3D` 切换动画完成后，飞入当前激活预设。
3. 3D 下点击“复位”时，回到当前激活预设。
4. 底部控件在 3D 模式显示“当前 / 5173”切换按钮，用户可自由切换。

## Non-Negotiable Guardrails

后续改动禁止：

1. 删除任一预设参数但不更新文档。
2. 改动 `decision` 或 `legacy5173` 参数后不做 ADR 变更记录。
3. 将默认预设从 `decision` 改为其他值而不经过产品确认。

## Verification Checklist

1. 启动后进入 3D，默认应为 `decision` 视角。
2. 点击底部“5173”，镜头应飞入 `lng=113.5, lat=22.5, height=1500000`。
3. 点击底部“当前”，镜头应回到 `decision` 视角。
4. 在 2D 下切回 3D，落点应为当前激活预设。
5. 运行 `npm run build` 通过。

## Related

- `docs/3d-view-presets.md`
- `docs/adr/0002-2d-to-3d-transition-replay-5173-flyin.md`
- `apps/welcome-5173/src/components/MapStage.vue`
