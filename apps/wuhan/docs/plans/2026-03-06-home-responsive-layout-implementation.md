# 2999 Home Responsive Layout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the 2999 homepage keep its current two-column overlay structure while adapting module heights by viewport height so smaller screens use internal panel scrolling instead of whole-page scrolling.

**Architecture:** Add a small viewport-profile layer that classifies the homepage into spacious, standard, and compact height modes, then let `HomeOverview.vue` assign shared sizing rules to child modules. Preserve the fixed map background and existing component structure, while moving overflow responsibility into the warning list, device list, typhoon content body, and coastal station grid.

**Tech Stack:** Vue 3, Vite, Pinia, scoped CSS, optional Vitest for small pure-function coverage.

---

### Task 1: Add a testable homepage viewport profile helper

**Files:**
- Create: `apps/gdhz-vue-2999/src/utils/homeViewportProfile.js`
- Create: `apps/gdhz-vue-2999/src/utils/homeViewportProfile.test.js`
- Modify: `apps/gdhz-vue-2999/package.json`

**Step 1: Write the failing test**

Create `src/utils/homeViewportProfile.test.js` with coverage for:

- `1280` maps to `spacious`
- `1100` maps to `standard`
- `979` maps to `compact`
- profile metadata returns coastal visible rows `4`, `3`, `2`

**Step 2: Run test to verify it fails**

Run: `npm run test -- homeViewportProfile`

Expected: failure because the test runner or helper does not exist yet.

**Step 3: Add the minimal test runner wiring**

Update `package.json`:

- add `vitest` to `devDependencies`
- add script `"test": "vitest run"`

**Step 4: Write the minimal implementation**

Create `src/utils/homeViewportProfile.js` exporting:

- named thresholds for spacious and compact modes
- `getHomeViewportProfile(height)`
- `getHomeViewportMetrics(height)` returning profile name and visible row count

Keep the helper pure and free of Vue imports.

**Step 5: Run test to verify it passes**

Run: `npm run test -- homeViewportProfile`

Expected: PASS.

**Step 6: Commit**

```bash
git add apps/gdhz-vue-2999/package.json apps/gdhz-vue-2999/package-lock.json apps/gdhz-vue-2999/src/utils/homeViewportProfile.js apps/gdhz-vue-2999/src/utils/homeViewportProfile.test.js
git commit -m "test: add homepage viewport profile coverage"
```

### Task 2: Wire the homepage layout to shared height profiles

**Files:**
- Modify: `apps/gdhz-vue-2999/src/views/HomeOverview.vue`

**Step 1: Write the failing test**

Define the failure manually for this task:

- homepage does not expose a shared profile class or variables
- child modules cannot react consistently to viewport height

Record expected DOM/state behavior in code comments before editing:

- `spacious`, `standard`, `compact` profile class on the root
- coastal rows and body heights derived from the shared profile

**Step 2: Run the current app to verify the gap**

Run: `npm run build`

Expected: PASS build, but no profile-driven layout behavior exists yet.

**Step 3: Write the minimal implementation**

Update `HomeOverview.vue` to:

- read viewport height reactively
- derive a profile using `getHomeViewportMetrics`
- apply a root modifier class such as `home-page--compact`
- define shared CSS variables for:
  - warning body max height
  - device body max height
  - typhoon body max height
  - coastal visible rows
  - column max height

Do not change the two-column structure or map interaction handlers.

**Step 4: Run targeted verification**

Run: `npm run build`

Expected: PASS, with no Vue compile errors.

**Step 5: Commit**

```bash
git add apps/gdhz-vue-2999/src/views/HomeOverview.vue
git commit -m "feat: add shared home viewport layout profiles"
```

### Task 3: Keep warnings stable at four visible items with internal overflow

**Files:**
- Modify: `apps/gdhz-vue-2999/src/components/common/SituationAlerts.vue`
- Modify: `apps/gdhz-vue-2999/src/views/HomeOverview.vue`

**Step 1: Write the failing test**

Capture expected behavior in a small component note or TODO before editing:

- warning panel should visually fit 4 alerts by default
- extra alerts should scroll inside the panel
- homepage compact mode should not collapse warning visibility below the agreed baseline

**Step 2: Run the app mentally against current behavior**

Current gap:

- warning container uses a fixed internal max height unrelated to homepage profile
- visible count can drift when surrounding modules change

**Step 3: Write the minimal implementation**

Update `SituationAlerts.vue` so:

- the scroll container height can be controlled from the homepage via CSS variable or modifier class
- the panel keeps a stable 4-item viewport target
- the existing history entry remains accessible

Use `HomeOverview.vue` only to provide the sizing contract, not to duplicate alert markup.

**Step 4: Run verification**

