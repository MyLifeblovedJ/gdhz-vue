<template>
  <div ref="pageRootRef" class="home-page" :style="homeChromeStyle">
    <MapContainer
      ref="mapRef"
      class="home-map"
      :current-basemap="currentBasemap"
      :map-mode="store.mapMode"
      :fullscreen="true"
      :center="[22.0, 112.5]"
      :zoom="7.5"
      @device-click="handleDeviceClick"
    />

    <div class="overlay-banner-fixed" :class="{ hidden: isBannerHidden }">
      <AlertBanner class="overlay-banner" />
    </div>

    <MapLegend />
    <CoastalCameraOverlay :visible="showCameraOverlay" :stations="erosionVideoData" :map-ref="mapRef" />

    <MapToolRail
      :layer-panel-open="showLayerPanel"
      :device-panel-open="showDevicePanel"
      :show-device-btn="true"
      :ai-panel-open="showAIPanel"
      :show-a-i-btn="true"
      @toggle-layer-panel="toggleLayerPanel"
      @toggle-device-panel="toggleDevicePanel"
      @toggle-ai-panel="toggleAIPanel"
    />

    <MapActionDock
      :map-mode="store.mapMode"
      :camera-active="showCameraOverlay"
      :typhoon-active="showTyphoonPanel"
      :vessel-active="Boolean(store.layerVisibility.vessels)"
      :wind-active="Boolean(store.layerVisibility.wind_particle)"
      :fullscreen-active="isBrowserFullscreen"
      @zoom-in="handleZoomIn"
      @zoom-out="handleZoomOut"
      @toggle-map-mode="handleToggleMapMode"
      @reset-view="handleResetView"
      @toggle-basemap="handleToggleBasemap"
      @toggle-typhoon="toggleTyphoonPanel"
      @toggle-fullscreen="handleToggleFullscreen"
      @toggle-camera="toggleCameraOverlay"
      @toggle-vessels="() => toggleLayerFlag('vessels')"
      @toggle-wind="() => toggleLayerFlag('wind_particle')"
    />

    <Transition name="tool-rail-panel">
      <aside v-if="showLayerPanel" class="tool-rail-layer-shell">
        <div class="tool-rail-layer-panel">
          <div class="tool-rail-layer-header">
            <div class="tool-rail-layer-title">
              <i class="fa-solid fa-layer-group"></i>
              图层控制
            </div>
            <button class="tool-rail-layer-close" type="button" @click="closeLayerPanel">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="tool-rail-layer-content">
            <LayerControl @layer-toggle="handleLayerToggle" />
          </div>
        </div>
      </aside>
    </Transition>

    <Transition name="tool-rail-panel">
      <aside v-if="showTyphoonPanel" class="tool-rail-typhoon-shell">
        <div class="tool-rail-typhoon-panel">
          <div class="tool-rail-typhoon-header">
            <div class="tool-rail-typhoon-title">
              <i class="fa-solid fa-hurricane"></i>
              台风专题
            </div>
            <button class="tool-rail-typhoon-close" type="button" @click="closeTyphoonPanel">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="tool-rail-typhoon-content">
            <TyphoonInfo embedded />
          </div>
        </div>
      </aside>
    </Transition>

    <Transition name="tool-rail-panel">
      <aside v-if="showDevicePanel" class="tool-rail-device-shell">
        <div class="tool-rail-device-panel">
          <div class="tool-rail-device-header">
            <div class="tool-rail-device-title">
              <i class="fa-solid fa-satellite-dish"></i>
              设备与数据
            </div>
            <button class="tool-rail-device-close" type="button" @click="closeDevicePanel">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="tool-rail-device-stats">
            <div class="stats-row">
              <div class="stat-card">
                <span class="label">总设备</span>
                <span class="value">{{ store.devices.length }}</span>
              </div>
              <div class="stat-card">
                <span class="label">在线</span>
                <span class="value online">{{ store.onlineDevices.length }}</span>
              </div>
              <div class="stat-card">
                <span class="label">告警</span>
                <span class="value warn">{{ store.alertDevices.length }}</span>
              </div>
              <div class="stat-card">
                <span class="label">数据完整率</span>
                <span class="value completeness">{{ dataCompletenessRate }}</span>
              </div>
            </div>
          </div>
          <div class="tool-rail-device-content">
            <DeviceExplorer @device-click="handleDeviceClick" />
          </div>
        </div>
      </aside>
    </Transition>

    <Transition name="tool-rail-panel">
      <aside v-if="showAIPanel" class="tool-rail-ai-shell">
        <div class="tool-rail-ai-panel">
          <div class="tool-rail-ai-header">
            <div class="tool-rail-ai-title">
              <i class="fa-solid fa-wand-magic-sparkles"></i>
              智能决策
            </div>
            <button class="tool-rail-ai-close" type="button" @click="closeAIPanel">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="tool-rail-ai-content">
            <AIDecisionPanel />
          </div>
        </div>
      </aside>
    </Transition>

    <div class="home-overlay">
      <div class="two-column-layout">
        <section ref="leftColumnRef" class="column left-column">
          <div class="column-block warning-block">
            <div class="block-body warning-body">
              <SituationAlerts :alerts="store.alerts" />
            </div>
          </div>

          <div ref="seawallBlockRef" class="column-block seawall-block">
            <div class="block-title"><i class="fa-solid fa-shield-halved"></i> 海堤风险</div>
            <div class="block-body seawall-body">
              <SeawallRiskPanel />
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- Station Detail Popup (复刻态势感知) -->
    <DetailPopup
      v-if="selectedDevice"
      :device="selectedDevice"
      @close="selectedDevice = null; glassVisible = false"
    />

    <!-- Station Glass Popup on Map -->
    <StationGlassPopup
      :device="selectedDevice"
      :screenX="glassScreenX"
      :screenY="glassScreenY"
      :visible="glassVisible"
      @glass-show="(id) => mapRef?.setDevicePulseVisible(id, false)"
      @glass-hide="(id) => mapRef?.setDevicePulseVisible(id, true)"
      @close="closeGlass"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { useAppStore } from '../stores/app'
