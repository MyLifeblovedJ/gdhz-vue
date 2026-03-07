# 首页全量设备与台风 2D/3D 一致显示 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 让 `2999` 首页在默认 `3D` 下也能显示全量设备和真实台风，并保证 `2D/3D` 使用同一份非对称风圈与路径几何。

**Architecture:** 把设备与台风的视觉模型抽成纯函数工具，由 `MapContainer.vue` 分别映射到 Leaflet 图层和 Cesium 实体。移除首页地图中的 `homeStations` 专用渲染，统一以全量 `devices` 和真实 `typhoonData` 为主数据源。

**Tech Stack:** Vue 3, Pinia, Leaflet, Cesium, Vitest, Vite

---

### Task 1: 写台风视觉模型失败测试

**Files:**
- Create: `src/utils/typhoonVisuals.test.js`
- Create: `src/utils/typhoonVisuals.js`

**Step 1: Write the failing test**

- 断言四象限风圈会生成闭合多边形点集
- 断言同一风圈不会退化成单一圆半径
- 断言真实 `202518` 数据能生成历史路径、预报路径和至少一层风圈

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/typhoonVisuals.test.js`

Expected: FAIL with module-not-found or missing export

**Step 3: Write minimal implementation**

- 实现台风强度颜色映射
- 实现四象限风圈顶点生成
- 实现台风视觉模型构建函数

**Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/typhoonVisuals.test.js`

Expected: PASS

### Task 2: 写设备视觉模型失败测试

**Files:**
- Create: `src/utils/deviceVisuals.test.js`
- Create: `src/utils/deviceVisuals.js`

**Step 1: Write the failing test**

- 断言正常/预警/告警/离线设备映射到稳定颜色
- 断言视觉模型保留经纬度和展示尺寸

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/deviceVisuals.test.js`

Expected: FAIL with module-not-found or missing export

**Step 3: Write minimal implementation**

- 实现设备状态颜色和尺寸映射
- 实现设备视觉模型构建函数

**Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/deviceVisuals.test.js`

Expected: PASS

### Task 3: 恢复首页默认 3D，并去掉地图重点站点专用接线

**Files:**
- Modify: `src/utils/homeMapMode.js`
- Modify: `src/utils/homeMapMode.test.js`
- Modify: `src/views/HomeOverview.vue`

**Step 1: Write the failing test**

- 把首页默认模式断言改回 `3D`

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/homeMapMode.test.js`

Expected: FAIL because current default is `2D`

**Step 3: Write minimal implementation**

- 恢复 `HOME_DEFAULT_MAP_MODE = '3D'`
- 从 `HomeOverview.vue` 移除 `homeStations / selectedHomeStationId / home-station-click` 对 `MapContainer` 的地图接线

**Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/homeMapMode.test.js`

Expected: PASS

### Task 4: 为 MapContainer 补全 3D 全量设备渲染

**Files:**
- Modify: `src/components/map/MapContainer.vue`
- Reference: `src/utils/deviceVisuals.js`

**Step 1: Write the failing test**

- 通过设备视觉模型测试确认全量设备可转换成 3D 可用数据

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/deviceVisuals.test.js`

Expected: FAIL before implementation

**Step 3: Write minimal implementation**

- 新增 `deviceEntities3D`
- 新增 `renderDevices3D()`
- 在 `store.devices` 变化时同时刷新 2D/3D
- 清理 3D 实体，避免重复堆积

**Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/deviceVisuals.test.js`

Expected: PASS

### Task 5: 用共享视觉模型重写 2D/3D 台风渲染

**Files:**
- Modify: `src/components/map/MapContainer.vue`
- Reference: `src/utils/typhoonVisuals.js`

**Step 1: Write the failing test**

- 使用真实 `202518` 数据断言风圈模型和路径模型正确生成

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/typhoonVisuals.test.js`

Expected: FAIL before implementation

**Step 3: Write minimal implementation**

- 2D 改为使用共享风圈点集和路径模型
- 3D 新增 `typhoonEntities3D`
- 渲染历史路径、预报路径、风圈 polygon/outline、当前中心 marker
- 保持 `typhoon_wind_circle`、`typhoon_marker` 等开关可用

**Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/typhoonVisuals.test.js`

Expected: PASS

### Task 6: 端到端验证首页地图

**Files:**
- Verify only

**Step 1: Run focused tests**

Run: `npm test -- src/utils/homeMapMode.test.js src/utils/deviceVisuals.test.js src/utils/typhoonVisuals.test.js src/data/typhoonDataParser.test.js`

Expected: PASS

**Step 2: Run production build**

Run: `npm run build`

Expected: build succeeds

**Step 3: Manual check notes**

- 首页默认进入 `3D`
- `3D` 下可见全量设备与真实台风
- 切到 `2D` 后同样可见
- 风圈为真实四象限多边形，不是等半径圆
