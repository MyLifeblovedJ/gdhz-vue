# Home Column Fill Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the homepage side columns read evenly across screen sizes by letting the right rail fill its remaining height and compressing seawall risk cards.

**Architecture:** Extract the seawall breakpoint shaping logic into a small utility so the new title format and sort behavior can be covered with Vitest. Keep the actual layout work inside `HomeOverview.vue` and `CoastalObservationPanel.vue` by changing only flex and grid sizing rules.

**Tech Stack:** Vue 3, Vite, scoped CSS, Vitest.

---

### Task 1: Extract seawall risk item formatting into a tested utility

**Files:**
- Create: `apps/gdhz-vue-2999/src/utils/seawallRisk.test.js`
- Create: `apps/gdhz-vue-2999/src/utils/seawallRisk.js`

**Step 1: Write the failing test**

- Assert overflow-first sorting
- Assert the generated headline includes seawall name, breakpoint name, and city in one string
- Assert the derived risk stats remain correct

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/seawallRisk.test.js`

Expected: FAIL because the utility file does not exist yet.

**Step 3: Write minimal implementation**

- Export one function for shaped breakpoint items
- Export one function for stats

**Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/seawallRisk.test.js`

Expected: PASS

### Task 2: Compress the seawall risk card layout

**Files:**
- Modify: `apps/gdhz-vue-2999/src/components/layout/SeawallRiskPanel.vue`

**Step 1: Use the tested utility**

- Replace inline shaping logic with the new utility

**Step 2: Move city into the main title row**

- Render `海堤 · 断点 · 城市`
- Delete the standalone location row

**Step 3: Tighten card spacing**

- Reduce top-level gaps and padding enough to lower card height without hurting scanability

### Task 3: Let the right column fill remaining height

**Files:**
- Modify: `apps/gdhz-vue-2999/src/views/HomeOverview.vue`
- Modify: `apps/gdhz-vue-2999/src/components/layout/CoastalObservationPanel.vue`

**Step 1: Make the coast block flexible**

- Change the right-column `海岸观测` block to `flex: 1`

**Step 2: Let the coastal grid stretch**

- Keep current row-count behavior, but allow rows to grow and fill the available panel height

**Step 3: Preserve column scrolling**

- Keep whole-column scrolling enabled so small screens can still browse the full content

### Task 4: Verify

**Files:**
- Test: `apps/gdhz-vue-2999/src/utils/seawallRisk.test.js`

**Step 1: Run focused utility tests**

Run: `npm test -- src/utils/seawallRisk.test.js`

Expected: PASS

**Step 2: Run related tests**

Run: `npm test -- src/utils/seawallRisk.test.js src/utils/homeViewportProfile.test.js`

Expected: PASS

**Step 3: Run production build**

Run: `npm run build`

Expected: PASS