import { HOME_DEFAULT_MAP_MODE } from '../utils/homeMapMode'
import { getHomeBannerBounds, getHomeLegendAnchor } from '../utils/homeChromeLayout'
import { getHomeViewportMetrics } from '../utils/homeViewportProfile'
import SituationAlerts from '../components/common/SituationAlerts.vue'
import AlertBanner from '../components/layout/AlertBanner.vue'
import CoastalCameraOverlay from '../components/layout/CoastalCameraOverlay.vue'
import { mockErosionVideoStreams } from '../data/mockData'
import AIDecisionPanel from '../components/decision/AIDecisionPanel.vue'
import MapActionDock from '../components/layout/MapActionDock.vue'
import SeawallRiskPanel from '../components/layout/SeawallRiskPanel.vue'
import MapToolRail from '../components/layout/MapToolRail.vue'
import LayerControl from '../components/map/LayerControl.vue'
import DeviceExplorer from '../components/device/DeviceExplorer.vue'
import MapContainer from '../components/map/MapContainer.vue'
import MapLegend from '../components/map/MapLegend.vue'
import TyphoonInfo from '../components/map/TyphoonInfo.vue'
import DetailPopup from '../components/common/DetailPopup.vue'
import StationGlassPopup from '../components/map/StationGlassPopup.vue'

const store = useAppStore()
const pageRootRef = ref(null)
const leftColumnRef = ref(null)
const mapRef = ref(null)
const aiDecisionBlockRef = ref(null)
const seawallBlockRef = ref(null)
const deviceBlockRef = ref(null)
const currentBasemap = ref('satellite')
const showCameraOverlay = ref(true)
const showLayerPanel = ref(false)
const showTyphoonPanel = ref(false)
const showDevicePanel = ref(false)
const showAIPanel = ref(true)
const isBrowserFullscreen = ref(false)
const isBannerHidden = ref(false)
const legendLeft = ref(0)
const legendTop = ref(82)
const selectedDevice = ref(null)
let previousHomeVesselVisibility = true
let previousLayerSnapshot = null
let legendResizeObserver = null
const basemaps = ['satellite', 'dark', 'street']

const { width: viewportWidth, height: viewportHeight } = useWindowSize()

// 海岸观测视频数据（含风险等级、侵蚀速率等）
const erosionVideoData = mockErosionVideoStreams.map(s => ({
  id: s.id,
  stationName: s.stationName,
  status: s.status,
  snapshotUrl: s.snapshotUrl,
  lastUpdate: s.lastUpdate,
  lat: s.location.lat,
  lng: s.location.lng,
  city: s.meta.city,
  riskLevel: s.riskLevel,
  erosionRate: s.erosionRate,
  coastlineChange: s.coastlineChange,
}))

const dataCompletenessRate = computed(() => {
  const total = store.devices.length
  if (!total) return '0%'
  return `${Math.round((store.onlineDevices.length / total) * 100)}%`
})

function resolveSeaConditionColumnWidth(width) {
  const safeWidth = Number(width) || 0
  if (safeWidth <= 1440) return Math.min(500, Math.max(420, safeWidth * 0.35))
  if (safeWidth <= 1680) return Math.min(580, Math.max(460, safeWidth * 0.35))
  return Math.min(680, Math.max(520, safeWidth * 0.35))
}

