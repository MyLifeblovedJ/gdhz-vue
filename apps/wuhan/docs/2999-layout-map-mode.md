# 2999 新版布局与地图模式说明

## 目标
- 2999 Overview 页改为“地图全屏置底 + 组件悬浮覆盖”布局。
- 保留原有左右业务面板内容与逻辑。
- 地图模式支持 Leaflet 2D 与 Cesium 3D，默认 3D。

## 新旧差异
- 旧版（2999 原 Overview）:
  - 三栏布局，左侧 `RightSidebar`、中间 `MapContainer`、右侧 `RealtimeDataPanel` 并排。
  - 地图仅 Leaflet 2D。
  - 风场粒子默认开启。
- 新版（2999 当前 Overview）:
  - `MapContainer` 作为背景层，覆盖全屏（`100vw/100vh`）。
  - `RightSidebar` 与 `RealtimeDataPanel` 绝对定位悬浮于左右两侧。
  - 悬浮容器默认 `pointer-events: none`，内部面板恢复 `pointer-events: auto`，避免误触地图。
  - 地图支持 2D/3D 切换，默认 `3D`，启动后飞行到广东视角（`[113.3, 23.1, 900000m]`）。
  - 风场粒子默认关闭（`layerVisibility.wind_particle = false`）。

## 关键约束
- 仅修改 `apps/gdhz-vue-2999`，不触碰 `3000` 模块。
- 2D/3D 模式通过 store 状态统一（`mapMode`），由底部控件触发切换。
- Leaflet 负责既有设备/台风/船舶等 2D 图层逻辑；Cesium 提供 3D 主视图和可操作相机。
- 切换模式后仍需可操作:
  - 3D: 相机缩放、复位、底图切换可用。
  - 2D: Leaflet 交互与原逻辑保持。

## 影响范围
- `src/views/Overview.vue`：布局改造为全屏地图 + 悬浮面板。
- `src/components/map/MapContainer.vue`：引入 Cesium，双地图容器并存，支持模式切换。
- `src/components/layout/BottomControls.vue`：新增 2D/3D 切换按钮与事件。
- `src/stores/app.js`：新增 `mapMode` 状态及切换方法；风场粒子默认关闭。
- `vite.config.js` / `package.json` / `src/main.js`：Cesium 构建与样式接入。

## 兼容说明
- 旧业务组件内容、事件与 store 业务数据结构保持不变。
- 2D 图层渲染逻辑依旧在 Leaflet 中执行；3D 模式主要作为三维地图视角载体。
