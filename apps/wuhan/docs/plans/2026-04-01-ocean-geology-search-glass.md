# Ocean Geology Search Glass Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a fixed glass-style search pill to the ocean geology map page while leaving the existing draggable liquid-glass overlay untouched.

**Architecture:** Create a small page-scoped `MapSearchGlass` component that matches the current frosted-glass language, then mount it as a fixed overlay in `SeaConditionHome`. Keep behavior minimal: search icon plus placeholder-only field, with no search execution logic in this pass.

**Tech Stack:** Vue 3 SFCs, scoped CSS, Vitest source-inspection tests

---

### Task 1: Lock the page contract

**Files:**
- Modify: `apps/wuhan/src/views/SeaConditionHome.test.js`
- Create: `apps/wuhan/src/components/map/MapSearchGlass.test.js`

**Step 1: Write the failing tests**

- Assert `SeaConditionHome.vue` imports and renders `MapSearchGlass`.
- Assert the component source contains the search icon, placeholder text, and pill-shaped glass shell.

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/views/SeaConditionHome.test.js src/components/map/MapSearchGlass.test.js`

Expected: FAIL because the new component does not exist yet and the page does not render it.

### Task 2: Implement the minimal page overlay

**Files:**
- Create: `apps/wuhan/src/components/map/MapSearchGlass.vue`
- Modify: `apps/wuhan/src/views/SeaConditionHome.vue`

**Step 1: Write the minimal implementation**

- Add a fixed, elongated, oval, frosted-glass search shell with a search icon and placeholder text.
- Mount it near the top center of the map area, offset from the fixed left sidebar.
- Preserve existing overlay stacking and do not change `public/liquid-glass.js`.

**Step 2: Run tests to verify they pass**

Run: `npm test -- src/views/SeaConditionHome.test.js src/components/map/MapSearchGlass.test.js`

Expected: PASS

### Task 3: Verify integration

**Files:**
- No new files expected

**Step 1: Run focused verification**

Run: `npm run build`

Expected: PASS

**Step 2: Verify in browser**

- Open `http://127.0.0.1:2888/ocean-geology`
- Confirm the new search pill is fixed on the map
- Confirm the original draggable liquid glass still exists
- Confirm the pill shows only the icon and placeholder text
