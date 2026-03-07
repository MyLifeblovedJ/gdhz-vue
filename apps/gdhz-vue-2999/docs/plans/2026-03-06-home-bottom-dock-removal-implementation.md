# 2999 Home Bottom Dock Removal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove the current bottom `DataDock` from the 2999 homepage while preserving a stable reserved bottom slot for a future redesign.

**Architecture:** Keep the existing home viewport profile layout intact and continue reserving bottom height through the current layout metrics. Modify only `HomeOverview.vue` so the dock component is no longer rendered, replacing it with a minimal non-visual spacer that keeps the current skeleton stable.

**Tech Stack:** Vue 3, Vite, scoped CSS, existing home layout utilities.

---

### Task 1: Remove `DataDock` rendering but keep bottom reservation

**Files:**
- Modify: `apps/gdhz-vue-2999/src/views/HomeOverview.vue`

**Step 1: Write the failing test**

Record expected behavior in a short code comment before editing:

- homepage must no longer render `DataDock`
- homepage must still preserve a bottom reserved slot
- side columns must not stretch down into the reserved space

**Step 2: Run build to verify current baseline**

Run: `npm run build`

Expected: PASS build with the current homepage still rendering `DataDock`.

**Step 3: Write the minimal implementation**

Update `HomeOverview.vue` to:

- remove the `DataDock` import
- remove the `<DataDock />` node
- insert a minimal reserved spacer such as `home-bottom-reserved`
- keep current bottom slot height logic through existing viewport metrics and CSS variables

Do not change map logic, side panel composition, or viewport profile thresholds.

**Step 4: Run verification**

Run: `npm run build`

Expected: PASS with no compile errors.

**Step 5: Commit**

```bash
git add apps/gdhz-vue-2999/src/views/HomeOverview.vue
git commit -m "refactor: remove home bottom dock and keep reserved slot"
```

### Task 2: Verify the homepage keeps the intended empty bottom stage

**Files:**
- Modify: `apps/gdhz-vue-2999/docs/plans/2026-03-06-home-bottom-dock-removal-design.md`

**Step 1: Run manual verification**

Check `/home` in the browser and verify:

- bottom `DataDock` content is gone
- bottom area remains visually reserved
- left and right columns keep their current vertical rhythm
- map interaction still works
- internal scrolling in side panels still works

Recommended viewport checks:

- compact: around `900px`
- standard: around `1080px`
- spacious: around `1440px`

**Step 2: Update design doc if implementation differs**

If the reserved spacer height or visual treatment is adjusted during implementation, record the final behavior in the design doc.

**Step 3: Run final verification**

Run:

```bash
npm run build
```

Expected: PASS.

**Step 4: Commit**

```bash
git add apps/gdhz-vue-2999/docs/plans/2026-03-06-home-bottom-dock-removal-design.md apps/gdhz-vue-2999/docs/plans/2026-03-06-home-bottom-dock-removal-implementation.md
git commit -m "docs: record home bottom dock removal plan"
```