const currentColumnWidth = computed(() => Math.round(resolveSeaConditionColumnWidth(viewportWidth.value)))
const viewportMetrics = computed(() => getHomeViewportMetrics(viewportHeight.value))
const homeBannerBounds = computed(() =>
  getHomeBannerBounds({
    viewportWidth: viewportWidth.value,
    columnWidth: currentColumnWidth.value,
  })
)

const homeChromeStyle = computed(() => ({
  '--home-column-width': `${currentColumnWidth.value}px`,
  '--home-banner-width': `${homeBannerBounds.value.width}px`,
  '--home-banner-max-width': `${homeBannerBounds.value.maxWidth}px`,
  '--home-banner-min-width': `${homeBannerBounds.value.minWidth}px`,
  '--home-warning-visible-rows': viewportMetrics.value.warningVisibleRows,
  '--home-warning-body-max-height': `${viewportMetrics.value.warningBodyMaxHeight}px`,
  '--home-device-body-max-height': `${viewportMetrics.value.deviceListMaxHeight}px`,
  '--home-seawall-panel-min-height': `${viewportMetrics.value.seawallPanelMinHeight}px`,
  '--map-safe-left': `${legendLeft.value || (currentColumnWidth.value + 26)}px`,
  '--map-safe-top': `${legendTop.value}px`,
  '--map-safe-bottom': 'auto',
}))

function updateLegendAnchor() {
  if (!leftColumnRef.value) return
  const rootRect = pageRootRef.value?.getBoundingClientRect() || {
    left: 0,
    top: 0,
    height: viewportHeight.value,
  }
  const legendRect = pageRootRef.value?.querySelector('.map-legend-wrapper')?.getBoundingClientRect()
  const anchor = getHomeLegendAnchor({
    rootRect,
    leftColumnRect: leftColumnRef.value.getBoundingClientRect(),
    decisionRect: seawallBlockRef.value?.getBoundingClientRect(),
    legendRect,
    leftOffset: 18,
  })

  legendLeft.value = anchor.left
  legendTop.value = anchor.top
}

const glassVisible = ref(false)
const glassScreenX = ref(0)
const glassScreenY = ref(0)

let glassOpenZoom = null
let zoomWatcher = null
let glassRaf = null

function startGlassTracking() {
  stopGlassTracking()
  const tick = () => {
    if (glassVisible.value && selectedDevice.value) {
      updateGlassPosition(selectedDevice.value)
    }
    glassRaf = requestAnimationFrame(tick)
  }
  glassRaf = requestAnimationFrame(tick)
}

function stopGlassTracking() {
  if (glassRaf) { cancelAnimationFrame(glassRaf); glassRaf = null }
}

async function handleDeviceClick(device) {
  selectedDevice.value = device
  glassVisible.value = false
  // Remove previous watchers
  if (zoomWatcher) { mapRef.value?.offZoomChange(zoomWatcher); zoomWatcher = null }
  stopGlassTracking()
  await mapRef.value?.flyToDevice(device.id)
  updateGlassPosition(device)
  glassVisible.value = true
  glassOpenZoom = mapRef.value?.getZoom() ?? null

  // Watch for zoom-out beyond 2 steps (tolerance = 1.0) to close glass
  zoomWatcher = (zoom) => {
    if (glassOpenZoom !== null && zoom < glassOpenZoom - 1.0) {
      closeGlass()
    }
  }
  mapRef.value?.onZoomChange(zoomWatcher)

  // Start rAF loop for frame-perfect tracking
  startGlassTracking()
}

function closeGlass() {
  glassVisible.value = false
  glassOpenZoom = null
  if (zoomWatcher) { mapRef.value?.offZoomChange(zoomWatcher); zoomWatcher = null }
  stopGlassTracking()
}

function updateGlassPosition(device) {
  if (!device) return
  const pt = mapRef.value?.latLngToScreenPoint(device.lat, device.lng)
  if (pt) {
    glassScreenX.value = pt.x
    glassScreenY.value = pt.y
  }
}

function handleLayerToggle({ layerId, checked }) {
  store.setLayerVisibility(layerId, checked)
}

function handleZoomIn() {
  mapRef.value?.zoomIn()
}

function handleZoomOut() {
  mapRef.value?.zoomOut()
}

function handleResetView() {
  mapRef.value?.resetView()
}

function handleLocate() {
  return
}

function handleBasemapChange(basemapId) {
  currentBasemap.value = basemapId
}

function handleToggleBasemap() {
  const currentIndex = basemaps.indexOf(currentBasemap.value)
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % basemaps.length : 0
  handleBasemapChange(basemaps[nextIndex])
}

function handleToggleMapMode() {
  store.toggleMapMode()
}

function toggleCameraOverlay() {
  showCameraOverlay.value = !showCameraOverlay.value
}

function toggleLayerPanel() {
  showLayerPanel.value = !showLayerPanel.value
}

function closeLayerPanel() {
  showLayerPanel.value = false
}

