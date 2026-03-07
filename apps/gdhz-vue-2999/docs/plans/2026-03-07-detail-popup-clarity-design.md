# Detail Popup Clarity Refinement Design

**Date:** 2026-03-07

**Scope:** Optimize the current bottom-center station/device detail popup while keeping the existing three-part layout and interaction model intact. Focus components are `DetailPopup.vue`, `TimeRangeSelector.vue`, and `DeviceChart.vue`.

## Goals

- Keep the current layout structure, but make the popup substantially clearer and easier to read.
- Preserve the overall bright, Apple-like interface direction already established on the homepage.
- Increase contrast and typographic clarity so text remains readable against the bright glass surface.
- Make the center chart area visually larger and more dominant.
- Standardize the legend so thresholds are easy to interpret and match the chart.
- Make the side columns and center analysis area feel intentionally different.
- Ensure the realtime and history modes occupy a consistent control height so the popup does not jump.

## Design Direction

**Aesthetic:** bright analytical glass

- The popup should still feel like part of the homepage chrome, not a dark data cockpit or a generic dashboard drawer.
- The center should read as an analysis stage.
- The side columns should read as supporting information rails.
- Emphasis should come from hierarchy, contrast, and spacing rather than heavy saturation.

## Layout Decisions

### Overall

- Keep the existing three-part layout.
- Increase the center area’s visual and spatial priority.
- Reduce the visual noise of the side columns so they do not compete with the chart.

### Left Side

- Keep device identity and metadata in the left rail.
- Improve clarity through darker text, tighter grouping, and more stable icon/status presentation.
- The left side should feel like a calm summary panel.

### Center

- The center stays the primary reading surface.
- Increase the chart container height and reduce wasted chrome around it.
- Group realtime/history switch, observation element tabs, time controls, and legend into a cleaner, more deliberate toolbar hierarchy.
- History mode and realtime mode must occupy consistent vertical space.

### Right Side

- Convert the right side into a summary-card rail instead of a long equal-weight list.
- Use:
  - one dominant current-reading card
  - unit and status close to the main value
  - a small set of supporting summaries such as threshold comparison, selected element, and update time
- The right rail should be easy to scan at a glance and clearly secondary to the center chart.

## Visual Decisions

### Contrast

- Raise text contrast globally.
- Replace washed-out gray copy with deeper blue-gray and near-graphite text.
- Make all core labels readable without increasing noise.

### Typography

- Do not solve clarity by making everything larger.
- Use:
  - stronger contrast for primary text
  - modest weight increases where needed
  - cleaner vertical rhythm
- Device name, current reading, chart-relevant labels, and legend text should be visibly stronger than tertiary metadata.

### Column Differentiation

- Left and right rails use lighter, calmer background treatment.
- Center uses a more defined high-contrast analysis panel.
- Differentiation should come from subtle layering, not mismatched color families.
- The right rail should feel more compact and summary-driven than the left rail.

### Chart Surface

- Keep the center panel light, but more analytical:
  - clearer frame
  - stronger axis/label contrast
  - more visible line color
  - more legible threshold lines
- The chart should become the strongest visual element inside the popup.

### Legend

- Replace loose legend text with a more systematic legend row or chip group.
- Threshold colors and labels must map directly to chart mark lines.
- Labels should follow a consistent format such as `蓝色 150cm`.

## Time Controls

- Keep the same feature scope:
  - quick ranges
  - custom datetime range
  - timeline strip
- Realtime and history states should reserve equal toolbar height.
- In realtime mode, use a quiet placeholder or summary strip so the center panel height does not shift.

## Device Chart Adjustments

- Increase contrast of:
  - axis labels
  - axis lines
  - tooltip
  - threshold labels
  - series line
- Improve chart readability on the bright popup surface without switching to a dark chart.

## Constraints

- No structural redesign of popup behavior.
- No new data model.
- No API or store changes.
- No changes to popup entry/exit behavior.

## Risks

- Raising contrast too aggressively can break the calm Apple-like tone.
- Enlarging the chart without rebalancing adjacent spacing can make the toolbar feel cramped.
- If the legend becomes too heavy, it will steal attention from the chart itself.

## Verification

- Structural snapshot tests for `DetailPopup.vue` and `TimeRangeSelector.vue` may stay light, since this task is mostly refinement rather than layout replacement.
- Production build.
- Manual verification on the homepage for:
  - clearer text across all three sections
  - larger, more legible chart
  - consistent height between realtime and history modes
  - cleaner, more standardized threshold legend
  - stronger distinction between side rails and center analysis panel
