# Home Map Toolbar Split Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 拆分 2999 风浪潮首页地图工具栏，保留右侧三项纵向入口，并新增右下角双行横向地图操作区与海浪横向图例。

**Architecture:** 维持现有 `SeaConditionHome` 状态和地图操作函数，收缩 `MapToolRail` 为面板入口组件，新增 `MapActionDock` 承载地图操作与专题开关。先通过结构测试锁定按钮分组、顺序和禁用态，再接入最小实现与全屏逻辑。

**Tech Stack:** Vue 3、Pinia、Vitest、Vite

---

### Task 1: 记录设计与更新测试基线

**Files:**
- Create: `apps/gdhz-vue-2999/docs/plans/2026-03-17-home-map-toolbar-split-design.md`
- Modify: `apps/gdhz-vue-2999/src/components/layout/MapToolRail.test.js`
- Create: `apps/gdhz-vue-2999/src/components/layout/MapActionDock.test.js`

**Step 1: Write the failing tests**

- 为 `MapToolRail` 增加断言，要求只保留 `toggle-layer-panel`、`toggle-device-panel`、`toggle-ai-panel` 三类入口
- 为 `MapActionDock` 增加断言，要求：
  - 第一行按钮顺序固定
  - 第二行按钮顺序固定
  - 海浪横向图例存在
  - `温度`、`降水`、`海平面气压`、`地形` 为禁用态

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/layout/MapToolRail.test.js src/components/layout/MapActionDock.test.js`
Expected: 失败，因为 `MapToolRail` 仍包含旧按钮，`MapActionDock` 尚不存在

### Task 2: 实现地图操作区组件

**Files:**
- Modify: `apps/gdhz-vue-2999/src/components/layout/MapToolRail.vue`
- Create: `apps/gdhz-vue-2999/src/components/layout/MapActionDock.vue`
- Test: `apps/gdhz-vue-2999/src/components/layout/MapActionDock.test.js`

**Step 1: Write minimal implementation**

- 精简 `MapToolRail.vue` 模板、props 和 emits
- 新建 `MapActionDock.vue`
- 通过 props 驱动第一行与第二行按钮 active/disabled 状态
- 底部内置海浪横向图例

**Step 2: Run test to verify it passes**

Run: `npm test -- src/components/layout/MapToolRail.test.js src/components/layout/MapActionDock.test.js`
Expected: 通过

### Task 3: 在风浪潮首页接线

**Files:**
- Modify: `apps/gdhz-vue-2999/src/views/SeaConditionHome.vue`

**Step 1: Write the failing test surrogate**

- 由于当前页面没有视图挂载测试，先以结构测试和页面内状态接线作为最小变更边界

**Step 2: Write minimal implementation**

- 将 `MapActionDock` 接入页面
- 复用现有缩放、地图模式、重置视角、底图切换、台风、摄像头逻辑
- 增加 `船舶`、`风速` 图层切换
- 增加全屏切换和状态同步

**Step 3: Run targeted verification**

Run: `npm test -- src/components/layout/MapToolRail.test.js src/components/layout/MapActionDock.test.js`
Expected: 通过

### Task 4: 回归验证

**Files:**
- Modify: `apps/gdhz-vue-2999/src/components/layout/MapToolRail.test.js`
- Create: `apps/gdhz-vue-2999/src/components/layout/MapActionDock.test.js`

**Step 1: Run full related component tests**

Run: `npm test -- src/components/layout/MapToolRail.test.js src/components/layout/MapActionDock.test.js src/views/SeaConditionHome.test.js`
Expected: 通过，且无新增失败

**Step 2: Commit**

```bash
git add apps/gdhz-vue-2999/docs/plans/2026-03-17-home-map-toolbar-split-design.md apps/gdhz-vue-2999/docs/plans/2026-03-17-home-map-toolbar-split.md apps/gdhz-vue-2999/src/components/layout/MapToolRail.vue apps/gdhz-vue-2999/src/components/layout/MapToolRail.test.js apps/gdhz-vue-2999/src/components/layout/MapActionDock.vue apps/gdhz-vue-2999/src/components/layout/MapActionDock.test.js apps/gdhz-vue-2999/src/views/SeaConditionHome.vue
git commit -m "feat: split home map toolbar"
```