function toggleTyphoonPanel() {
  showTyphoonPanel.value = !showTyphoonPanel.value
}

function closeTyphoonPanel() {
  showTyphoonPanel.value = false
}

function toggleDevicePanel() {
  showDevicePanel.value = !showDevicePanel.value
}

function closeDevicePanel() {
  showDevicePanel.value = false
}

function toggleAIPanel() {
  showAIPanel.value = !showAIPanel.value
}

function closeAIPanel() {
  showAIPanel.value = false
}

function toggleLayerFlag(layerId) {
  store.setLayerVisibility(layerId, !store.layerVisibility[layerId])
}

function syncFullscreenState() {
  isBrowserFullscreen.value = document.fullscreenElement === pageRootRef.value
}

async function handleToggleFullscreen() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }
    await pageRootRef.value?.requestFullscreen?.()
  } catch (error) {
    console.error('Failed to toggle fullscreen:', error)
  } finally {
    syncFullscreenState()
  }
}

function handleScroll() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop || 0
  isBannerHidden.value = scrollTop > 12
}

onMounted(() => {
  ;(async () => {
    await store.initializeData()

    store.setMapMode(HOME_DEFAULT_MAP_MODE)
    previousHomeVesselVisibility = Boolean(store.layerVisibility.vessels)

    // 保存进入页面前的图层状态快照
    previousLayerSnapshot = { ...store.layerVisibility }

    // 风浪潮页面默认只显示风暴潮核定站 + 海岸观测站点
    const seaConditionLayers = {
      // 保持开启
      coastal_stations: false,
      coastal_base: false,
      tide_stations: false,
      surge_stations: true,
      erosion_monitor: true,
      // 关闭
      buoys: false,
      wave_buoy: false,
      anchor_buoy: false,
      disposable_buoy: false,
      argo_buoy: false,
      smart_marker: false,
      uav: false,
      usv: false,
      vessels: false,
    }
    Object.entries(seaConditionLayers).forEach(([key, val]) => {
      store.setLayerVisibility(key, val)
    })
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    document.addEventListener('fullscreenchange', syncFullscreenState)
    syncFullscreenState()
    nextTick(updateLegendAnchor)

    legendResizeObserver = new ResizeObserver(() => updateLegendAnchor())
    if (leftColumnRef.value) {
      legendResizeObserver.observe(leftColumnRef.value)
    }
    if (seawallBlockRef.value) {
      legendResizeObserver.observe(seawallBlockRef.value)
    }

    // Do not auto-select device on 风浪潮 page
  })()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  document.removeEventListener('fullscreenchange', syncFullscreenState)
  // 恢复图层状态
  if (previousLayerSnapshot) {
    Object.entries(previousLayerSnapshot).forEach(([key, val]) => {
      store.setLayerVisibility(key, val)
    })
  }
  legendResizeObserver?.disconnect()
  legendResizeObserver = null
})

watch([viewportWidth, viewportHeight], () => {
  nextTick(updateLegendAnchor)
})
</script>

<style scoped>
.home-page {
  position: relative;
  width: 100vw;
  min-height: 100vh;
  --home-chrome-top: 82px;
  --home-banner-side-gutter: 24px;
  --toolbar-gap: 10px;
  --toolbar-safe-left: calc(12px + var(--home-column-width) + var(--toolbar-gap));
  --tool-rail-safe-right: 12px;
  --map-safe-bottom: auto;
}

.home-map {
  position: fixed !important;
  inset: 0;
  z-index: 1;
}

.overlay-banner-fixed {
  position: fixed;
  top: var(--home-chrome-top);
  left: 50%;
  width: var(--home-banner-width);
  min-width: var(--home-banner-min-width);
  max-width: var(--home-banner-max-width);
  z-index: 1200;
  pointer-events: auto;
  transition: opacity 0.18s ease, transform 0.18s ease;
  transform: translateX(-50%);
}

.overlay-banner-fixed.hidden {
  opacity: 0;
  transform: translate(-50%, -12px);
  pointer-events: none;
}

.overlay-banner {
  pointer-events: auto;
}

.home-overlay {
  position: absolute;
  inset: 0 12px 10px;
  z-index: 760;
  pointer-events: none;
}

.home-overlay > * {
  pointer-events: auto;
  min-height: 0;
}

.two-column-layout {
  position: absolute;
  top: var(--home-chrome-top);
  left: 0;
  right: 0;
  bottom: 18px;
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  gap: 14px;
  pointer-events: none;
}

.column {
  width: var(--home-column-width);
  max-height: 100%;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.68);
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(18px) saturate(1.02);
  -webkit-backdrop-filter: blur(18px) saturate(1.02);
  box-shadow: var(--shadow-panel);
  display: flex;
  flex-direction: column;
  pointer-events: auto;
  overflow-y: auto;
  overflow-x: hidden;
}

