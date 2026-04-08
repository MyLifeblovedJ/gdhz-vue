# Sea Condition Right Column Removal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove the right-side coastal observation column from the sea condition page and pin the tool rail to the viewport's right edge without affecting the homepage.

**Architecture:** Keep the change local to `SeaConditionHome.vue`. Treat the page source as the contract under test, then remove the right column and update the page-scoped tool rail offset variable so all tool-rail shells inherit the new edge alignment automatically.

**Tech Stack:** Vue 3, Vite, Vitest

---

### Task 1: Lock the page contract with failing tests

**Files:**
- Modify: `apps/gdhz-vue-2999/src/views/SeaConditionHome.test.js`
- Test: `apps/gdhz-vue-2999/src/views/SeaConditionHome.vue`

**Step 1: Write the failing test**

Add assertions that:
- the template does not contain `class="column right-column"`
- the source does not import or render `CoastalObservationPanel`
- `--tool-rail-safe-right` is set to a fixed edge gutter instead of `calc(... var(--home-column-width) ...)`

**Step 2: Run test to verify it fails**

Run: `npm test -- src/views/SeaConditionHome.test.js`

Expected: FAIL because the current page still renders the right column and still reserves right-side width for the tool rail.

**Step 3: Write minimal implementation**

Remove the right column block, clean up imports, and update the page-local CSS variable.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/views/SeaConditionHome.test.js`

Expected: PASS

### Task 2: Remove the right column and re-anchor the tool rail

**Files:**
- Modify: `apps/gdhz-vue-2999/src/views/SeaConditionHome.vue`

**Step 1: Make the layout change**

- Delete the right column template block
- Delete the `CoastalObservationPanel` import
- Remove any now-unused styles that only exist for the deleted right column
- Set `--tool-rail-safe-right` to a fixed edge gutter in the base rule and responsive overrides

**Step 2: Verify no homepage coupling**

Inspect `apps/gdhz-vue-2999/src/views/HomeOverview.vue` and confirm it was not changed.

**Step 3: Run focused verification**

Run: `npm test -- src/views/SeaConditionHome.test.js`

Expected: PASS

### Task 3: Run build verification

**Files:**
- Test: `apps/gdhz-vue-2999/src/views/SeaConditionHome.vue`

**Step 1: Run build**

Run: `npm run build`

Expected: PASS

**Step 2: Summarize residual risk**

If unrelated pre-existing test failures remain elsewhere in the repo, report them separately and do not attribute them to this change.
