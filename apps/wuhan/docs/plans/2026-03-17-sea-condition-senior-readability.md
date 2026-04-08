# Sea Condition Senior Readability Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Push the sea condition page into a stronger senior-friendly readability mode by enlarging the left sidebar to the 35% tier and scaling all tool-rail popup panels, without affecting the homepage.

**Architecture:** Keep the change local to `SeaConditionHome.vue`. Reuse the page-scoped readability pattern already in place for the left column, then extend it to the layer, typhoon, device, and AI popup shells with larger container widths, headers, content spacing, and deep typography overrides for embedded shared components.

**Tech Stack:** Vue 3, Vite, Vitest

---

### Task 1: Lock the stronger readability contract with failing tests

**Files:**
- Modify: `apps/gdhz-vue-2999/src/views/SeaConditionHome.test.js`
- Test: `apps/gdhz-vue-2999/src/views/SeaConditionHome.vue`

**Step 1: Write the failing test**

Add assertions that:
- `resolveSeaConditionColumnWidth` uses the stronger 35% scale values
- the page source contains readability overrides for:
  - `.tool-rail-layer-panel`
  - `.tool-rail-typhoon-panel`
  - `.tool-rail-device-panel`
  - `.tool-rail-ai-panel`
- the page source contains deep typography overrides for embedded layer, typhoon, device, and AI content

**Step 2: Run test to verify it fails**

Run: `npm test -- src/views/SeaConditionHome.test.js`

Expected: FAIL because the page does not yet contain the stronger width curve or the expanded right-side readability overrides.

**Step 3: Write minimal implementation**

Add the stronger width values and the page-scoped popup readability styles.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/views/SeaConditionHome.test.js`

Expected: PASS

### Task 2: Enlarge the left column to the 35% tier

**Files:**
- Modify: `apps/gdhz-vue-2999/src/views/SeaConditionHome.vue`

**Step 1: Update the width resolver**

- Increase the 1440-, 1680-, and large-screen width curve values to the stronger 35% tier
- Preserve sensible min and max width clamps

**Step 2: Keep the map and tool rail stable**

- Leave the page structure unchanged
- Leave the right-edge tool rail anchor unchanged

**Step 3: Run focused verification**

Run: `npm test -- src/views/SeaConditionHome.test.js`

Expected: PASS

### Task 3: Enlarge all tool-rail popup panels

**Files:**
- Modify: `apps/gdhz-vue-2999/src/views/SeaConditionHome.vue`

**Step 1: Increase popup shell readability**

- Widen layer, typhoon, device, and AI panels
- Increase popup header spacing, title size, close button size, and content padding

**Step 2: Increase embedded content readability**

- Layer control: group headers, layer items, and checkbox hit area
- Typhoon topic: embedded title, key text, row spacing, and body text
- Device explorer: stat cards, filter buttons, device names, status text, and metric values
- AI decision panel: hero title, summary text, section labels, cards, and paragraph text

**Step 3: Preserve homepage isolation**

Confirm `apps/gdhz-vue-2999/src/views/HomeOverview.vue` is not changed.

**Step 4: Run focused verification**

Run: `npm test -- src/views/SeaConditionHome.test.js`

Expected: PASS

### Task 4: Run build verification

**Files:**
- Test: `apps/gdhz-vue-2999/src/views/SeaConditionHome.vue`

**Step 1: Run build**

Run: `npm run build`

Expected: PASS

**Step 2: Report residual warnings**

If unrelated chunk-size warnings remain, report them separately from this change.
