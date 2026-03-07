# 2999 Home Responsive Layout Design

**Date:** 2026-03-06

**Scope:** `apps/gdhz-vue-2999` homepage (`/home`) only

## Background

The current 2999 homepage uses a fixed fullscreen map with floating left and right columns. This works well on large displays, but the visible content density changes too much between lower-height laptop screens and taller desktop displays.

The main issue is vertical adaptation, not structural layout. The user wants to keep the current two-column composition and map interaction model intact:

- Keep the fixed map background and map zoom/pan interaction.
- Keep the left/right column structure unchanged.
- Avoid whole-page vertical scrolling as the primary fallback.
- When viewport height is limited, compress selected content areas and let those modules scroll internally.

## Goals

- Keep the homepage visual structure stable from 1K-class displays through 4K displays.
- Preserve the current "map as stage, panels as overlays" interaction model.
- Use viewport height as the primary responsive driver.
- Show more content on tall screens and less content on short screens without collapsing the layout.
- Make module-level scrolling predictable and intentional.

## Non-Goals

- No switch to single-column mobile layout.
- No whole-page scrolling redesign.
- No homepage information architecture changes.
- No behavior changes to map controls, layer tools, or camera overlay.

## Current Constraints

- `src/views/HomeOverview.vue` uses a fixed fullscreen map and a floating overlay layout.
- Left and right columns are already separated into stable blocks.
- Existing embedded modules already support internal overflow in some cases, but their heights are not coordinated by a shared viewport-height strategy.

## Approved Interaction Model

The approved model is:

1. The page keeps its current two-column overlay structure.
2. The map remains fixed and fully interactive in the center stage.
3. The page itself should avoid becoming a long vertically scrolling document.
4. When viewport height is insufficient, individual modules shrink in a controlled order.
5. Overflow is handled inside the affected module, not by scrolling the entire homepage.

## Content Priority

### Left Column

1. Warning panel
2. Device summary cards
3. Device list

### Right Column

1. Typhoon topic panel
2. Coastal observation station grid

## Module Rules

### Warning Panel

- Keep the current role as the highest-priority summary area.
- Default visible alert count remains 4.
- Additional alerts remain accessible through internal scrolling.
- This panel should stay visually stable across height profiles and should not be the first module to lose space.

### Device And Data Panel

- Keep the top statistics row always visible.
- The filter/search header remains visible.
- The device list body becomes the main flexible scroll area.
- On shorter screens, reduce only the list viewport, not the summary cards.

### Typhoon Topic Panel

- Allow moderate vertical compression in medium and compact height profiles.
- Preserve header and key summary data.
- Let the detailed content scroll internally when height is constrained.

### Coastal Observation Panel

- Use visible row count as the primary adaptation mechanism.
- Tall screens: show 4 rows.
- Standard screens: show 3 rows.
- Compact screens: show 2 rows.
- Remaining stations are accessible through internal scrolling.

This module is the best candidate for aggressive compression because the content is naturally grid-based.

## Responsive Strategy

Viewport height drives the primary response. Width remains a secondary constraint only to prevent side columns from becoming too wide or too narrow.

### Height Profiles

#### Spacious

- Condition: around `>= 1280px` viewport height
- Coastal observation: 4 visible rows
- Typhoon panel: near full embedded display
- Device list: expanded viewport

#### Standard

- Condition: around `980px - 1279px`
- Coastal observation: 3 visible rows
- Typhoon panel: mildly compressed
- Device list: reduced list viewport

#### Compact

- Condition: around `<= 979px`
- Coastal observation: 2 visible rows
- Typhoon panel: fixed compact body height with internal scroll
- Device list: compact list viewport with internal scroll
- Warning panel remains fixed at 4 visible alerts

These thresholds are starting points and may be tuned after in-browser verification.

## Layout Mechanics

The implementation should use a shared height profile model rather than unrelated hard-coded heights inside each child component.

Recommended mechanics:

- Define page-level CSS variables or profile classes in `HomeOverview.vue`.
- Assign each module an `ideal`, `compact`, and `minimum` body height target.
- Preserve headers and summary zones.
- Apply `max-height` and `overflow-y: auto` only to content bodies that are meant to shrink.

## Recommended Compression Order

When vertical space becomes insufficient, compress modules in this order:

1. Coastal observation body
2. Typhoon detail body
3. Device list body
4. Warning panel remains mostly stable

This order matches the user requirement to preserve key warnings while sacrificing lower-priority detail density first.

## Implementation Shape

Primary changes are expected in:

- `src/views/HomeOverview.vue`
- `src/components/layout/CoastalObservationPanel.vue`
- `src/components/device/DeviceExplorer.vue`
- `src/components/map/TyphoonInfo.vue`
- `src/components/common/SituationAlerts.vue`

The preferred approach is CSS-first for sizing, with a small shared viewport-profile helper if needed to coordinate profile selection and keep behavior testable.

## Validation Criteria

The design is considered successful when:

1. The homepage keeps the current two-column structure on large and smaller desktop screens.
2. The map remains fixed and interactive in all supported height profiles.
3. The page does not rely on whole-page vertical scrolling for normal use.
4. Warning panel shows 4 alerts by default, with overflow handled internally.
5. Coastal observation visibly shifts between 4, 3, and 2 rows depending on height.
6. Device and typhoon detail areas shrink with internal scroll instead of pushing the page taller.
7. Large screens still expose more content without wasted empty vertical space.

## Risks

- Independent component overflow rules may conflict unless coordinated from the page level.
- Embedded typhoon content may need a dedicated scroll body wrapper to avoid clipping important summaries.
- If child components keep their own fixed heights, the parent page-level adaptation will remain inconsistent.

## Decision

Proceed with a fixed-shell, module-level responsive strategy:

- Preserve the current homepage structure.
- Drive adaptation mainly by viewport height.
- Keep warnings stable at 4 visible items.
- Compress selected modules in priority order.
- Use internal scrolling inside those modules instead of converting the homepage into a scrolling document.
