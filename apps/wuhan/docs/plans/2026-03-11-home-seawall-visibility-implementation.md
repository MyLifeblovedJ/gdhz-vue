# Home Seawall Visibility Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Increase the visible seawall risk list area on laptop-sized screens and align the map legend top edge with the AI decision panel top edge.

**Architecture:** Keep the behavior change inside the existing home layout utility layer. Use `src/utils/homeViewportProfile.js` for viewport-driven sizing rules, `src/utils/homeChromeLayout.js` for the legend anchor, and `src/views/HomeOverview.vue` for the actual panel sizing hook-up.

**Tech Stack:** Vue 3, Vite, scoped CSS, Vitest.

---

### Task 1: Lock the new behavior with failing tests

**Files:**
- Modify: `apps/gdhz-vue-2999/src/utils/homeViewportProfile.test.js`
- Modify: `apps/gdhz-vue-2999/src/utils/homeChromeLayout.test.js`

**Step 1: Write the failing test**

Add assertions that the standard viewport profile grants a taller seawall panel and that the legend top aligns with the AI decision block top edge.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/homeViewportProfile.test.js src/utils/homeChromeLayout.test.js`

Expected: FAIL because the current metrics and legend anchor do not match the new behavior.

### Task 2: Implement the layout utility changes

**Files:**
- Modify: `apps/gdhz-vue-2999/src/utils/homeViewportProfile.js`
- Modify: `apps/gdhz-vue-2999/src/utils/homeChromeLayout.js`

**Step 1: Write minimal implementation**

Increase the standard-profile seawall height budget and switch the legend anchor calculation to the AI decision top edge.

**Step 2: Run test to verify it passes**

Run: `npm test -- src/utils/homeViewportProfile.test.js src/utils/homeChromeLayout.test.js`

Expected: PASS.

### Task 3: Apply the view-level sizing rule

**Files:**
- Modify: `apps/gdhz-vue-2999/src/views/HomeOverview.vue`
- Test: `apps/gdhz-vue-2999/src/views/HomeOverview.test.js`

**Step 1: Write the failing test**

Add a source-level assertion that the home view consumes the new seawall sizing variable.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/views/HomeOverview.test.js`

Expected: FAIL because the view does not yet expose the taller seawall height rule.

**Step 3: Write minimal implementation**

Apply the new CSS custom property to the seawall block using a larger target height on the home view.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/views/HomeOverview.test.js`

Expected: PASS.

### Task 4: Verify the app-level result

**Files:**
- No additional files

**Step 1: Run focused verification**

Run: `npm test -- src/utils/homeViewportProfile.test.js src/utils/homeChromeLayout.test.js src/views/HomeOverview.test.js`

Expected: PASS.

**Step 2: Run build verification**

Run: `npm run build`

Expected: build exits with code `0`.
