# 3D 视角预设复刻手册

本文档用于防止后续改动丢失 3D 相机参数。

## 预设清单

### 1) 当前业务视角（默认）

- key: `decision`
- destination: `lng=112.3, lat=11.9, height=1080000`
- orientation:
  - `heading=4deg`
  - `pitch=-46deg`
  - `roll=0`
- 用途：南海+广东业务演示默认视角。

### 2) 5173 复刻视角

- key: `legacy5173`
- destination: `lng=113.5, lat=22.5, height=1500000`
- orientation: `null`（与 `welcome-5173/src/components/MapStage.vue` 一致）
- 用途：历史版本对齐、回归验证、演示对照。

## 代码位置

- 预设定义：`src/components/map/MapContainer.vue` 的 `THREE_D_VIEW_PRESETS`
- 2D->3D 切换落点：`applyCesiumMapMode()`
- 复位落点：`resetView()`
- 手动切换入口：`BottomControls.vue` 的“当前 / 5173”按钮

## 验收步骤

1. 页面进入 3D，默认应为 `decision`。
2. 点击“5173”，镜头飞到 `113.5, 22.5, 1500000`。
3. 点击“当前”，镜头回到 `112.3, 11.9, 1080000`。
4. 切到 2D 再切回 3D，应落在当前选中的预设。

## 变更规则

若调整任意预设参数，必须同步更新：

1. 本文档。
2. `docs/adr/0003-3d-dual-view-presets.md`。