.left-column {
  width: var(--home-column-width);
}

.column::-webkit-scrollbar {
  width: 4px;
}

.column::-webkit-scrollbar-track {
  background: transparent;
}

.column::-webkit-scrollbar-thumb {
  background: rgba(15, 23, 42, 0.12);
  border-radius: 2px;
}

.column::-webkit-scrollbar-thumb:hover {
  background: rgba(15, 23, 42, 0.22);
}

.column-block {
  margin: 8px 10px 10px;
  border-radius: 10px;
  border: 1px solid var(--border-subtle);
  background: rgba(255, 255, 255, 0.84);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.left-column .column-block {
  margin: 10px 12px 12px;
  border-radius: 12px;
}

.warning-block {
  flex: 0 0 auto;
}

.device-block {
  flex: 0 0 auto;
  min-height: 0;
  overflow: hidden;
  margin-bottom: 10px;
}

.ai-decision-block {
  flex: 0 0 auto;
  min-height: 0;
  overflow: visible;
}

.seawall-block {
  flex: 1 0 var(--home-seawall-panel-min-height);
  min-height: 0;
  min-block-size: var(--home-seawall-panel-min-height);
  overflow: hidden;
}

.ai-decision-body {
  display: flex;
  min-height: 0;
  padding: 0;
}

.ai-decision-body :deep(.ai-decision-panel) {
  flex: 1;
  min-height: 0;
}

.block-title {
  height: 34px;
  border-bottom: 1px solid var(--border-subtle);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.left-column .block-title {
  height: 44px;
  gap: 8px;
  padding: 0 14px;
  font-size: 18px;
}

.block-body {
  flex: 1 1 auto;
  min-height: 0;
  padding: 8px;
  overflow: hidden;
}

.left-column .block-body {
  padding: 12px;
}

.warning-body {
  padding: 0;
}

.warning-body :deep(.panel.alert-panel) {
  border: none;
  border-radius: 10px;
  background: transparent;
}

.warning-body :deep(.alerts-scroll-container) {
  max-height: var(--home-warning-body-max-height);
}

.device-body {
  display: flex;
  min-height: 0;
  overflow-y: auto;
  max-height: var(--home-device-body-max-height);
}

.device-body {
  padding-top: 0;
}

.device-body :deep(.device-explorer) {
  flex: 1;
  min-height: 0;
}

.seawall-body {
  display: flex;
  min-height: 0;
  overflow: hidden;
}

.seawall-body :deep(.seawall-risk-panel) {
  flex: 1;
  min-height: 0;
}

.seawall-body :deep(.risk-stats) {
  gap: 10px;
}

.seawall-body :deep(.stat) {
  gap: 4px;
  padding: 10px 8px;
}

.seawall-body :deep(.stat-value) {
  font-size: 24px;
}

.seawall-body :deep(.stat-label) {
  font-size: 15px;
}

.seawall-body :deep(.filter-bar) {
  gap: 10px;
}

.seawall-body :deep(.filter-select) {
  height: 34px;
  padding-left: 10px;
  padding-right: 24px;
  font-size: 14px;
}

.seawall-body :deep(.pill) {
  height: 34px;
  padding: 0 12px;
  font-size: 14px;
}

.seawall-body :deep(.breakpoint-list) {
  gap: 10px;
}

.seawall-body :deep(.bp-row) {
  padding: 14px;
  gap: 10px;
}

.seawall-body :deep(.bp-name) {
  font-size: 17px;
  line-height: 1.45;
}

.seawall-body :deep(.bp-city) {
  font-size: 14px;
}

.seawall-body :deep(.bp-city i) {
  font-size: 13px;
}

.seawall-body :deep(.bp-risk-tag) {
  padding: 4px 10px;
  font-size: 14px;
}

.seawall-body :deep(.bp-metrics) {
  gap: 10px;
}

.seawall-body :deep(.metric) {
  gap: 4px;
}

.seawall-body :deep(.metric-label) {
  font-size: 14px;
}

.seawall-body :deep(.metric-value) {
  font-size: 18px;
}

.seawall-body :deep(.empty-hint) {
  padding: 28px 0;
  font-size: 15px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  padding: 8px;
  flex-shrink: 0;
}

.stat-card {
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  background: rgba(255, 255, 255, 0.82);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-card .label {
  font-size: 12px;
  color: var(--text-tertiary);
}

.stat-card .value {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-card .value.online {
  color: #16a34a;
}

.stat-card .value.warn {
  color: #ef4444;
}

.stat-card .value.completeness {
  color: #2563eb;
}



.home-map :deep(.map-legend-wrapper) {
  z-index: 1150;
}

.warning-body :deep(.panel::before) {
  display: none;
}

.warning-body :deep(.panel-title) {
  font-family: var(--font-sans);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: none;
  color: var(--text-primary);
}

.warning-body :deep(.panel-header) {
  padding: 16px 16px 10px;
}

.warning-body :deep(.panel-content) {
  padding: 0 16px 16px 16px;
}

.warning-body :deep(.alert-card) {
  gap: 14px;
  padding: 14px;
  border-radius: 12px;
}

.warning-body :deep(.alert-icon) {
  width: 52px;
  height: 52px;
}

.warning-body :deep(.alert-title) {
  font-size: 18px;
  line-height: 1.4;
}

.warning-body :deep(.alert-time-row) {
  gap: 12px;
  margin-top: 8px;
}

.warning-body :deep(.alert-time) {
  font-size: 14px;
}

.warning-body :deep(.alert-valid) {
  font-size: 14px;
  color: var(--text-secondary);
}

.warning-body :deep(.alerts-more) {
  font-size: 13px;
  padding-top: 10px;
}

.warning-body :deep(.history-entry) {
  padding: 12px 14px;
  font-size: 14px;
}

.device-body :deep(.reset-btn) {
  color: var(--text-secondary);
}

.device-body :deep(.reset-btn:hover) {
  border-color: rgba(15, 23, 42, 0.12);
  background: rgba(15, 23, 42, 0.04);
  color: var(--text-primary);
}

.device-body :deep(.status-btn) {
  color: var(--text-secondary);
}

.device-body :deep(.status-btn.active) {
  border-color: rgba(15, 23, 42, 0.14);
  background: rgba(15, 23, 42, 0.06);
}

.device-body :deep(.device-list::-webkit-scrollbar-thumb) {
  background: rgba(15, 23, 42, 0.18);
}

.device-body :deep(.device-item.selected) {
  background: rgba(15, 23, 42, 0.06);
}



.home-page :deep(.tool-rail) {
  right: var(--tool-rail-safe-right);
  z-index: 1250;
}

.tool-rail-layer-shell {
  position: fixed;
  top: 150px;
  right: calc(var(--tool-rail-safe-right) + 68px);
  z-index: 1245;
  pointer-events: auto;
}

.tool-rail-layer-panel {
  width: 400px;
  max-height: min(78vh, 760px);
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.58);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(243, 246, 250, 0.62));
  backdrop-filter: blur(18px) saturate(1.08);
  -webkit-backdrop-filter: blur(18px) saturate(1.08);
  box-shadow: 0 22px 44px rgba(15, 23, 42, 0.16);
  display: flex;
  flex-direction: column;
  position: relative;
}

.tool-rail-layer-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 18%;
  right: 18%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(14, 165, 233, 0.92), transparent);
  opacity: 0.96;
}

