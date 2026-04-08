# Home Left Rail Balance Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebalance the homepage side-panel heights so seawall risk gets stable visibility while warning and device lists adapt by viewport profile.

**Architecture:** Extend the existing `homeViewportProfile` utility with explicit row and height metrics for the homepage side panels, then feed those metrics into `HomeOverview.vue` as CSS variables. Keep component ownership unchanged and make `AIDecisionPanel.vue` shorter by removing the quick-action chip row.

**Tech Stack:** Vue 3, Vite, scoped CSS, Vitest.

---

### Task 1: Extend homepage viewport profile metrics

**Files:**
- Modify: `apps/gdhz-vue-2999/src/utils/homeViewportProfile.test.js`
- Modify: `apps/gdhz-vue-2999/src/utils/homeViewportProfile.js`

**Step 1: Write the failing test**

- Assert warning visible rows, warning max height, device max height, and seawall minimum height for each viewport profile.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/homeViewportProfile.test.js`

Expected: FAIL because the new metrics do not exist yet.

**Step 3: Write minimal implementation**

- Add the four metrics to each profile entry.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/homeViewportProfile.test.js`

Expected: PASS

### Task 2: Apply the metrics to homepage layout

**Files:**
- Modify: `apps/gdhz-vue-2999/src/views/HomeOverview.vue`

**Step 1: Read the viewport height and metrics**

- Import `getHomeViewportMetrics`
- Compute the active metrics from the window height
- Expose CSS variables for warning max height, device max height, and seawall minimum height

**Step 2: Rebalance panel heights**

- Replace the hardcoded warning max-height rule
- Cap device panel body height from metrics
- Set a minimum visible height for the seawall panel

**Step 3: Keep current side effects intact**

- Do not disturb the existing typhoon tool-rail panel changes already present in the working tree

### Task 3: Shorten the AI decision panel

**Files:**
- Modify: `apps/gdhz-vue-2999/src/components/decision/AIDecisionPanel.vue`

**Step 1: Remove the quick-action chip section**

- Delete the three suggestion buttons from the template

**Step 2: Tighten spacing**

- Reduce header and summary padding enough to give height back to the left rail

**Step 3: Preserve current input behavior**

- Keep placeholder typing and send interaction unchanged

### Task 4: Verify

**Files:**
- Test: `apps/gdhz-vue-2999/src/utils/homeViewportProfile.test.js`

**Step 1: Run focused test**

Run: `npm test -- src/utils/homeViewportProfile.test.js`

Expected: PASS

**Step 2: Run related utility tests**

Run: `npm test -- src/utils/homeViewportProfile.test.js src/utils/homeChromeLayout.test.js src/utils/homeMonitoring.test.js`

Expected: PASS

**Step 3: Run production build**

Run: `npm run build`

Expected: PASS
