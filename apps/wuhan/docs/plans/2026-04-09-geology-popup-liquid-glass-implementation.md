# Geology Popup Liquid Glass Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make geology point click popups use the same liquid-glass outer frame direction as the bottom-left coordinate readout, with blue titles and warm yellow content, in both 2D and 3D map modes.

**Architecture:** Keep geology source data unchanged. Generate a dedicated geology popup HTML structure in the render spec, then attach the existing `attachLiquidGlass()` effect to geology-only popup containers in Leaflet and Cesium. Style the popup shell and inner rows so only geology point popups change.

**Tech Stack:** Vue 3, Leaflet, Cesium, existing `src/utils/liquidGlass.js`

---

### Task 1: Add geology-specific popup markup

**Files:**
- Modify: `src/utils/mapRenderSpec.js`

**Step 1: Create a dedicated geology popup HTML builder**

Add an HTML-safe helper and a geology popup template with title and key/value rows.

**Step 2: Switch geology render items to the dedicated builder**

Use the new helper only for geology point `popupHtml`.

### Task 2: Attach liquid glass to geology popup shells

**Files:**
- Modify: `src/components/map/MapContainer.vue`

**Step 1: Add Cesium popup DOM to the map overlay**

Render hover and popup overlays from reactive popup state so 3D geology popups can be styled and wrapped.

**Step 2: Track popup source type and popup element refs**

Store `sourceType` in Cesium overlay state and add refs/instance cleanup for Leaflet and Cesium glass effects.

**Step 3: Attach glass on popup open / destroy on close**

Apply `attachLiquidGlass()` to the Leaflet geology popup wrapper on `popupopen`, and to the Cesium geology popup shell after render.

### Task 3: Restyle geology popups only

**Files:**
- Modify: `src/components/map/MapContainer.vue`

**Step 1: Replace default white popup chrome**

Remove Leaflet default white wrapper/tip styling for geology popups and let the liquid-glass shell define the frame.

**Step 2: Style shared geology popup content**

Add blue title, blue-gray labels, and warm yellow values, matching the bottom-left readout hierarchy.

### Task 4: Verify behavior

**Files:**
- Modify: none

**Step 1: Run the production build**

Run: `npm run build`

Expected: Vite build succeeds with no new errors.

**Step 2: Sanity check map behavior**

Verify geology point popup opens in 2D and 3D, with liquid-glass shell and new text colors, while non-geology popups remain unchanged.
