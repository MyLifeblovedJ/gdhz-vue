# Header Mega Menu Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a global Apple-style hover mega menu in the top header that shows all configured submenu groups and routes submenu clicks to placeholder states.

**Architecture:** Move top-level navigation into a dedicated configuration module with optional `children`, then let `AppHeader` render both the primary nav row and a unified hover mega menu from the same source. Use route query parameters for submenu placeholder state so existing一级路由 can remain unchanged.

**Tech Stack:** Vue 3 `<script setup>`, Vue Router, Pinia, Vitest

---

### Task 1: Add failing tests for mega menu structure

**Files:**
- Modify: `apps/gdhz-vue-2999/src/components/layout/AppHeader.test.js`
- Create: `apps/gdhz-vue-2999/src/data/navigation.test.js`
- Create: `apps/gdhz-vue-2999/src/views/Placeholder.test.js`

**Step 1: Write the failing test**

- Assert `AppHeader.vue` contains:
  - unified hover container
  - mega menu section loop
  - vertical submenu list loop
  - submenu route builder usage
- Assert navigation config exports the required submenu groups and lookup behavior.
- Assert `Placeholder.vue` reads `route.query.sub` and resolves the submenu label.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/layout/AppHeader.test.js src/data/navigation.test.js src/views/Placeholder.test.js`

Expected: FAIL because mega menu config and placeholder submenu logic do not exist yet.

### Task 2: Implement navigation configuration

**Files:**
- Create: `apps/gdhz-vue-2999/src/data/navigation.js`
- Modify: `apps/gdhz-vue-2999/src/components/layout/AppHeader.vue`

**Step 1: Write minimal implementation**

- Export `navItems`
- Export grouped `navMegaSections`
- Export submenu lookup helper such as `findSubmenuItem(pageKey, submenuKey)`

**Step 2: Run tests**

Run: `npm test -- src/data/navigation.test.js`

Expected: PASS

### Task 3: Implement the global hover mega menu

**Files:**
- Modify: `apps/gdhz-vue-2999/src/components/layout/AppHeader.vue`
- Test: `apps/gdhz-vue-2999/src/components/layout/AppHeader.test.js`

**Step 1: Write minimal implementation**

- Replace direct `navItems` usage with the new navigation config
- Add unified hover area and mega menu open/close state
- Render all submenu groups in the dropdown panel
- Keep submenu items vertically stacked and visually tidy
- Use router query parameters for submenu links

**Step 2: Run tests**

Run: `npm test -- src/components/layout/AppHeader.test.js src/data/navigation.test.js`

Expected: PASS

### Task 4: Implement submenu placeholder labeling

**Files:**
- Modify: `apps/gdhz-vue-2999/src/views/Placeholder.vue`
- Test: `apps/gdhz-vue-2999/src/views/Placeholder.test.js`

**Step 1: Write minimal implementation**

- Read current submenu key from `route.query.sub`
- Resolve submenu label from navigation config
- Render “一级模块 / 二级模块 开发中” when a submenu is present

**Step 2: Run tests**

Run: `npm test -- src/views/Placeholder.test.js`

Expected: PASS

### Task 5: Verify integrated behavior

**Files:**
- Verify only

**Step 1: Run focused verification**

Run: `npm test -- src/components/layout/AppHeader.test.js src/data/navigation.test.js src/views/Placeholder.test.js src/views/HomeOverview.test.js src/views/SeaConditionHome.test.js`

Expected: PASS

**Step 2: Run build**

Run: `npm run build`

Expected: production build succeeds, with only existing chunk-size warnings if any.
