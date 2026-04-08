# Home Panel Density Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Tighten coastal observation density on smaller screens and restore seawall city labels to a lighter secondary style.

**Architecture:** Reuse `homeViewportProfile` as the single source of truth for responsive density by adding coastal gap metrics there and reading them from `HomeOverview.vue`. Keep the seawall city styling change local to `SeawallRiskPanel.vue`.

**Tech Stack:** Vue 3, Vite, scoped CSS, Vitest.

---

### Task 1: Extend viewport profile density metrics

**Files:**
- Modify: `apps/gdhz-vue-2999/src/utils/homeViewportProfile.test.js`
- Modify: `apps/gdhz-vue-2999/src/utils/homeViewportProfile.js`

**Step 1: Write the failing test**

- Assert coastal card height and coastal grid gap per viewport profile.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/homeViewportProfile.test.js`

Expected: FAIL because the new density metrics do not exist yet.

**Step 3: Write minimal implementation**

- Add the coastal gap metric to each profile entry.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/homeViewportProfile.test.js`

Expected: PASS

### Task 2: Tighten the coastal observation panel

**Files:**
- Modify: `apps/gdhz-vue-2999/src/views/HomeOverview.vue`
- Modify: `apps/gdhz-vue-2999/src/components/layout/CoastalObservationPanel.vue`

**Step 1: Pass density variables from the home view**

- Expose coastal card height and gap as CSS variables.

**Step 2: Make the card fill the row**

- Remove the fixed card body height and let the video tile stretch to the available row height.

**Step 3: Keep compact behavior on smaller screens**

- Shrink both row height and gap for compact viewport profiles.

### Task 3: Restore lighter city styling in seawall cards

**Files:**
- Modify: `apps/gdhz-vue-2999/src/components/layout/SeawallRiskPanel.vue`

**Step 1: Split title and city rendering**

- Keep city after the breakpoint name, but render it as secondary text.

**Step 2: Apply subdued styling**

- Match the previous weaker visual weight rather than the main title style.

### Task 4: Verify

**Files:**
- Test: `apps/gdhz-vue-2999/src/utils/homeViewportProfile.test.js`

**Step 1: Run focused tests**

Run: `npm test -- src/utils/homeViewportProfile.test.js`

Expected: PASS

**Step 2: Run related tests**

Run: `npm test -- src/utils/homeViewportProfile.test.js src/utils/seawallRisk.test.js`

Expected: PASS

**Step 3: Run production build**

Run: `npm run build`

Expected: PASS
