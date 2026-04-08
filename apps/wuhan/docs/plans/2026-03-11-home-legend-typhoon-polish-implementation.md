# Home Legend And Typhoon Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align the map legend with the AI decision panel bottom edge and make the typhoon summary cards read more symmetrically in the narrow tool panel.

**Architecture:** Extend the existing homepage chrome utility so legend placement can be driven by both left and right column measurements. Extract the typhoon summary card rows into a tiny utility so the new structured layout can be covered with focused tests while keeping the rest of `TyphoonInfo.vue` untouched.

**Tech Stack:** Vue 3, Vite, scoped CSS, Vitest.

---

### Task 1: Add tested legend-anchor and typhoon-summary helpers

**Files:**
- Modify: `apps/gdhz-vue-2999/src/utils/homeChromeLayout.test.js`
- Modify: `apps/gdhz-vue-2999/src/utils/homeChromeLayout.js`
- Create: `apps/gdhz-vue-2999/src/utils/typhoonPanel.test.js`
- Create: `apps/gdhz-vue-2999/src/utils/typhoonPanel.js`

**Step 1: Write the failing tests**

- Fix the stale banner-width expectations to the current formula
- Add a legend-anchor assertion that uses a left decision block bottom edge
- Add a typhoon summary-row assertion that returns stable key/value rows for movement and landfall

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/utils/homeChromeLayout.test.js src/utils/typhoonPanel.test.js`

Expected: FAIL because the new legend behavior and typhoon helper do not exist yet.

**Step 3: Write minimal implementation**

- Extend `getHomeLegendAnchor`
- Add the typhoon summary-row helper

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/utils/homeChromeLayout.test.js src/utils/typhoonPanel.test.js`

Expected: PASS

### Task 2: Align legend bottom edge with the AI decision panel

**Files:**
- Modify: `apps/gdhz-vue-2999/src/views/HomeOverview.vue`

**Step 1: Add a ref for the AI decision block**

- Measure both the right device block and left AI decision block

**Step 2: Use the layout helper**

- Drive `--map-safe-left` and `--map-safe-top` from the returned anchor

**Step 3: Keep resize behavior reactive**

- Update the existing resize observer to watch both blocks

### Task 3: Reformat the typhoon summary cards

**Files:**
- Modify: `apps/gdhz-vue-2999/src/components/map/TyphoonInfo.vue`

**Step 1: Use the summary-row helper**

- Replace the ad-hoc text layout with structured rows

**Step 2: Apply aligned key/value styling**

- Fixed label width
- Main value and secondary value hierarchy
- Symmetric spacing between the two cards

**Step 3: Keep data and interaction unchanged**

- Do not alter the rest of the typhoon panel behavior

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
