# Detail Popup Clarity Refinement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refine the current station/device detail popup so text is clearer, the center chart is larger and higher-contrast, the legend is standardized, and realtime/history modes keep a consistent vertical footprint.

**Architecture:** Keep the existing popup layout and data flow, but tighten the visual system across `DetailPopup.vue`, `TimeRangeSelector.vue`, and `DeviceChart.vue`. The work is styling- and hierarchy-heavy, with a small amount of template reshaping to normalize toolbar heights and legend presentation.

**Tech Stack:** Vue 3, scoped CSS, ECharts, Vite, Vitest.

---

### Task 1: Lock the refinement targets with failing tests

**Files:**
- Create: `apps/gdhz-vue-2999/src/components/common/DetailPopup.test.js`
- Create: `apps/gdhz-vue-2999/src/components/common/TimeRangeSelector.test.js`

**Step 1: Write the failing test**

- Add a structural test for `DetailPopup.vue` that expects:
  - a dedicated center chart container
  - a standard legend row/container
  - a consistent control strip wrapper for realtime/history
- Add a structural test for `TimeRangeSelector.vue` that expects:
  - a quick-range row
  - a custom range container
  - a timeline container

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/common/DetailPopup.test.js src/components/common/TimeRangeSelector.test.js`

Expected: FAIL because the new target wrappers are not guaranteed in the current markup.

**Step 3: Write minimal assertions only**

- Follow the repo’s existing “read the Vue file as text” testing style.

**Step 4: Run test to verify it still fails for the right reason**

Run: `npm test -- src/components/common/DetailPopup.test.js src/components/common/TimeRangeSelector.test.js`

Expected: FAIL because the refinement wrappers have not been added yet.

### Task 2: Refine popup hierarchy and contrast in `DetailPopup.vue`

**Files:**
- Modify: `apps/gdhz-vue-2999/src/components/common/DetailPopup.vue`

**Step 1: Keep the current layout contract**

- Do not redesign data flow.
- Do not add new business logic.
- Preserve the current left / center / right arrangement.

**Step 2: Normalize the center control zone**

- Add a stable control-height wrapper so realtime and history modes occupy the same vertical space.
- Keep history controls visible only when needed, but preserve layout height in realtime mode.

**Step 3: Improve readability**

- Deepen text colors.
- Tighten spacing and grouping.
- Make key labels and values more readable without inflating all font sizes.

**Step 4: Standardize the legend**

- Refactor threshold legend markup into a dedicated, clean legend row.
- Use consistent label formatting and ordering.

**Step 5: Rebalance column emphasis**

- Make the side rails calmer.
- Make the center analysis area stronger through layout weight and background treatment.
- Convert the right rail from a repeated metric list into a primary summary card plus a few supporting facts.

**Step 6: Run focused tests**

Run: `npm test -- src/components/common/DetailPopup.test.js`

Expected: PASS

### Task 3: Make `TimeRangeSelector.vue` visually cleaner and height-stable

**Files:**
- Modify: `apps/gdhz-vue-2999/src/components/common/TimeRangeSelector.vue`

**Step 1: Keep the same controls**

- Preserve quick ranges, custom inputs, and the timeline strip.

**Step 2: Improve visual clarity**

- Increase label readability.
- Make button states clearer.
- Keep the control block visually compatible with the popup’s bright glass language.

**Step 3: Support consistent toolbar sizing**

- Adjust internal spacing and wrapper structure so the selector can sit inside a stable-height center control area.

**Step 4: Run focused tests**

Run: `npm test -- src/components/common/TimeRangeSelector.test.js`

Expected: PASS

### Task 4: Increase chart contrast and presence in `DeviceChart.vue`

**Files:**
- Modify: `apps/gdhz-vue-2999/src/components/common/DeviceChart.vue`

**Step 1: Keep data mapping unchanged**

- Do not change chart data semantics.

**Step 2: Improve chart readability**

- Strengthen axis label contrast.
- Tune grid line visibility.
- Increase line prominence.
- Improve threshold line and label readability.
- Adjust tooltip styling to fit the refined popup.

**Step 3: Ensure chart height works with the refined popup**

- Keep the center chart visually dominant.

### Task 5: Verify the combined refinement

**Files:**
- Test: `apps/gdhz-vue-2999/src/components/common/DetailPopup.test.js`
- Test: `apps/gdhz-vue-2999/src/components/common/TimeRangeSelector.test.js`

**Step 1: Run focused tests**

Run: `npm test -- src/components/common/DetailPopup.test.js src/components/common/TimeRangeSelector.test.js`

Expected: PASS

**Step 2: Run build**

Run: `npm run build`

Expected: PASS

**Step 3: Manual verification**

- Open the homepage popup.
- Confirm:
  - center chart is visually larger
  - text is clearer in all three columns
  - side rails and center area feel intentionally different
  - realtime/history modes keep consistent height
  - threshold legend is standardized and easy to read
