# Geology Filter MGGID Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an `mggid` top filter to the geology sampling sidebar and make it participate in the existing linked filtering behavior.

**Architecture:** Extend the existing top-filter state and utility pipeline instead of introducing a new filtering path. Keep the tree rendering unchanged and let `filterByTopFilters` become the single source of truth for `mggid` filtering.

**Tech Stack:** Vue 3 `script setup`, Pinia, Vitest

---

### Task 1: Add coverage for mggid top filtering

**Files:**
- Create: `src/utils/geologySampling.test.js`
- Modify: `src/utils/geologySampling.js`

**Step 1: Write the failing test**

Add a test showing that filtering by one `mggid` returns every record in that group.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/geologySampling.test.js`

Expected: FAIL because `filterByTopFilters` does not yet handle `mggid`.

**Step 3: Write minimal implementation**

Update `filterByTopFilters` to honor `mggid`.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/geologySampling.test.js`

Expected: PASS

### Task 2: Wire mggid into the top filter panel

**Files:**
- Modify: `src/components/map/GeologyFilterPanel.vue`

**Step 1: Add `mggid` to component filter state**

Place the new control first in the template and add the matching reactive state.

**Step 2: Extend linked option generation**

Add `mggidOptions` and include `mggid` in `effectiveFilters`, `filtersExcept`, `hasActiveFilter`, and invalid-value cleanup.

**Step 3: Keep reset behavior consistent**

Ensure clear/reset actions also clear the selected `mggid`.

**Step 4: Verify locally**

Run the focused test and a production build.

Run: `npm test -- src/utils/geologySampling.test.js`

Run: `npm run build`
