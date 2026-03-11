# Home Legend And Landing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restore the homepage legend visibility with stable top-based alignment and simplify the typhoon summary to a single landing card.

**Architecture:** Keep legend alignment in the existing layout utility, but switch it from bottom anchoring to top calculation using the measured legend height and decision-block bottom edge. Reuse the small typhoon summary helper, shrinking it to a single landing-card shape so the view layer stays simple.

**Tech Stack:** Vue 3, Vite, scoped CSS, Vitest.

---

### Task 1: Update tested helpers for top-based legend alignment and single landing card

**Files:**
- Modify: `apps/gdhz-vue-2999/src/utils/homeChromeLayout.test.js`
- Modify: `apps/gdhz-vue-2999/src/utils/homeChromeLayout.js`
- Modify: `apps/gdhz-vue-2999/src/utils/typhoonPanel.test.js`
- Modify: `apps/gdhz-vue-2999/src/utils/typhoonPanel.js`

**Step 1: Write the failing tests**

- Assert `getHomeLegendAnchor` returns `top` and uses the decision block bottom minus legend height
- Assert the typhoon helper now returns only one landing card

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/utils/homeChromeLayout.test.js src/utils/typhoonPanel.test.js`

Expected: FAIL because the old helper behavior still returns bottom anchors and a movement card.

**Step 3: Write minimal implementation**

- Update both helpers to the new shape

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/utils/homeChromeLayout.test.js src/utils/typhoonPanel.test.js`

Expected: PASS

### Task 2: Restore visible legend alignment

**Files:**
- Modify: `apps/gdhz-vue-2999/src/views/HomeOverview.vue`
- Modify: `apps/gdhz-vue-2999/src/components/map/MapLegend.vue`

**Step 1: Measure legend height**

- Query the legend element after render and include its height in the anchor calculation

**Step 2: Switch back to top positioning**

- Bind `--map-safe-top` from the computed anchor
- Stop using `--map-safe-bottom`

**Step 3: Keep observers fresh**

- Re-run anchor calculation after viewport and relevant block changes

### Task 3: Simplify the typhoon summary to a landing-only card

**Files:**
- Modify: `apps/gdhz-vue-2999/src/components/map/TyphoonInfo.vue`

**Step 1: Remove movement card rendering**

- Render only the landing card from the helper result

**Step 2: Keep the cleaner landing layout**

- Retain the aligned key/value rows and current 2999 color system

### Task 4: Verify

**Files:**
- Test: `apps/gdhz-vue-2999/src/utils/homeChromeLayout.test.js`
- Test: `apps/gdhz-vue-2999/src/utils/typhoonPanel.test.js`

**Step 1: Run focused tests**

Run: `npm test -- src/utils/homeChromeLayout.test.js src/utils/typhoonPanel.test.js`

Expected: PASS

**Step 2: Run related tests**

Run: `npm test -- src/utils/homeChromeLayout.test.js src/utils/typhoonPanel.test.js src/utils/homeViewportProfile.test.js`

Expected: PASS

**Step 3: Run production build**

Run: `npm run build`

Expected: PASS