.tool-rail-layer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
}

.tool-rail-layer-title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #0f172a;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.tool-rail-layer-title i {
  color: #0ea5e9;
}

.tool-rail-layer-close {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.7);
  color: #64748b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}

.tool-rail-layer-close:hover {
  border-color: rgba(239, 68, 68, 0.18);
  background: rgba(254, 242, 242, 0.92);
  color: #dc2626;
}

.tool-rail-layer-content {
  padding: 16px 18px 18px;
  overflow-y: auto;
}

.tool-rail-layer-content :deep(.layer-tree-scroll) {
  max-height: min(64vh, 640px);
  padding-right: 4px;
}

.tool-rail-layer-content :deep(.layer-group) {
  margin-bottom: 10px;
}

.tool-rail-layer-content :deep(.layer-group-header) {
  color: #334155;
  font-size: 16px;
  gap: 10px;
  padding: 8px 0;
}

.tool-rail-layer-content :deep(.layer-group-header i) {
  font-size: 12px;
}

.tool-rail-layer-content :deep(.layer-group-content) {
  padding-left: 18px;
}

.tool-rail-layer-content :deep(.layer-item) {
  color: #475569;
  font-size: 15px;
  gap: 10px;
  padding: 8px 0;
}

.tool-rail-layer-content :deep(.layer-item.parent) {
  color: #1e293b;
}

.tool-rail-layer-content :deep(.layer-item.child) {
  font-size: 14px;
}

.tool-rail-layer-content :deep(.layer-item input[type="checkbox"]) {
  width: 18px;
  height: 18px;
}

.tool-rail-layer-content :deep(.layer-item:hover) {
  color: #0f172a;
}

.tool-rail-layer-enter-active,
.tool-rail-layer-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.tool-rail-layer-enter-from,
.tool-rail-layer-leave-to {
  opacity: 0;
  transform: translateX(14px);
}

.tool-rail-typhoon-shell {
  position: fixed;
  top: 150px;
  right: calc(var(--tool-rail-safe-right) + 68px);
  z-index: 1240;
  pointer-events: auto;
}

