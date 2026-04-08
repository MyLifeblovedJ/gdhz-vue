# Sea Condition Home Defaults Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 调整风浪潮首页默认态与海岸观测展示，使页面初始呈现符合新的业务演示要求。

**Architecture:** 保持现有页面结构不变，通过小范围修改默认配置、提取相对时间工具函数、重绘海岸观测小窗模板来完成。测试以 Vitest 为主，优先使用纯函数测试和现有项目风格的源码约束测试，避免引入新的测试依赖。

**Tech Stack:** Vue 3、Vite、Vitest、Pinia

---

### Task 1: 锁定默认地图模式与默认图层

**Files:**
- Modify: `apps/gdhz-vue-2999/src/utils/homeMapMode.test.js`
- Create: `apps/gdhz-vue-2999/src/views/SeaConditionHome.test.js`
- Modify: `apps/gdhz-vue-2999/src/utils/homeMapMode.js`
- Modify: `apps/gdhz-vue-2999/src/views/SeaConditionHome.vue`

**Step 1: Write the failing test**

- 将默认地图模式测试改为断言 `2D`
- 新增风浪潮页源码测试，断言初始化图层里 `coastal_base: false`、`tide_stations: false`

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/homeMapMode.test.js src/views/SeaConditionHome.test.js`

Expected: 至少 1 个失败，表现为当前默认值仍是 `3D` 或图层默认值仍为 `true`

**Step 3: Write minimal implementation**

- 将 `HOME_DEFAULT_MAP_MODE` 改为 `2D`
- 修改风浪潮页默认图层配置

**Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/homeMapMode.test.js src/views/SeaConditionHome.test.js`

Expected: 全部通过

### Task 2: 锁定相对时间文案

**Files:**
- Create: `apps/gdhz-vue-2999/src/utils/relativeTime.js`
- Create: `apps/gdhz-vue-2999/src/utils/relativeTime.test.js`

**Step 1: Write the failing test**

- 覆盖“刚刚”“1分钟前”“59分钟前”“2小时前”

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/relativeTime.test.js`

Expected: 失败，提示模块或方法不存在

**Step 3: Write minimal implementation**

- 实现相对时间格式化函数

**Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/relativeTime.test.js`

Expected: 全部通过

### Task 3: 调整海岸观测小窗与右侧视频区展示

**Files:**
- Create: `apps/gdhz-vue-2999/src/components/layout/CoastalCameraOverlay.test.js`
- Modify: `apps/gdhz-vue-2999/src/components/layout/CoastalCameraOverlay.vue`
- Modify: `apps/gdhz-vue-2999/src/components/layout/RealtimeDataPanel.vue`
- Modify: `apps/gdhz-vue-2999/src/data/mockData.js`

**Step 1: Write the failing test**

- 断言海岸观测小窗使用 `/images/coastal/${item.id}.png`
- 断言模板不再包含风险条与侵蚀速率
- 断言模板包含名称前状态点与相对时间字段

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/layout/CoastalCameraOverlay.test.js`

Expected: 失败，当前模板仍是模拟视频且包含风险条/侵蚀速率

**Step 3: Write minimal implementation**

- 为海岸观测数据补充 `snapshotUrl`
- 小窗改为图片卡片
- 右侧视频主窗改为图片
- 使用相对时间文案
- 名称前显示在线/离线状态点

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/layout/CoastalCameraOverlay.test.js src/utils/relativeTime.test.js`

Expected: 全部通过

### Task 4: 全量回归本次相关测试

**Files:**
- Test: `apps/gdhz-vue-2999/src/utils/homeMapMode.test.js`
- Test: `apps/gdhz-vue-2999/src/views/SeaConditionHome.test.js`
- Test: `apps/gdhz-vue-2999/src/utils/relativeTime.test.js`
- Test: `apps/gdhz-vue-2999/src/components/layout/CoastalCameraOverlay.test.js`

**Step 1: Run focused verification**

Run: `npm test -- src/utils/homeMapMode.test.js src/views/SeaConditionHome.test.js src/utils/relativeTime.test.js src/components/layout/CoastalCameraOverlay.test.js`

Expected: 全部通过

**Step 2: Run broader regression**

Run: `npm test`

Expected: 现有测试不回归；若有与当前工作无关的历史失败，需要单独说明
