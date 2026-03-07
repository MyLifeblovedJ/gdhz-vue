# Home Chrome Refinement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refine the homepage overlay chrome so the side panels sit higher, the warning banner stays centered between panels, the legend aligns with the device block, and the right tool rail adopts a cleaner Apple-like visual treatment.

**Architecture:** Keep the existing homepage structure and overlay components, but add a tiny layout utility for repeatable placement math. Styling changes stay inside the homepage, banner, legend, and tool rail components so the map interaction layer remains untouched.

**Tech Stack:** Vue 3, Vite, scoped CSS, Vitest.

---

### Task 1: Add a small homepage chrome layout utility

**Files:**
- Create: `apps/gdhz-vue-2999/src/utils/homeChromeLayout.js`
- Create: `apps/gdhz-vue-2999/src/utils/homeChromeLayout.test.js`

**Step 1: Write the failing test**

- Cover banner width clamping and legend position calculation from measured rectangles.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/utils/homeChromeLayout.test.js`

Expected: FAIL because the utility file does not exist yet.

**Step 3: Write minimal implementation**

- Export one function for banner bounds.
- Export one function for legend anchor calculation.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/utils/homeChromeLayout.test.js`

Expected: PASS

### Task 2: Reposition homepage panels, banner, and legend

**Files:**
- Modify: `apps/gdhz-vue-2999/src/views/HomeOverview.vue`

**Step 1: Use the tested layout utility**

- Reintroduce lightweight refs for the page root and the `设备与数据` block.
- Compute CSS variables for banner width and legend position.

**Step 2: Adjust homepage layout offsets**

- Move side panels up.
- Center the banner in the middle safe area.
- Keep the overlay non-blocking for map interactions.

**Step 3: Verify legend alignment logic**

- Bind legend-safe CSS variables from the measured device block.

### Task 3: Smooth the warning banner marquee

**Files:**
- Modify: `apps/gdhz-vue-2999/src/components/layout/AlertBanner.vue`

**Step 1: Keep behavior unchanged**

- Do not rewrite the collapse logic or message duplication logic.

**Step 2: Optimize paint and animation**

- Reduce heavy shadow cost.
- Add containment and transform hints for the moving track.
- Keep the collapse/expand button visually attached to the banner frame.

**Step 3: Recheck the narrowed layout**

- Ensure the expand button still appears at the banner’s right edge after the wrapper width changes.

### Task 4: Restyle the right vertical tool rail

**Files:**
- Modify: `apps/gdhz-vue-2999/src/components/layout/MapToolRail.vue`

**Step 1: Keep the action contract unchanged**

- No event or prop changes.

**Step 2: Apply the new visual system**

- Primary mode button gets stronger prominence.
- Secondary buttons use neutral glass styling.
- Active state uses amber, not cyan.
- Hover state remains subtle and controlled.

### Task 5: Verify

**Files:**
- Test: `apps/gdhz-vue-2999/src/utils/homeChromeLayout.test.js`

**Step 1: Run focused tests**

Run: `npm test -- src/utils/homeChromeLayout.test.js`

Expected: PASS

**Step 2: Run any affected utility tests**

Run: `npm test -- src/utils/homeChromeLayout.test.js src/utils/homeMonitoring.test.js src/utils/homeViewportProfile.test.js`

Expected: PASS

**Step 3: Run production build**

Run: `npm run build`

Expected: PASS
