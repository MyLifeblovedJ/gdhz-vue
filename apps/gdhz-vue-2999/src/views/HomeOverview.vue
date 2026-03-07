<template>
  <div class="home-page" :style="homeChromeStyle">
    <MapContainer
      ref="mapRef"
      class="home-map"
      :current-basemap="currentBasemap"
      :map-mode="store.mapMode"
      :fullscreen="true"
      @device-click="handleDeviceClick"
    />

    <div class="overlay-banner-fixed" :class="{ hidden: isBannerHidden }">
      <AlertBanner class="overlay-banner" />
    </div>

    <MapLegend />
    <CoastalCameraOverlay :visible="showCameraOverlay" :stations="coastalStations" />

    <MapToolRail
      :map-mode="store.mapMode"
      :camera-active="showCameraOverlay"
      :layer-panel-open="showLayerPanel"
      @zoom-in="handleZoomIn"
      @zoom-out="handleZoomOut"
      @reset-view="handleResetView"
      @locate="handleLocate"
      @toggle-map-mode="handleToggleMapMode"
      @basemap-change="handleBasemapChange"
      @toggle-camera="toggleCameraOverlay"
      @toggle-layer-panel="toggleLayerPanel"
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

    <div class="home-overlay">
      <div class="two-column-layout">
        <section class="column left-column">
          <div class="column-block warning-block">
            <div class="block-body warning-body">
              <SituationAlerts :alerts="store.alerts" />
            </div>
          </div>

          <div ref="deviceBlockRef" class="column-block device-block">
            <div class="block-title"><i class="fa-solid fa-satellite-dish"></i> 设备与数据</div>
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
            <div class="block-body device-body">
              <DeviceExplorer @device-click="handleDeviceClick" />
            </div>
          </div>
        </section>

        <section class="column right-column">
          <div class="column-block typhoon-block">
            <div class="block-title"><i class="fa-solid fa-wind"></i> 台风专题</div>
            <div class="block-body typhoon-body">
              <TyphoonInfo embedded />
            </div>
          </div>

          <div class="column-block ai-decision-block">
            <div class="block-title"><i class="fa-solid fa-wand-magic-sparkles"></i> 智能决策</div>
            <div class="block-body ai-decision-body">
              <AIDecisionPanel />
            </div>
          </div>

          <div class="column-block coast-block">
            <div class="block-title"><i class="fa-solid fa-video"></i> 海岸观测（12站点）</div>
            <div class="block-body coast-body">
              <CoastalObservationPanel :stations="coastalStations" />
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- Station Detail Popup (复刻态势感知) -->
    <DetailPopup
      v-if="selectedDevice"
      :device="selectedDevice"
      @close="selectedDevice = null"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { useAppStore } from '../stores/app'
import { HOME_DEFAULT_MAP_MODE } from '../utils/homeMapMode'
import { getHomeBannerBounds } from '../utils/homeChromeLayout'
import SituationAlerts from '../components/common/SituationAlerts.vue'
import AlertBanner from '../components/layout/AlertBanner.vue'
import CoastalCameraOverlay from '../components/layout/CoastalCameraOverlay.vue'
import CoastalObservationPanel from '../components/layout/CoastalObservationPanel.vue'
import AIDecisionPanel from '../components/decision/AIDecisionPanel.vue'
import MapToolRail from '../components/layout/MapToolRail.vue'
import LayerControl from '../components/map/LayerControl.vue'
import DeviceExplorer from '../components/device/DeviceExplorer.vue'
import MapContainer from '../components/map/MapContainer.vue'
import MapLegend from '../components/map/MapLegend.vue'
import TyphoonInfo from '../components/map/TyphoonInfo.vue'
import DetailPopup from '../components/common/DetailPopup.vue'

const store = useAppStore()
const mapRef = ref(null)
const deviceBlockRef = ref(null)
const currentBasemap = ref('satellite')
const showCameraOverlay = ref(false)
const showLayerPanel = ref(false)
const isBannerHidden = ref(false)
const legendTop = ref(82)
const selectedDevice = ref(null)
let previousHomeVesselVisibility = true
let legendResizeObserver = null

const { width: viewportWidth } = useWindowSize()

const coastalStations = [
  { id: 'C01', stationName: '湛江东海站', status: 'online', mapX: 29.8, mapY: 74.5 },
  { id: 'C02', stationName: '茂名水东站', status: 'online', mapX: 32.8, mapY: 71.8 },
  { id: 'C03', stationName: '阳江闸坡站', status: 'online', mapX: 34.8, mapY: 69.2 },
  { id: 'C04', stationName: '江门台山站', status: 'online', mapX: 36.9, mapY: 66.2 },
  { id: 'C05', stationName: '珠海香洲站', status: 'online', mapX: 39.1, mapY: 63.7 },
  { id: 'C06', stationName: '中山横门站', status: 'online', mapX: 40.4, mapY: 62.2 },
  { id: 'C07', stationName: '深圳蛇口站', status: 'online', mapX: 43.1, mapY: 59.6 },
  { id: 'C08', stationName: '惠州双月湾站', status: 'online', mapX: 46.7, mapY: 55.4 },
  { id: 'C09', stationName: '汕尾红海湾站', status: 'online', mapX: 49.8, mapY: 51.3 },
  { id: 'C10', stationName: '揭阳惠来站', status: 'online', mapX: 52.5, mapY: 46.7 },
  { id: 'C11', stationName: '潮州柘林站', status: 'online', mapX: 54.2, mapY: 42.5 },
  { id: 'C12', stationName: '汕头南澳站', status: 'offline', mapX: 56.0, mapY: 39.8 },
]

