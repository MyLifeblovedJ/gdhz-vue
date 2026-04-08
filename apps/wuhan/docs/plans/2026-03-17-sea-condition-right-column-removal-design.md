# Sea Condition Right Column Removal Design

**Goal**

Remove the entire right-side coastal observation column from the sea condition page, keep the existing left column and top alert banner, and move the vertical tool rail back to the page's right edge without changing the homepage layout.

**Scope**

- Only change `apps/gdhz-vue-2999/src/views/SeaConditionHome.vue`
- Add or update focused tests for the sea condition page layout contract
- Do not modify `apps/gdhz-vue-2999/src/views/HomeOverview.vue`

**Approach**

1. Delete the `right-column` section from `SeaConditionHome.vue` so the page no longer renders `CoastalObservationPanel`.
2. Remove the unused `CoastalObservationPanel` import and any right-column-only layout styles.
3. Change the page-local `--tool-rail-safe-right` variable from a column-width-based calculation to a fixed edge gutter so the tool rail and its slide-out panels align to the viewport edge.
4. Leave the alert banner logic untouched so it stays centered over the map.
5. Keep the homepage on its own layout contract, with no shared refactor in this change.

**Why This Design**

- It keeps the change isolated to the sea condition page.
- It avoids hidden placeholder layout that would still reserve dead space.
- It reuses the existing tool rail positioning model by only changing the page-local CSS variable, which minimizes regression risk.

**Testing**

- Assert `SeaConditionHome.vue` no longer contains `right-column`
- Assert `SeaConditionHome.vue` no longer imports or renders `CoastalObservationPanel`
- Assert `--tool-rail-safe-right` on the sea condition page no longer depends on `var(--home-column-width)`
