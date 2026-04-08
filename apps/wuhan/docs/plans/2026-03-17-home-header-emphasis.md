# Home Header Emphasis Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 放大首页头部系统标题和导航栏，并让首页头部品牌区与左栏宽度对齐，提升清晰度。

**Architecture:** 在 `AppHeader` 中引入首页专属 `home-emphasis` 样式状态，通过当前页和窗口宽度计算品牌区宽度，只在首页启用放大布局。首页页面同步上调顶部安全距离，避免更高头部遮挡页面内容。

**Tech Stack:** Vue 3、Pinia、VueUse、Vitest

---

### Task 1: 写测试锁定首页头部放大结构

**Files:**
- Create: `apps/gdhz-vue-2999/src/components/layout/AppHeader.test.js`

**Step 1: Write the failing test**

- 断言 `AppHeader` 有 `home-emphasis` 类切换
- 断言存在首页专属宽度计算函数
- 断言品牌区和导航字号/间距被放大

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/layout/AppHeader.test.js`
Expected: FAIL，因为当前头部没有首页专属放大逻辑

### Task 2: 实现首页头部放大与左栏对齐

**Files:**
- Modify: `apps/gdhz-vue-2999/src/components/layout/AppHeader.vue`
- Modify: `apps/gdhz-vue-2999/src/views/HomeOverview.vue`

**Step 1: Write minimal implementation**

- 在 `AppHeader` 中增加首页态判断
- 复用首页左栏宽度公式计算品牌区宽度
- 放大标题、logo、导航字号和间距
- 在 `HomeOverview` 中上调头部安全距

**Step 2: Run targeted tests**

Run: `npm test -- src/components/layout/AppHeader.test.js src/views/HomeOverview.test.js`
Expected: PASS

### Task 3: 回归验证

**Files:**
- Test: `apps/gdhz-vue-2999/src/components/layout/AppHeader.test.js`
- Test: `apps/gdhz-vue-2999/src/views/HomeOverview.test.js`
- Test: `apps/gdhz-vue-2999/src/views/SeaConditionHome.test.js`

**Step 1: Run validation**

Run: `npm test -- src/components/layout/AppHeader.test.js src/views/HomeOverview.test.js src/views/SeaConditionHome.test.js`
Expected: PASS

**Step 2: Run build**

Run: `npm run build`
Expected: build succeeds
