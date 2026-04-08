# 2999 Overview AI-First Layout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a first-pass homepage layout that surfaces AI, layers, devices, typhoon+historical merge, and a bottom device detail dock for large-screen display.

**Architecture:** Keep full-screen map as background and preserve current warning placement, then add a top-center AI hub, expand left sidebar content with always-visible layer/device modules, merge historical typhoon below current typhoon panel, and replace popup-style device detail with bottom dock.

**Tech Stack:** Vue 3 + Pinia + existing local components/styles.

---

### Task 1: Add top-center AI hub component
**Files:**
- Create: `src/components/layout/TopCenterAIHub.vue`
- Modify: `src/views/Overview.vue`
- Modify: `src/views/HomeOverview.vue`

### Task 2: Add bottom device detail dock
**Files:**
- Create: `src/components/layout/DeviceDetailDock.vue`
- Modify: `src/views/Overview.vue`
- Modify: `src/views/HomeOverview.vue`

### Task 3: Expose layer and device panels directly in left sidebar
**Files:**
- Modify: `src/components/layout/RightSidebar.vue`

### Task 4: Merge historical similar typhoons under current typhoon panel
**Files:**
- Modify: `src/components/map/TyphoonInfo.vue`
- Modify: `src/components/data/HistoricalDisasterMatch.vue`

### Task 5: Promote coastal video section and rename label
**Files:**
- Modify: `src/components/layout/RealtimeDataPanel.vue`

### Task 6: Verify build
**Files:**
- N/A
- Command: `npm run build`
