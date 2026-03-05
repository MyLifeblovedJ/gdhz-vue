<template>
  <div class="home-page">
    <!-- 地图背景：fixed 全屏 -->
    <MapContainer
      ref="mapRef"
      class="home-map"
      :current-basemap="currentBasemap"
      :map-mode="store.mapMode"
      :fullscreen="true"
      @device-click="handleDeviceClick"
    />

    <!-- 独立悬浮交互层：避免被文档流侧栏遮挡 -->
    <div class="overlay-banner-fixed" :class="{ hidden: isBannerHidden }">
      <AlertBanner class="overlay-banner" />
    </div>

    <FloatingToolbar
      @device-click="handleDeviceClick"
      @layer-toggle="handleLayerToggle"
      @model-click="handleModelClick"
    />

    <MapLegend />
    <CoastalCameraOverlay :visible="showCameraOverlay" :stations="coastalStations" />

    <MapToolRail
      :map-mode="store.mapMode"
      :camera-active="showCameraOverlay"
      @zoom-in="handleZoomIn"
      @zoom-out="handleZoomOut"
      @reset-view="handleResetView"
      @locate="handleLocate"
      @toggle-map-mode="handleToggleMapMode"
      @basemap-change="handleBasemapChange"
      @toggle-camera="toggleCameraOverlay"
    />

    <!-- 文档流覆层：可整页滚动 -->
    <div class="home-overlay" ref="overlayRef">
      <!-- AI 液态玻璃搜索栏 -->

      <div class="two-column-layout">
        <section class="column left-column">
          <div class="column-block warning-block">
            <div class="block-body warning-body">
              <SituationAlerts :alerts="store.alerts" />
            </div>
          </div>

          <div class="column-block device-block">
            <div class="block-title"><i class="fa-solid fa-satellite-dish"></i> 设备与数据</div>
            <div class="stats-row">
              <div class="stat-card"><span class="label">总设备</span><span class="value">{{ store.devices.length }}</span></div>
              <div class="stat-card"><span class="label">在线</span><span class="value online">{{ store.onlineDevices.length }}</span></div>
              <div class="stat-card"><span class="label">告警</span><span class="value warn">{{ store.alertDevices.length }}</span></div>
            </div>
            <div class="block-body device-body">
              <DeviceExplorer @device-click="handleDeviceClick" />
            </div>
          </div>
        </section>

        <section class="column right-column">
          <div class="column-block typhoon-block">
            <div class="block-title"><i class="fa-solid fa-wind"></i> 台风专题</div>
            <div class="block-body">
              <TyphoonInfo embedded />
            </div>
          </div>

          <div class="column-block coast-block">
            <div class="block-title"><i class="fa-solid fa-video"></i> 海岸观测（12站点）</div>
            <div class="block-body">
              <CoastalObservationPanel :stations="coastalStations" />
            </div>
          </div>
        </section>
      </div>

      <DataDock />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useAppStore } from '../stores/app'
import MapContainer from '../components/map/MapContainer.vue'
import MapLegend from '../components/map/MapLegend.vue'
import TyphoonInfo from '../components/map/TyphoonInfo.vue'
import FloatingToolbar from '../components/map/FloatingToolbar.vue'
import DeviceExplorer from '../components/device/DeviceExplorer.vue'
import AlertBanner from '../components/layout/AlertBanner.vue'
import CoastalObservationPanel from '../components/layout/CoastalObservationPanel.vue'
import CoastalCameraOverlay from '../components/layout/CoastalCameraOverlay.vue'
import MapToolRail from '../components/layout/MapToolRail.vue'
import DataDock from '../components/layout/DataDock.vue'
import SituationAlerts from '../components/common/SituationAlerts.vue'

const store = useAppStore()
const mapRef = ref(null)
const currentBasemap = ref('satellite')
const showCameraOverlay = ref(false)
const isBannerHidden = ref(false)

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

function handleDeviceClick(device) {
  mapRef.value?.flyToDevice(device.id)
}

function handleLayerToggle({ layerId, checked }) {
  store.setLayerVisibility(layerId, checked)
}

function handleModelClick(model) {
  console.log('Model clicked:', model)
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
  alert('定位功能需要GPS接入')
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

function handleScroll() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop || 0
  isBannerHidden.value = scrollTop > 12
}

