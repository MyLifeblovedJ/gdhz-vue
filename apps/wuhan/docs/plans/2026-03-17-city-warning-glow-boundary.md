# City Warning Glow Boundary Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将风暴潮城市预警从整块填充改为边界发光提醒，减少对地图底图的干扰。

**Architecture:** 保持现有预警城市识别与缩放显隐逻辑不变，只替换 2D/3D 的渲染表现。2D 用双 `polyline` glow，3D 用双 `polyline entity` glow，不再绘制城市预警 polygon 填充。

**Tech Stack:** Vue 3、Leaflet、Cesium、Vitest

---

### Task 1: 锁定边界发光渲染测试

**Files:**
- Modify: `apps/gdhz-vue-2999/src/components/map/MapContainer.test.js`

**Step 1: Write the failing test**

- 断言存在预警边界 glow 配置常量
- 断言 2D 使用两条 `L.polyline`
- 断言 3D 使用两条 `polyline` entity
- 断言旧的 `fillOpacity: 0.55` 城市填充已移除

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/map/MapContainer.test.js`

Expected: 失败，当前仍是城市填充方案

**Step 3: Write minimal implementation**

- 补齐新的常量和渲染逻辑

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/map/MapContainer.test.js`

Expected: 通过

### Task 2: 实现 2D/3D 城市预警 glow 边界

**Files:**
- Modify: `apps/gdhz-vue-2999/src/components/map/MapContainer.vue`

**Step 1: Replace 2D rendering**

- 删除城市填充 polygon
- 增加 glow polyline + 主边界 polyline

**Step 2: Replace 3D rendering**

- 删除 polygon entity
- 增加 glow polyline entity + 主边界 polyline entity

**Step 3: Keep visibility flow intact**

- 保持缩放控制、预警城市筛选、标签层级与省界逻辑不变

### Task 3: 验证

**Files:**
- Test: `apps/gdhz-vue-2999/src/components/map/MapContainer.test.js`

**Step 1: Run focused verification**

Run: `npm test -- src/components/map/MapContainer.test.js`

Expected: 通过

**Step 2: Run build**

Run: `npm run build`

Expected: 构建通过
