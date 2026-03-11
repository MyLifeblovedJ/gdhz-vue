# Home Seawall Visibility Design

**Goal:** Improve the visible height of the home-page seawall risk list on laptop-class screens after the left rail is scrolled to the bottom, without shrinking the warning or AI decision panels.

## Context

The left rail in `src/views/HomeOverview.vue` currently treats the seawall block as a fill-area panel. On screens such as `1680x1050` and `1920x1200`, that means the seawall list only gets the leftover height after the warning and AI blocks render, so users can reach the bottom of the rail and still see only about one to two items.

The map legend position is also anchored near the AI decision block bottom edge. The requested behavior is to align the legend top edge with the AI decision block top edge.

## Chosen Approach

1. Keep the warning and AI decision panels at their current visual density.
2. Increase the seawall panel's own minimum/target height for the standard laptop viewport profile so that, once the rail is scrolled down, the seawall list occupies more vertical space on screen.
3. Update the legend anchor utility so the legend top edge follows the AI decision block top edge instead of the bottom-derived position.

## Why This Approach

- It directly improves the user-visible seawall list area at the bottom of the rail.
- It does not compress the upper panels, which was explicitly rejected.
- It keeps the behavioral change in the existing layout utility layer, making it testable with Vitest.

## Validation

- Add Vitest coverage for the updated viewport metrics and legend anchor behavior.
- Run the targeted tests.
- Run a production build for `apps/gdhz-vue-2999`.