function handleWheelBridge(e) {
  const target = e.target
  const isOverPanel = target.closest(
    '.column, .data-dock, .overlay-banner-fixed, .floating-toolbar, .tool-rail, .map-legend-wrapper'
  )
  if (isOverPanel) return

  // 地图裸露区域：仅阻止整页滚动，缩放完全交给 MapContainer 内部原生链路
  e.preventDefault()
}

onMounted(() => {
  store.initializeData()
  store.setMapMode('3D')
  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('wheel', handleWheelBridge, { passive: false })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('wheel', handleWheelBridge)
})
</script>

<style scoped>
.home-page {
  position: relative;
  width: 100vw;
  min-height: 100vh;
  --home-column-width: clamp(360px, 28vw, 500px);
  --toolbar-gap: 10px;
  --toolbar-safe-left: calc(12px + var(--home-column-width) + var(--toolbar-gap));
  --tool-rail-safe-right: calc(12px + var(--home-column-width) + var(--toolbar-gap));
}

/* 地图固定底座 */
.home-map {
  position: fixed !important;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1;
}

.overlay-banner-fixed {
  position: fixed;
  top: 72px;
  left: 12px;
  right: 12px;
  z-index: 1200;
  pointer-events: auto;
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.overlay-banner-fixed.hidden {
  opacity: 0;
  transform: translateY(-12px);
  pointer-events: none;
}

.overlay-banner {
  pointer-events: auto;
}

/* 文档流覆层 */
.home-overlay {
  position: relative;
  z-index: 760;
  pointer-events: none;
  min-height: 100vh;
  padding-top: 82px;
  padding-left: 12px;
  padding-right: 12px;
  padding-bottom: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.home-overlay > * {
  pointer-events: auto;
}

.two-column-layout {
  position: relative;
  display: flex;
  justify-content: space-between;
  gap: 14px;
  flex: 0 0 auto;
  pointer-events: none; /* 让中间间隙的事件穿透到底图 */
}

.column {
  width: var(--home-column-width);
  border-radius: 14px;
  border: 1px solid rgba(110, 153, 188, 0.35);
  background: linear-gradient(180deg, rgba(1, 9, 22, 0.88), rgba(4, 17, 36, 0.85));
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.28);
  display: flex;
  flex-direction: column;
  pointer-events: auto; /* 侧边栏保持可交互 */
}

.column-block {
  margin: 10px;
  border-radius: 10px;
  border: 1px solid rgba(114, 157, 194, 0.24);
  background: rgba(255, 255, 255, 0.03);
  display: flex;
  flex-direction: column;
}

/* 所有 block 自然高度展开 */
.warning-block { flex: 0 0 auto; }
.device-block { flex: 0 0 auto; margin-bottom: 10px; }
.typhoon-block { flex: 0 0 auto; }
.coast-block { flex: 0 0 auto; margin-bottom: 10px; }

.block-title {
  height: 34px;
  border-bottom: 1px solid rgba(114, 157, 194, 0.22);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  color: #c7e6ff;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.block-body {
  flex: 0 0 auto;
  padding: 8px;
  overflow: visible;
}

.warning-body {
  padding: 0;
}

.warning-body :deep(.panel.alert-panel) {
  border: none;
  border-radius: 10px;
  background: transparent;
}

.device-body { padding-top: 0; }

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding: 8px;
}

.stat-card {
  border-radius: 8px;
  border: 1px solid rgba(118, 162, 197, 0.28);
  background: rgba(255, 255, 255, 0.03);
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.stat-card .label { font-size: 11px; color: rgba(183, 209, 231, 0.7); }
.stat-card .value { font-size: 17px; font-weight: 700; color: #e7f4ff; }
.stat-card .value.online { color: #53b07e; }
.stat-card .value.warn { color: #ef4444; }

.typhoon-block .block-body :deep(.typhoon-info-panel.embedded) {
  border: none;
  background: transparent;
  box-shadow: none;
  padding: 0;
}

.home-map :deep(.map-legend-wrapper) {
  left: calc(18px + var(--home-column-width));
  bottom: 20px;
  z-index: 1150;
}

.home-page :deep(.floating-toolbar) {
  z-index: 1250;
}

.home-page :deep(.tool-rail) {
  right: var(--tool-rail-safe-right);
  z-index: 1250;
}
</style>