.tool-rail-typhoon-panel {
  width: 420px;
  max-height: min(78vh, 760px);
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.58);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(243, 246, 250, 0.62));
  backdrop-filter: blur(18px) saturate(1.08);
  -webkit-backdrop-filter: blur(18px) saturate(1.08);
  box-shadow: 0 22px 44px rgba(15, 23, 42, 0.16);
  display: flex;
  flex-direction: column;
  position: relative;
}

.tool-rail-typhoon-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 18%;
  right: 18%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.72), transparent);
  opacity: 0.96;
}

.tool-rail-typhoon-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
}

.tool-rail-typhoon-title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #0f172a;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.tool-rail-typhoon-title i {
  color: #ef4444;
}

.tool-rail-typhoon-close {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.7);
  color: #64748b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}

.tool-rail-typhoon-close:hover {
  border-color: rgba(239, 68, 68, 0.18);
  background: rgba(254, 242, 242, 0.92);
  color: #dc2626;
}

.tool-rail-typhoon-content {
  padding: 16px 18px 18px;
  overflow-y: auto;
  max-height: min(68vh, 680px);
}

.tool-rail-typhoon-content :deep(.typhoon-info-panel.embedded) {
  position: relative;
  top: auto;
  right: auto;
  width: 100%;
  border: none;
  background: transparent;
  box-shadow: none;
  padding: 0;
}

.tool-rail-typhoon-content :deep(.embedded .typhoon-name) {
  font-size: 22px;
}

.tool-rail-typhoon-content :deep(.embedded .typhoon-id) {
  font-size: 16px;
}

.tool-rail-typhoon-content :deep(.embedded .typhoon-id-meta) {
  font-size: 14px;
}

.tool-rail-typhoon-content :deep(.embedded .info-item .label) {
  font-size: 14px;
}

.tool-rail-typhoon-content :deep(.embedded .info-item .value) {
  font-size: 18px;
}

.tool-rail-typhoon-content :deep(.embedded .info-item .big) {
  font-size: 24px;
}

.tool-rail-typhoon-content :deep(.embedded .summary-card-header) {
  font-size: 14px;
}

.tool-rail-typhoon-content :deep(.embedded .summary-row-label) {
  font-size: 14px;
}

.tool-rail-typhoon-content :deep(.embedded .summary-row-value) {
  font-size: 18px;
}

.tool-rail-typhoon-content :deep(.embedded .history-ref-summary) {
  padding: 14px 16px;
}

.tool-rail-typhoon-content :deep(.embedded .impact-item) {
  min-height: 72px;
}

.tool-rail-typhoon-content :deep(.embedded .brief-item) {
  font-size: 14px;
}

.tool-rail-typhoon-content :deep(.embedded .stat-row) {
  font-size: 14px;
}

/* ── Device Panel (tool-rail popup) ── */
.tool-rail-device-shell {
  position: fixed;
  top: 150px;
  right: calc(var(--tool-rail-safe-right) + 68px);
  z-index: 1243;
  pointer-events: auto;
}

.tool-rail-device-panel {
  width: 440px;
  max-height: min(78vh, 760px);
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.58);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(243, 246, 250, 0.62));
  backdrop-filter: blur(18px) saturate(1.08);
  -webkit-backdrop-filter: blur(18px) saturate(1.08);
  box-shadow: 0 22px 44px rgba(15, 23, 42, 0.16);
  display: flex;
  flex-direction: column;
  position: relative;
}

.tool-rail-device-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 18%;
  right: 18%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(22, 163, 74, 0.82), transparent);
  opacity: 0.96;
}

.tool-rail-device-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
}

.tool-rail-device-title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #0f172a;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.tool-rail-device-title i {
  color: #16a34a;
}

.tool-rail-device-close {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.7);
  color: #64748b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}

.tool-rail-device-close:hover {
  border-color: rgba(239, 68, 68, 0.18);
  background: rgba(254, 242, 242, 0.92);
  color: #dc2626;
}

.tool-rail-device-stats {
  padding: 14px 18px 0;
  overflow-y: auto;
  scrollbar-gutter: stable;
}

.tool-rail-device-stats .stats-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  padding: 0;
}

