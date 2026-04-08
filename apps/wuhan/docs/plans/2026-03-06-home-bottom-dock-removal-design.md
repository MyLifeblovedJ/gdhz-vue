# 2999 Home Bottom Dock Removal Design

**Date:** 2026-03-06

**Scope:** `apps/gdhz-vue-2999` homepage (`/home`) only

## Background

The homepage currently renders `DataDock` at the bottom of the overlay layout. The user wants to remove this bottom dock for now and redesign that region later.

The immediate requirement is not to replace it with a new feature yet. Instead:

- Remove the current `DataDock` content from the homepage.
- Keep a stable bottom reserved area.
- Do not pull the side columns down to fill the removed dock space.
- Treat the bottom area as intentional whitespace for a later redesign.

## Goals

- Stop rendering the current bottom `DataDock` on the homepage.
- Preserve the current homepage skeleton and responsive behavior.
- Keep a reserved bottom slot with stable height.
- Make the empty area feel intentional rather than like a broken layout.

## Non-Goals

- No redesign of the new bottom section yet.
- No change to map interactions.
- No change to left or right business panel contents.
- No change to the current viewport profile strategy beyond keeping the reserved bottom slot.

## Current Constraint

`HomeOverview.vue` already reserves vertical space for a dock area through the shared viewport metrics and layout height calculations. That reserved height should stay in place even after the dock content is removed.

## Approved Direction

The approved direction is:

1. Remove the rendered `DataDock` component from the homepage.
2. Keep the bottom slot height in the layout.
3. Use a clean reserved spacer instead of a visual placeholder panel.
4. Do not fill the reserved slot with borders, labels, helper text, or fake controls.
5. Preserve the existing relationship between the top content area and the bottom reserved area.

## Options Considered

### Option 1: Remove the dock and let columns extend to the bottom

**Pros**
- Minimal visible empty space
- Simplest visual result in the short term

**Cons**
- Breaks the current layout rhythm
- Forces another layout rebalance when the future bottom redesign arrives
- Increases rework risk

### Option 2: Remove the dock content but keep a fixed reserved bottom area

**Pros**
- Best fit for iterative redesign
- Preserves current responsive structure
- Makes later replacement straightforward

**Cons**
- Leaves intentional empty space in the current version

### Option 3: Replace the dock with a visible placeholder frame

**Pros**
- Clearly marks the region as reserved

**Cons**
- Looks unfinished
- Adds visual noise with no current user value

## Decision

Use **Option 2**.

## Layout Strategy

The homepage should keep the same high-level frame:

- Fixed fullscreen map background
- Top content area with left and right columns
- Bottom reserved slot with stable height

The only difference is that the bottom slot no longer renders `DataDock`.

## Visual Treatment

The reserved bottom slot should be visually quiet:

- transparent background
- no border
- no caption
- no placeholder copy
- no interactive elements

It should function purely as spacing and future insertion point.

## Implementation Shape

Expected changes are limited to:

- `src/views/HomeOverview.vue`

Likely actions:

1. remove the `DataDock` import
2. remove the `DataDock` render node
3. add a lightweight reserved spacer element, or preserve the reserved area through layout structure
4. keep `dockHeight` or the equivalent bottom reservation metric in use

## Validation Criteria

The change is successful when:

1. `DataDock` is no longer rendered on `/home`
2. the homepage still keeps a bottom reserved slot
3. the side columns do not extend downward to consume that slot
4. map interaction is unchanged
5. existing internal scroll behavior in side modules is unchanged
6. the bottom whitespace reads as deliberate negative space rather than a broken missing component

## Risks

- If the dock node is removed without preserving layout reservation, the columns will expand and create another layout change that must later be undone.
- If the reserved spacer is styled too visibly, the page will look unfinished rather than intentionally minimal.

## Follow-Up

The reserved slot becomes the insertion point for the later bottom redesign. When that redesign starts, it should replace the reserved spacer instead of rebuilding the page height logic again.
