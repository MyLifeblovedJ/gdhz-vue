# Home Chrome Refinement Design

**Date:** 2026-03-06

**Scope:** Homepage overlay chrome only: warning banner, side panels, legend placement, and right-side tool rail.

## Goals

- Lift both side panels upward so the dashboard feels tighter and less bottom-heavy.
- Constrain the warning banner to the middle safe area so it never overlaps the left or right panels.
- Keep the banner collapse/expand control visually locked to the banner instead of the page edge.
- Reposition the map legend next to the `设备与数据` block.
- Refresh the right-side vertical tool rail in a clean Apple-like style without cyan accents.
- Reduce visible marquee jank before considering any heavier animation rewrite.

## Design Direction

**Aesthetic:** restrained glass hardware

- Material language stays bright, clean, and low-noise.
- Interaction chrome should feel like polished iPadOS/macOS overlays rather than “dashboard neon”.
- Accent color shifts from cyan to warm amber so the controls read premium and calm.

## Layout Decisions

### Side Panels

- Keep the existing two-column structure.
- Reduce top offset by about `14px` so both columns sit higher on the map.
- Preserve current panel widths and internal structure.

### Warning Banner

- The fixed banner wrapper becomes center-aligned instead of stretching full width.
- Its width is derived from the viewport minus both side panel widths and a fixed gutter, with a max width cap.
- The collapse/expand affordance remains inside the banner component, so it automatically follows the narrowed frame.

### Legend

- Positioning is tied to the `设备与数据` block rather than the generic page corner.
- Use measured layout data from the homepage to place the legend just outside the device block, horizontally aligned to that block’s top edge.
- This keeps the legend visually associated with device symbology.

## Performance Decisions

### Banner Marquee

- Keep CSS marquee for this pass. Do not switch to a JavaScript animation loop yet.
- Reduce expensive paint work around the moving content:
  - lighter shadow treatment
  - isolated paint containment
  - explicit GPU-friendly transform path on the track
  - no extra blur layers on the scrolling strip
- If the banner still drops frames after this pass, the next step would be a dedicated JS ticker rewrite.

## Tool Rail Decisions

### Structure

- Preserve the current vertical single-column interaction model.
- Keep the current actions and ordering.

### Visual Direction

- `3D / 2D` remains the primary button.
- Material: cold white glass and graphite edges.
- Active state: soft amber highlight instead of cyan.
- Hover state: subtle lift, brighter fill, tighter shadow.
- Buttons should look more like compact floating hardware controls than generic dashboard pills.

## Data / Logic Changes

- Add a small homepage chrome layout utility to centralize:
  - banner safe width calculation
  - legend anchor calculation from measured rectangles
- This utility is testable and avoids spreading “magic numbers” across component CSS and script logic.

## Risks

- Measuring the device block for legend placement introduces resize coupling, so cleanup on unmount must stay correct.
- Banner width needs safe minimums so narrow windows do not collapse the marquee too aggressively.
- Right rail restyling must not enlarge hit areas so much that it collides with map interaction.

## Verification

- Unit tests for the new homepage chrome layout utility.
- Production build.
- Manual visual check on the homepage for:
  - banner no longer overlapping side panels
  - collapse/expand button moves with the banner
  - legend aligned beside `设备与数据`
  - right tool rail uses the new neutral + amber style
  - marquee movement feels smoother
