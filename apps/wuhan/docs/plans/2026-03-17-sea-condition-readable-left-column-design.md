# Sea Condition Readable Left Column Design

**Goal**

Make the sea condition page easier to read for senior leadership by widening the left sidebar and enlarging key typography, while keeping the homepage unchanged.

**Scope**

- Only change `apps/gdhz-vue-2999/src/views/SeaConditionHome.vue`
- Add focused page-contract tests in `apps/gdhz-vue-2999/src/views/SeaConditionHome.test.js`
- Do not modify `apps/gdhz-vue-2999/src/views/HomeOverview.vue`

**Approach**

1. Increase the page-local left-column width target on `SeaConditionHome.vue` by using a dedicated width resolver instead of the current shared sizing curve.
2. Keep the rest of the page structure intact so map, banner, and tool rail behavior stay stable.
3. Add page-scoped typography overrides with `:deep(...)` for `SituationAlerts` and `SeawallRiskPanel` so titles, primary values, and list text render larger and clearer only on this page.
4. Loosen the left-column spacing slightly so the larger type still breathes and does not feel crowded.

**Why This Design**

- It isolates the accessibility-focused change to the sea condition page.
- It avoids changing the default styles of shared components that are also used on the homepage.
- It keeps the implementation small and reversible while materially improving readability.

**Testing**

- Assert the sea condition page uses a dedicated enlarged column-width resolver
- Assert the page source contains left-column readability overrides for warning and seawall panels
- Run a focused source test and a production build
