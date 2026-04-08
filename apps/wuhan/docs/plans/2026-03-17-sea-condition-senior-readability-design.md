# Sea Condition Senior Readability Design

**Goal**

Increase readability across the sea condition page for senior leadership by moving the left sidebar to the 35% scale tier and enlarging every right-side tool-rail popup panel, while leaving the homepage unchanged.

**Scope**

- Only change `apps/gdhz-vue-2999/src/views/SeaConditionHome.vue`
- Extend focused page-contract tests in `apps/gdhz-vue-2999/src/views/SeaConditionHome.test.js`
- Do not modify `apps/gdhz-vue-2999/src/views/HomeOverview.vue`

**Approach**

1. Increase the sea condition page left-column width curve from the current enlarged mode to a stronger 35% readability tier with higher min/max bounds.
2. Keep the page structure unchanged so the map, banner, and right-edge tool rail remain stable.
3. Continue using page-scoped `:deep(...)` overrides for the left-column panels.
4. Add a matching set of page-scoped readability overrides for all four tool-rail popup panels:
   - Layer control
   - Typhoon topic
   - Device explorer
   - AI decision panel
5. Enlarge popup shell widths, headers, close buttons, stats cards, row spacing, and embedded component typography so the whole page reads as one consistent senior-friendly mode.

**Why This Design**

- It keeps the readability mode isolated to the sea condition page.
- It avoids changing shared component defaults that may also affect the homepage.
- It builds on the existing page-local override pattern, which minimizes regression risk.

**Testing**

- Assert the sea condition page width resolver uses the stronger 35% scale curve
- Assert the page source contains right-side readability overrides for layer, typhoon, device, and AI popup panels
- Run focused source tests and a production build
