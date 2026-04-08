# Sea Condition Readable Left Column Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Widen the sea condition page left sidebar and enlarge key typography for easier reading, without affecting the homepage.

**Architecture:** Keep all changes local to `SeaConditionHome.vue`. Use a page-specific width resolver to enlarge the left column and page-scoped `:deep(...)` overrides to increase typography and spacing inside shared alert and seawall components without changing their global defaults.

**Tech Stack:** Vue 3, Vite, Vitest

---

### Task 1: Lock the readability contract with failing tests

**Files:**
- Modify: `apps/gdhz-vue-2999/src/views/SeaConditionHome.test.js`
- Test: `apps/gdhz-vue-2999/src/views/SeaConditionHome.vue`

**Step 1: Write the failing test**

Add assertions that:
- the page source contains `resolveSeaConditionColumnWidth`
- `currentColumnWidth` uses that dedicated resolver
- the stylesheet contains left-column readability overrides for the warning and seawall panels

**Step 2: Run test to verify it fails**

Run: `npm test -- src/views/SeaConditionHome.test.js`

Expected: FAIL because the page still uses the older width resolver and does not yet contain the new readability overrides.

**Step 3: Write minimal implementation**

Add the dedicated width resolver and page-scoped large-type CSS overrides.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/views/SeaConditionHome.test.js`

Expected: PASS

### Task 2: Implement the enlarged left column and typography

**Files:**
- Modify: `apps/gdhz-vue-2999/src/views/SeaConditionHome.vue`

**Step 1: Widen the left column**

- Replace the current width resolver call with a sea-condition-specific resolver
- Increase the width curve by about 25% while keeping sensible min and max bounds

**Step 2: Enlarge left-column typography**

- Increase block title size and spacing
- Add `:deep(...)` overrides for `SituationAlerts` titles, main row text, and metadata
- Add `:deep(...)` overrides for `SeawallRiskPanel` key values, labels, and table/list text

**Step 3: Preserve homepage isolation**

Confirm `apps/gdhz-vue-2999/src/views/HomeOverview.vue` is not changed.

**Step 4: Run focused verification**

Run: `npm test -- src/views/SeaConditionHome.test.js`

Expected: PASS

### Task 3: Run build verification

**Files:**
- Test: `apps/gdhz-vue-2999/src/views/SeaConditionHome.vue`

**Step 1: Run build**

Run: `npm run build`

Expected: PASS

**Step 2: Report residual risk**

If unrelated existing warnings remain, report them separately from this change.
