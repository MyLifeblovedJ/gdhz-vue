# Header Expanded Navigation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn the global header mega menu into an integrated expanding header section with aligned submenu columns and a blurred app backdrop.

**Architecture:** Keep the existing navigation data model, but refactor `AppHeader.vue` so submenu content becomes part of the header body instead of a separate floating panel. Use `App.vue` to host a global blur overlay that is driven by header expansion state, allowing all pages to share the same focus treatment.

**Tech Stack:** Vue 3 `<script setup>`, Vue Router, Pinia, Vitest, CSS transitions

---

### Task 1: Add failing tests for integrated expanded header behavior

**Files:**
- Modify: `apps/gdhz-vue-2999/src/components/layout/AppHeader.test.js`
- Create: `apps/gdhz-vue-2999/src/App.test.js`

**Step 1: Write the failing test**

- Assert `AppHeader.vue` has:
  - expanded header state class
  - dedicated header submenu body
  - fixed submenu grid / section column structure
  - no standalone floating mega-menu positioning
- Assert `App.vue` renders a global backdrop element driven by header expansion state.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/layout/AppHeader.test.js src/App.test.js`

Expected: FAIL because the current implementation still uses a separate floating menu and App-level backdrop does not exist.

### Task 2: Implement expanded header state and aligned submenu columns

**Files:**
- Modify: `apps/gdhz-vue-2999/src/components/layout/AppHeader.vue`
- Test: `apps/gdhz-vue-2999/src/components/layout/AppHeader.test.js`

**Step 1: Write minimal implementation**

- Convert the current floating mega menu into a header-integrated submenu body
- Add expanded header state class
- Use a fixed column grid with vertical submenu lists
- Preserve existing submenu routing and active state logic

**Step 2: Run tests**

Run: `npm test -- src/components/layout/AppHeader.test.js`

Expected: PASS

### Task 3: Implement global blur backdrop

**Files:**
- Modify: `apps/gdhz-vue-2999/src/App.vue`
- Test: `apps/gdhz-vue-2999/src/App.test.js`

**Step 1: Write minimal implementation**

- Add a global app backdrop element below the header
- Drive its visibility from shared expanded-header state
- Ensure it covers the whole viewport below the header

**Step 2: Run tests**

Run: `npm test -- src/App.test.js`

Expected: PASS

### Task 4: Verify integrated behavior

**Files:**
- Verify only

**Step 1: Run focused verification**

Run: `npm test -- src/App.test.js src/components/layout/AppHeader.test.js src/data/navigation.test.js src/views/HomeOverview.test.js src/views/SeaConditionHome.test.js src/views/Placeholder.test.js`

Expected: PASS

**Step 2: Run build**

Run: `npm run build`

Expected: production build succeeds, with only existing chunk-size warnings if any.