Run: `npm run build`

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/gdhz-vue-2999/src/components/common/SituationAlerts.vue apps/gdhz-vue-2999/src/views/HomeOverview.vue
git commit -m "feat: stabilize homepage warning panel height"
```

### Task 4: Compress the device panel by shrinking only the list body

**Files:**
- Modify: `apps/gdhz-vue-2999/src/components/device/DeviceExplorer.vue`
- Modify: `apps/gdhz-vue-2999/src/views/HomeOverview.vue`

**Step 1: Write the failing test**

Document expected behavior before editing:

- search, category, and status controls remain visible
- the list body becomes the only scrollable part
- compact mode shows fewer devices without clipping the filter controls

**Step 2: Verify the current gap**

Run: `npm run build`

Expected: PASS build, but current `max-height: 420px` is static and not profile-driven.

**Step 3: Write the minimal implementation**

Refactor `DeviceExplorer.vue` so:

- the root no longer owns the full hard-coded height contract
- the list viewport height is controlled by a CSS variable or parent modifier
- overflow stays inside `.device-list`

Keep existing search/filter interactions unchanged.

**Step 4: Run verification**

Run: `npm run build`

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/gdhz-vue-2999/src/components/device/DeviceExplorer.vue apps/gdhz-vue-2999/src/views/HomeOverview.vue
git commit -m "feat: make homepage device list height adaptive"
```

### Task 5: Make the embedded typhoon module compactable without losing summary data

**Files:**
- Modify: `apps/gdhz-vue-2999/src/components/map/TyphoonInfo.vue`
- Modify: `apps/gdhz-vue-2999/src/views/HomeOverview.vue`

**Step 1: Write the failing test**

Document expected behavior before editing:

- embedded header and key metrics always remain visible
- detailed body can scroll in compact mode
- panel should not force the whole right column taller than the viewport profile allows

**Step 2: Verify the current gap**

Run: `npm run build`

Expected: PASS build, but embedded typhoon content expands naturally with no shared cap.

**Step 3: Write the minimal implementation**

Update `TyphoonInfo.vue` to:

- add an embedded content body wrapper if needed
- keep key summary sections outside the scroll zone when possible
- let detailed historical content scroll internally in compact and standard profiles

Use homepage-provided CSS variables for sizing.

**Step 4: Run verification**

Run: `npm run build`

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/gdhz-vue-2999/src/components/map/TyphoonInfo.vue apps/gdhz-vue-2999/src/views/HomeOverview.vue
git commit -m "feat: add compact scrolling typhoon panel for home"
```

### Task 6: Make coastal observation row count respond to viewport height

**Files:**
- Modify: `apps/gdhz-vue-2999/src/components/layout/CoastalObservationPanel.vue`
- Modify: `apps/gdhz-vue-2999/src/views/HomeOverview.vue`

**Step 1: Write the failing test**

Document expected behavior before editing:

- spacious profile shows 4 rows
- standard profile shows 3 rows
- compact profile shows 2 rows
- remaining stations are available through internal scrolling

**Step 2: Verify the current gap**

Run: `npm run build`

Expected: PASS build, but the grid currently fills available height without a stable visible-row contract.

**Step 3: Write the minimal implementation**

Update `CoastalObservationPanel.vue` to:

- accept a row count or consume a CSS variable
- compute a stable grid viewport height from station card height and gap
- keep the 3-column grid unchanged
- apply `overflow-y: auto` to reveal additional rows

Drive the chosen row count from `HomeOverview.vue` using the shared viewport profile.

**Step 4: Run verification**

Run: `npm run build`

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/gdhz-vue-2999/src/components/layout/CoastalObservationPanel.vue apps/gdhz-vue-2999/src/views/HomeOverview.vue
git commit -m "feat: adapt coastal observation rows by viewport height"
```

### Task 7: Verify the integrated homepage behavior

**Files:**
- Modify: `apps/gdhz-vue-2999/docs/plans/2026-03-06-home-responsive-layout-design.md`

**Step 1: Run automated verification**

Run:

```bash
npm run test
npm run build
```

Expected:

- all tests PASS
- production build PASS

**Step 2: Run manual viewport verification**

Check `/home` in browser at representative heights:

- compact: around `900px`
- standard: around `1080px`
- spacious: around `1440px`

Verify:

- map remains fixed and interactive
- page does not require whole-page vertical scrolling for normal use
- warning panel shows 4 alerts with internal overflow
- device list compresses internally
- typhoon detail compresses internally
- coastal observation visibly shifts between 2/3/4 rows

**Step 3: Update the design doc with any threshold adjustments**

Record any threshold changes or component-level compromises in the design doc if implementation differs from the original proposal.

**Step 4: Commit**

```bash
git add apps/gdhz-vue-2999/docs/plans/2026-03-06-home-responsive-layout-design.md apps/gdhz-vue-2999/docs/plans/2026-03-06-home-responsive-layout-implementation.md
git commit -m "docs: record homepage responsive layout plan"
```