.tool-rail-device-stats .stat-card {
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  background: rgba(255, 255, 255, 0.82);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tool-rail-device-stats .stat-card .label {
  font-size: 14px;
  color: var(--text-tertiary);
  white-space: nowrap;
}

.tool-rail-device-stats .stat-card .value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.tool-rail-device-stats .stat-card .value.online { color: #16a34a; }
.tool-rail-device-stats .stat-card .value.warn { color: #ef4444; }
.tool-rail-device-stats .stat-card .value.completeness { color: #2563eb; }

.tool-rail-device-content {
  padding: 14px 18px 18px;
  overflow-y: auto;
  scrollbar-gutter: stable;
  max-height: min(58vh, 560px);
}

.tool-rail-device-content :deep(.device-explorer) {
  min-height: 0;
}

.tool-rail-device-content :deep(.reset-btn) {
  color: var(--text-secondary);
  font-size: 14px;
}

.tool-rail-device-content :deep(.reset-btn:hover) {
  border-color: rgba(15, 23, 42, 0.12);
  background: rgba(15, 23, 42, 0.04);
  color: var(--text-primary);
}

.tool-rail-device-content :deep(.status-btn) {
  color: var(--text-secondary);
  font-size: 14px;
  padding: 10px 0;
  border-radius: 10px;
}

.tool-rail-device-content :deep(.status-btn.active) {
  border-color: rgba(15, 23, 42, 0.14);
  background: rgba(15, 23, 42, 0.06);
}

.tool-rail-device-content :deep(.device-item) {
  padding: 14px 14px 14px 16px;
  border-radius: 12px;
}

.tool-rail-device-content :deep(.device-name) {
  font-size: 16px;
}

.tool-rail-device-content :deep(.device-type-chip) {
  padding: 4px 10px;
  font-size: 13px;
}

.tool-rail-device-content :deep(.metric-chip) {
  padding: 6px 10px;
}

.tool-rail-device-content :deep(.metric-label) {
  font-size: 12px;
}

.tool-rail-device-content :deep(.metric-value) {
  font-size: 14px;
}

.tool-rail-device-content :deep(.status-dot) {
  width: 10px;
  height: 10px;
}

.tool-rail-device-content :deep(.empty-state) {
  font-size: 14px;
}

.tool-rail-device-content :deep(.device-list::-webkit-scrollbar-thumb) {
  background: rgba(15, 23, 42, 0.18);
}

.tool-rail-device-content :deep(.device-item.selected) {
  background: rgba(15, 23, 42, 0.06);
}

/* ── AI Decision Panel (tool-rail popup) ── */
.tool-rail-ai-shell {
  position: fixed;
  top: 150px;
  right: calc(var(--tool-rail-safe-right) + 68px);
  z-index: 1242;
  pointer-events: auto;
}

.tool-rail-ai-panel {
  width: 500px;
  max-height: min(80vh, 780px);
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.58);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(243, 246, 250, 0.62));
  backdrop-filter: blur(18px) saturate(1.08);
  -webkit-backdrop-filter: blur(18px) saturate(1.08);
  box-shadow: 0 22px 44px rgba(15, 23, 42, 0.16);
  display: flex;
  flex-direction: column;
  position: relative;
}

.tool-rail-ai-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 18%;
  right: 18%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.82), transparent);
  opacity: 0.96;
}

.tool-rail-ai-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
}

.tool-rail-ai-title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #0f172a;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.tool-rail-ai-title i {
  color: #8b5cf6;
}

.tool-rail-ai-close {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.7);
  color: #64748b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}

.tool-rail-ai-close:hover {
  border-color: rgba(239, 68, 68, 0.18);
  background: rgba(254, 242, 242, 0.92);
  color: #dc2626;
}

.tool-rail-ai-content {
  padding: 0;
  overflow-y: auto;
  max-height: min(72vh, 700px);
}

.tool-rail-ai-content :deep(.ai-decision-panel) {
  height: auto;
  min-height: 0;
}

.tool-rail-ai-content :deep(.ai-hero-row) {
  padding: 18px 18px 14px;
}

.tool-rail-ai-content :deep(.ai-hero-title) {
  font-size: 22px;
  line-height: 1.35;
}

.tool-rail-ai-content :deep(.summary-messages) {
  gap: 14px;
}

.tool-rail-ai-content :deep(.summary-bubble) {
  padding: 14px 16px;
  border-radius: 12px;
}

.tool-rail-ai-content :deep(.bubble-icon) {
  width: 28px;
  height: 28px;
  font-size: 18px;
}

.tool-rail-ai-content :deep(.bubble-content) {
  font-size: 17px;
}

.tool-rail-ai-content :deep(.bubble-tag) {
  font-size: 15px;
}

.tool-rail-ai-content :deep(.ai-disclaimer) {
  font-size: 13px;
}

.tool-rail-ai-content :deep(.chat-input) {
  height: 46px;
  font-size: 15px;
}

.tool-rail-ai-content :deep(.chat-send-btn) {
  width: 34px;
  height: 34px;
  font-size: 15px;
}

@media (max-width: 1680px) {
  .home-page {
    --toolbar-safe-left: calc(12px + var(--home-column-width) + var(--toolbar-gap));
  }
}

@media (max-width: 1440px) {
  .home-page {
    --toolbar-safe-left: calc(12px + var(--home-column-width) + var(--toolbar-gap));
  }

  .tool-rail-layer-panel {
    width: 360px;
  }
}
</style>
