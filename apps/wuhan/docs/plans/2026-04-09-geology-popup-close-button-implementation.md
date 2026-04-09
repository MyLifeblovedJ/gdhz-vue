# Geology Popup Close Button Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a top-right close button to geology point popups and update the liquid-glass border to match the search box's thin white outline.

**Architecture:** Keep the existing geology popup content builder, but add a close button into the popup HTML so both Leaflet and Cesium can render the same structure. Handle close actions through shared popup-close logic in `MapContainer.vue`, and update the liquid-glass border token so the frame matches the search box.

**Tech Stack:** Vue 3, Leaflet, Cesium, existing `src/utils/liquidGlass.js`

---

### Task 1: Extend geology popup markup

**Files:**
- Modify: `src/utils/mapRenderSpec.js`

**Step 1: Add a close button into the geology popup HTML**

Render a button in the popup card before the title.

### Task 2: Wire close behavior in 2D and 3D

**Files:**
- Modify: `src/components/map/MapContainer.vue`

**Step 1: Add a shared geology popup close helper**

Close the active map popup, clear geology selection, and refresh cursors/overlays.

**Step 2: Hook Leaflet popup clicks**

Detect clicks on the geology popup close button inside Leaflet popup DOM and invoke the shared close helper.

**Step 3: Hook Cesium popup clicks**

Use click delegation on the Cesium popup content wrapper so the `×` button closes the geology popup in 3D too.

### Task 3: Match the search-box border

**Files:**
- Modify: `src/components/map/MapContainer.vue`

**Step 1: Switch popup glass border token**

Use `1px solid rgba(255, 255, 255, 0.5)` for the geology popup liquid-glass shell.

**Step 2: Style the close button**

Place the button at the top-right with hover and focus states that fit the existing popup.

### Task 4: Verify

**Files:**
- Modify: none

**Step 1: Run the production build**

Run: `npm run build`

Expected: build succeeds.
