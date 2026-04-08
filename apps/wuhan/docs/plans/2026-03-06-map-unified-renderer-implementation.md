# 地图统一 Renderer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将设备、台风、船舶的 2D/3D 渲染统一到一套共享 renderer spec，以 2D 为基准实现视觉和交互一致。

**Architecture:** 新增纯函数 `icon factory + render spec`，由 Leaflet 和 Cesium adapter 消费同一份渲染描述。`MapContainer.vue` 不再分别决定颜色、尺寸、线型和 tooltip/popup 内容，只负责把 spec 应用到地图实例。

**Tech Stack:** Vue 3, Pinia, Leaflet, Cesium, Vitest, Vite

---

### Task 1: 为统一 icon factory 写失败测试

**Files:**
- Create: `src/utils/mapIconFactory.test.js`
- Create: `src/utils/mapIconFactory.js`

**Step 1: Write the failing test**

- 断言设备图标在同一状态下生成稳定 data-uri
- 断言船舶图标会编码航向与状态
- 断言台风图标 data-uri 唯一稳定

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/mapIconFactory.test.js`

Expected: FAIL with missing module

**Step 3: Write minimal implementation**

- 实现设备 / 船舶 / 台风 SVG data-uri 工厂

**Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/mapIconFactory.test.js`

Expected: PASS

### Task 2: 为统一 render spec 写失败测试

**Files:**
- Create: `src/utils/mapRenderSpec.test.js`
- Create: `src/utils/mapRenderSpec.js`

**Step 1: Write the failing test**

- 断言设备 spec 在 2D/3D 共用相同图标、尺寸、popup 内容
- 断言台风 spec 在 2D/3D 共用相同路径、风圈、tooltip 内容
- 断言船舶 spec 在 2D/3D 共用相同图标、状态颜色、popup 内容

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/mapRenderSpec.test.js`

Expected: FAIL with missing module

**Step 3: Write minimal implementation**

- 实现三类 render spec 纯函数

**Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/mapRenderSpec.test.js`

Expected: PASS

### Task 3: 让 Leaflet 改为消费统一 spec

**Files:**
- Modify: `src/components/map/MapContainer.vue`
- Reference: `src/utils/mapRenderSpec.js`
- Reference: `src/utils/mapIconFactory.js`

**Step 1: Write/extend failing test**

- 在 spec 测试里断言 Leaflet 侧依赖字段已齐备

**Step 2: Run tests to verify failure**

Run: `npm test -- src/utils/mapRenderSpec.test.js`

Expected: FAIL if字段不完整

**Step 3: Write minimal implementation**

- 设备、台风、船舶 2D 渲染全部改为消费 spec
- 去掉内联样式和分散的颜色/尺寸判断

**Step 4: Run tests**

Run: `npm test -- src/utils/mapRenderSpec.test.js`

Expected: PASS

### Task 4: 让 Cesium 改为消费同一份 spec

**Files:**
- Modify: `src/components/map/MapContainer.vue`
- Reference: `src/utils/mapRenderSpec.js`
- Reference: `src/utils/mapIconFactory.js`

**Step 1: Write/extend failing test**

- 在 spec 测试里断言 Cesium 所需字段与 Leaflet 相同

**Step 2: Run tests**

Run: `npm test -- src/utils/mapRenderSpec.test.js`

Expected: FAIL if字段不完整

**Step 3: Write minimal implementation**

- Cesium 设备、台风、船舶全部改为消费同一份 icon / line / polygon spec
- 统一 popup/tooltip 内容模板和标签规则

**Step 4: Run tests**

Run: `npm test -- src/utils/mapRenderSpec.test.js`

Expected: PASS

### Task 5: 对齐首页默认 3D 与交互接线

**Files:**
- Modify: `src/views/HomeOverview.vue`
- Modify: `src/utils/homeMapMode.js`
- Modify: `src/utils/homeMapMode.test.js`

**Step 1: Verify failing expectation if needed**

Run: `npm test -- src/utils/homeMapMode.test.js`

Expected: PASS after current baseline; keep it green

**Step 2: Minimal implementation**

- 只保留页面级事件接线
- 不在页面层处理渲染分叉

**Step 3: Re-run test**

Run: `npm test -- src/utils/homeMapMode.test.js`

Expected: PASS

### Task 6: 全量验证

**Files:**
- Verify only

**Step 1: Run focused tests**

Run: `npm test -- src/utils/homeMapMode.test.js src/utils/deviceVisuals.test.js src/utils/typhoonVisuals.test.js src/utils/mapIconFactory.test.js src/utils/mapRenderSpec.test.js src/data/typhoonDataParser.test.js`

Expected: PASS

**Step 2: Run build**

Run: `npm run build`

Expected: build succeeds

**Step 3: Manual checks**

- 默认 `3D`
- `2D/3D` 下设备、台风、船舶图标一致
- `2D/3D` 下台风路径、风圈颜色与线型一致
- `2D/3D` 下 popup/tooltip 内容和触发规则一致