const dataCompletenessRate = computed(() => {
  const total = store.devices.length
  if (!total) return '0%'
  return `${Math.round((store.onlineDevices.length / total) * 100)}%`
})

function resolveHomeColumnWidth(width) {
  const safeWidth = Number(width) || 0
  if (safeWidth <= 1440) return Math.min(360, Math.max(300, safeWidth * 0.28))
  if (safeWidth <= 1680) return Math.min(420, Math.max(320, safeWidth * 0.26))
  return Math.min(500, Math.max(360, safeWidth * 0.28))
}

const currentColumnWidth = computed(() => Math.round(resolveHomeColumnWidth(viewportWidth.value)))
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
  '--map-safe-left': `${currentColumnWidth.value + 26}px`,
  '--map-safe-top': `${legendTop.value}px`,
}))

function updateLegendTop() {
  if (!deviceBlockRef.value) return
  legendTop.value = Math.round(deviceBlockRef.value.getBoundingClientRect().top)
}

function handleDeviceClick(device) {
  selectedDevice.value = device
  mapRef.value?.flyToDevice(device.id)
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
  alert('定位功能需要 GPS 接入')
}

function handleBasemapChange(basemapId) {
  currentBasemap.value = basemapId
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

function handleScroll() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop || 0
  isBannerHidden.value = scrollTop > 12
}

onMounted(() => {
  ;(async () => {
    await store.initializeData()

    store.setMapMode(HOME_DEFAULT_MAP_MODE)
    previousHomeVesselVisibility = Boolean(store.layerVisibility.vessels)
    store.setLayerVisibility('vessels', false)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    nextTick(updateLegendTop)

    legendResizeObserver = new ResizeObserver(() => updateLegendTop())
    if (deviceBlockRef.value) {
      legendResizeObserver.observe(deviceBlockRef.value)
    }

    // Auto-select first device
    if (store.devices.length > 0) {
      selectedDevice.value = store.devices[0]
    }
  })()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  store.setLayerVisibility('vessels', previousHomeVesselVisibility)
  legendResizeObserver?.disconnect()
  legendResizeObserver = null
})

watch(viewportWidth, () => {
  nextTick(updateLegendTop)
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
  --tool-rail-safe-right: calc(12px + var(--home-column-width) + var(--toolbar-gap));
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

.warning-block {
  flex: 0 0 auto;
}

.device-block {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  margin-bottom: 10px;
}

.typhoon-block,
.ai-decision-block,
.coast-block {
  flex: 0 0 auto;
  min-height: 0;
  overflow: hidden;
}

.coast-block {
  margin-bottom: 10px;
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

.block-body {
  flex: 1 1 auto;
  min-height: 0;
  padding: 8px;
  overflow: hidden;
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
  max-height: 324px;
}

.device-body,
.typhoon-body {
  display: flex;
  min-height: 0;
  overflow-y: auto;
}

.device-body {
  padding-top: 0;
}

.device-body :deep(.device-explorer),
.typhoon-body :deep(.typhoon-info-panel.embedded) {
  flex: 1;
  min-height: 0;
}

.typhoon-body {
  max-height: 380px;
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

.typhoon-body :deep(.typhoon-info-panel.embedded) {
  border: none;
  background: transparent;
  box-shadow: none;
  padding: 0;
}

.coast-body {
  display: flex;
  overflow: hidden;
}

.coast-body :deep(.coastal-panel) {
  flex: 1;
  min-height: 0;
  --coastal-card-height: 108px;
}

.home-map :deep(.map-legend-wrapper) {
  z-index: 1150;
}

.warning-body :deep(.panel::before) {
  display: none;
}

.warning-body :deep(.panel-title) {
  font-family: var(--font-sans);
  letter-spacing: 0;
  text-transform: none;
  color: var(--text-primary);
}

.warning-body :deep(.alert-valid) {
  color: var(--text-secondary);
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

.typhoon-body :deep(.history-ref-header .header-left i) {
  color: var(--text-secondary);
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
  width: 320px;
  max-height: min(72vh, 680px);
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
  padding: 14px 16px 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
}

.tool-rail-layer-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #0f172a;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.tool-rail-layer-title i {
  color: #0ea5e9;
}

.tool-rail-layer-close {
  width: 28px;
  height: 28px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 9px;
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
  padding: 10px 14px 14px;
  overflow-y: auto;
}

.tool-rail-layer-content :deep(.layer-tree-scroll) {
  max-height: min(58vh, 560px);
  padding-right: 2px;
}

.tool-rail-layer-content :deep(.layer-group-header) {
  color: #334155;
}

.tool-rail-layer-content :deep(.layer-item) {
  color: #475569;
}

.tool-rail-layer-content :deep(.layer-item.parent) {
  color: #1e293b;
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

@media (max-width: 1680px) {
  .home-page {
    --toolbar-safe-left: calc(12px + var(--home-column-width) + var(--toolbar-gap));
    --tool-rail-safe-right: calc(12px + var(--home-column-width) + var(--toolbar-gap));
  }
}

@media (max-width: 1440px) {
  .home-page {
    --toolbar-safe-left: calc(12px + var(--home-column-width) + var(--toolbar-gap));
    --tool-rail-safe-right: calc(12px + var(--home-column-width) + var(--toolbar-gap));
  }

  .tool-rail-layer-panel {
    width: 300px;
  }
}
</style>
