# Warning Boundary Palette Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 优化城市预警 glow 边界与广东省界的配色，使橙黄更易区分，并确保浅色底图下省界仍清晰可读。

**Architecture:** 保持当前 2D/3D glow 边界渲染逻辑不变，只调整预警等级颜色常量和省界颜色常量。测试继续采用源码结构断言，避免引入额外渲染测试基础设施。

**Tech Stack:** Vue 3、Leaflet、Cesium、Vitest

---

### Task 1: 锁定配色常量测试

**Files:**
- Modify: `apps/gdhz-vue-2999/src/components/map/MapContainer.test.js`

**Step 1: Write the failing test**

- 断言橙色为 `#FF8A3D`
- 断言黄色为 `#FFD84A`
- 断言省界颜色为 `#CFE8FF`

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/map/MapContainer.test.js`

Expected: 失败，当前颜色常量仍为旧值

**Step 3: Write minimal implementation**

- 更新 `MapContainer.vue` 中的颜色常量

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/map/MapContainer.test.js`

Expected: 通过

### Task 2: 验证构建

**Files:**
- Test: `apps/gdhz-vue-2999/src/components/map/MapContainer.test.js`

**Step 1: Run focused verification**

Run: `npm test -- src/components/map/MapContainer.test.js`

Expected: 通过

**Step 2: Run build**

Run: `npm run build`

Expected: 构建通过
