<template>
  <div ref="pageRootRef" class="home-page" :style="homeChromeStyle">
    <!-- 左侧固定侧边栏 -->
    <aside
      ref="sidebarRef"
      class="geology-sidebar"
      :style="{ width: sidebarWidth + 'px' }"
    >
      <div class="sidebar-accordion">
        <!-- 1. 图层 -->
        <div class="sidebar-section" :class="{ 'is-expanded': activeSidebarMenu === 'layers' }">
          <div class="sidebar-section-title" @click="toggleSidebarMenu('layers')">
            <div class="title-left">
              <i class="fa-solid fa-layer-group"></i>
              <span>图层</span>
            </div>
          </div>
          <div class="sidebar-section-body" v-show="activeSidebarMenu === 'layers'">
            <div class="map-legend-wrapper embedded">
              <div class="legend-container">
                <div class="legend-scroll">
                  <div class="legend-panel" :class="{ collapsed: geologyCollapsed }">
                    <div class="legend-header" @click="geologyCollapsed = !geologyCollapsed">
                      <span class="legend-name">地质采样</span>
                      <i :class="geologyCollapsed ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-up'"></i>
                    </div>
                    <div class="legend-content geology-layer-options" v-show="!geologyCollapsed">
                      <label class="geology-layer-option" :class="{ active: geologyRawVisible }">
                        <input type="checkbox" v-model="geologyRawVisible">
                        <span class="geology-layer-option-label">原始数据</span>
                      </label>
                      <label class="geology-layer-option" :class="{ active: geologyProcessedVisible }">
                        <input type="checkbox" v-model="geologyProcessedVisible">
                        <span class="geology-layer-option-label">处理后数据</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. 图例 -->
        <div class="sidebar-section" :class="{ 'is-expanded': activeSidebarMenu === 'legends' }">
          <div class="sidebar-section-title" @click="toggleSidebarMenu('legends')">
            <div class="title-left">
              <i class="fa-solid fa-palette"></i>
              <span>图例</span>
            </div>
          </div>
          <div class="sidebar-section-body map-legend-body" v-show="activeSidebarMenu === 'legends'">
            <MapLegend :embedded="true" />
          </div>
        </div>

        <!-- 3. 更多信息 -->
        <div class="sidebar-section" :class="{ 'is-expanded': activeSidebarMenu === 'more_info' }">
          <div class="sidebar-section-title" @click="toggleSidebarMenu('more_info')">
            <div class="title-left">
              <i class="fa-solid fa-circle-info"></i>
              <span>更多信息</span>
            </div>
          </div>
          <div class="sidebar-section-body" v-show="activeSidebarMenu === 'more_info'">
            <div class="empty-content">暂无更多信息内容</div>
          </div>
        </div>

        <!-- 4. 帮助 -->
        <div class="sidebar-section" :class="{ 'is-expanded': activeSidebarMenu === 'help' }">
          <div class="sidebar-section-title" @click="toggleSidebarMenu('help')">
            <div class="title-left">
              <i class="fa-solid fa-circle-question"></i>
              <span>帮助</span>
            </div>
          </div>
          <div class="sidebar-section-body" v-show="activeSidebarMenu === 'help'">
            <div class="empty-content">暂无相关帮助文档</div>
          </div>
        </div>
      </div>

      <!-- 拖拽调整宽度手柄 -->
      <div
        class="sidebar-resize-handle"
        @mousedown="startSidebarResize"
      >
        <div class="resize-handle-line"></div>
      </div>
    </aside>

    <!-- 右侧主内容区（地图 + 所有叠加物） -->
    <div class="geology-main" :style="{ marginLeft: sidebarWidth + 'px' }">
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

      <CoastalCameraOverlay :visible="showCameraOverlay" :stations="erosionVideoData" :map-ref="mapRef" />

      <div class="map-search-glass-anchor">
        <MapSearchGlass placeholder="搜索监测点、站点或海域" />
      </div>

      <!-- 全局视图（鹰眼图） -->
      <div class="minimap-anchor" :style="{ left: sidebarWidth + 'px' }">
        <div ref="mouseReadoutRef" class="map-mouse-readout" aria-live="polite">
          <span class="map-mouse-readout-value">{{ mouseReadoutDisplay.lng }}</span>
          <span class="map-mouse-readout-separator">/</span>
          <span class="map-mouse-readout-value">{{ mouseReadoutDisplay.lat }}</span>
          <span class="map-mouse-readout-separator">/</span>
          <span class="map-mouse-readout-value">{{ mouseReadoutDisplay.elevation }}</span>
        </div>
        <MiniMap
          :view-bounds="viewBounds"
          :basemap="currentBasemap"
          :center="[22.0, 112.5]"
          :zoom="7.5"
          @navigate="handleMinimapNavigate"
        />
      </div>

      <MapToolRail
        :layer-panel-open="showRightLayerPanel"
        :device-panel-open="showDevicePanel"
        :show-device-btn="true"
        :ai-panel-open="showAIPanel"
        :show-a-i-btn="true"
        @toggle-layer-panel="toggleRightLayerPanel"
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

      <!-- 图层控制面板（右侧弹出） -->
      <Transition name="tool-rail-panel">
        <aside v-if="showRightLayerPanel" class="tool-rail-layer-shell">
          <div class="tool-rail-layer-panel">
            <div class="tool-rail-layer-header">
              <div class="tool-rail-layer-title">
                <i class="fa-solid fa-layer-group"></i>
                图层控制
              </div>
              <button class="tool-rail-layer-close" type="button" @click="closeRightLayerPanel">
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
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { useAppStore } from '../stores/app'
import { HOME_DEFAULT_MAP_MODE } from '../utils/homeMapMode'
import { attachLiquidGlass } from '../utils/liquidGlass'
import CoastalCameraOverlay from '../components/layout/CoastalCameraOverlay.vue'
import { mockErosionVideoStreams } from '../data/mockData'
import AIDecisionPanel from '../components/decision/AIDecisionPanel.vue'
import MapActionDock from '../components/layout/MapActionDock.vue'
import MapToolRail from '../components/layout/MapToolRail.vue'
import LayerControl from '../components/map/LayerControl.vue'
import DeviceExplorer from '../components/device/DeviceExplorer.vue'
import MapContainer from '../components/map/MapContainer.vue'
import MapLegend from '../components/map/MapLegend.vue'
import TyphoonInfo from '../components/map/TyphoonInfo.vue'
import DetailPopup from '../components/common/DetailPopup.vue'
import StationGlassPopup from '../components/map/StationGlassPopup.vue'
import MiniMap from '../components/map/MiniMap.vue'
import MapSearchGlass from '../components/map/MapSearchGlass.vue'

const store = useAppStore()
const pageRootRef = ref(null)
const sidebarRef = ref(null)
const mapRef = ref(null)
const mouseReadoutRef = ref(null)
const currentBasemap = ref('satellite')
const showCameraOverlay = ref(false)
const showTyphoonPanel = ref(false)
const showDevicePanel = ref(false)
const showAIPanel = ref(true)
const showRightLayerPanel = ref(false)
const isBrowserFullscreen = ref(false)
const selectedDevice = ref(null)
const activeSidebarMenu = ref('layers')
const geologyCollapsed = ref(false)
const mouseReadout = ref(null)
const viewBounds = ref(null)
let viewBoundsRaf = null
let previousLayerSnapshot = null
let mouseReadoutGlassInstance = null
let mouseReadoutResizeObserver = null
let mouseReadoutSyncRaf = null
const basemaps = ['satellite', 'dark', 'street']

const geologyRawVisible = computed({
  get: () => store.geology.layers.rawVisible,
  set: (value) => store.setGeologyLayerVisibility('raw', value),
})

const geologyProcessedVisible = computed({
  get: () => store.geology.layers.processedVisible,
  set: (value) => store.setGeologyLayerVisibility('processed', value),
})

// ─── 侧边栏手风琴点击逻辑 ───
const sidebarMenuOrder = ['layers', 'legends', 'more_info', 'help']

function toggleSidebarMenu(menuName) {
  if (activeSidebarMenu.value === menuName) {
    // 已经展开的状态下再次点击，收起当前，自动展开下一个
    const currentIndex = sidebarMenuOrder.indexOf(menuName)
    const nextIndex = (currentIndex + 1) % sidebarMenuOrder.length
    activeSidebarMenu.value = sidebarMenuOrder[nextIndex]
  } else {
    // 否则正常展开被点击的项
    activeSidebarMenu.value = menuName
  }
}

// ─── 侧边栏宽度拖拽调整 ───
const SIDEBAR_MIN_WIDTH = 180
const SIDEBAR_MAX_WIDTH = 600
const SIDEBAR_DEFAULT_WIDTH = 390
const sidebarWidth = ref(SIDEBAR_DEFAULT_WIDTH)
let isResizing = false

function startSidebarResize(e) {
  e.preventDefault()
  isResizing = true
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onSidebarResize)
  document.addEventListener('mouseup', stopSidebarResize)
}

function onSidebarResize(e) {
  if (!isResizing) return
  const newWidth = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, e.clientX))
  sidebarWidth.value = newWidth
}

function stopSidebarResize() {
  isResizing = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  document.removeEventListener('mousemove', onSidebarResize)
  document.removeEventListener('mouseup', stopSidebarResize)
  // 触发地图 resize
  mapRef.value?.invalidateSize?.()
}

// ─── 底部菜单处理 ───
// 已经移入Accordion点击逻辑，这部分可删掉部分处理函数或保留记录
function handleMoreInfo() { console.log('更多信息') }
function handleHelp() { console.log('帮助') }

const { width: viewportWidth, height: viewportHeight } = useWindowSize()

// 海岸观测视频数据
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

const homeChromeStyle = computed(() => ({
  '--sidebar-width': `${sidebarWidth.value}px`,
}))

function formatDirectionalCoordinate(value, positiveSuffix, negativeSuffix) {
  if (!Number.isFinite(value)) return '--'
  const suffix = value >= 0 ? positiveSuffix : negativeSuffix
  return `${Math.abs(value).toFixed(2)}${suffix}`
}

function formatReadoutElevation(value) {
  if (!Number.isFinite(value)) return '--'
  return `${Math.round(value)}m`
}

const mouseReadoutDisplay = computed(() => ({
  lng: formatDirectionalCoordinate(mouseReadout.value?.lng, 'E', 'W'),
  lat: formatDirectionalCoordinate(mouseReadout.value?.lat, 'N', 'S'),
  elevation: formatReadoutElevation(mouseReadout.value?.elevation),
}))

function handleMouseCoordinateChange(payload) {
  mouseReadout.value = payload
}

function syncMouseReadoutGlass() {
  if (!mouseReadoutRef.value) return
  if (mouseReadoutGlassInstance) {
    mouseReadoutGlassInstance.destroy()
    mouseReadoutGlassInstance = null
  }
  mouseReadoutGlassInstance = attachLiquidGlass(mouseReadoutRef.value, {
    idPrefix: 'map-mouse-readout',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    boxShadow: '0 8px 18px rgba(2, 8, 23, 0.18), 0 -10px 25px inset rgba(0, 0, 0, 0.05)',
  })
}

function scheduleMouseReadoutGlassSync() {
  if (mouseReadoutSyncRaf) cancelAnimationFrame(mouseReadoutSyncRaf)
  mouseReadoutSyncRaf = requestAnimationFrame(() => {
    mouseReadoutSyncRaf = null
    syncMouseReadoutGlass()
  })
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
  if (zoomWatcher) { mapRef.value?.offZoomChange(zoomWatcher); zoomWatcher = null }
  stopGlassTracking()
  await mapRef.value?.flyToDevice(device.id)
  updateGlassPosition(device)
  glassVisible.value = true
  glassOpenZoom = mapRef.value?.getZoom() ?? null

  zoomWatcher = (zoom) => {
    if (glassOpenZoom !== null && zoom < glassOpenZoom - 1.0) {
      closeGlass()
    }
  }
  mapRef.value?.onZoomChange(zoomWatcher)
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

function handleZoomIn() { mapRef.value?.zoomIn() }
function handleZoomOut() { mapRef.value?.zoomOut() }
function handleResetView() { mapRef.value?.resetView() }

function handleBasemapChange(basemapId) {
  currentBasemap.value = basemapId
}

function handleToggleBasemap() {
  const currentIndex = basemaps.indexOf(currentBasemap.value)
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % basemaps.length : 0
  handleBasemapChange(basemaps[nextIndex])
}

function handleToggleMapMode() { store.toggleMapMode() }
function toggleCameraOverlay() { showCameraOverlay.value = !showCameraOverlay.value }
function toggleRightLayerPanel() { showRightLayerPanel.value = !showRightLayerPanel.value }
function closeRightLayerPanel() { showRightLayerPanel.value = false }
function toggleTyphoonPanel() { showTyphoonPanel.value = !showTyphoonPanel.value }
function closeTyphoonPanel() { showTyphoonPanel.value = false }
function toggleDevicePanel() { showDevicePanel.value = !showDevicePanel.value }
function closeDevicePanel() { showDevicePanel.value = false }
function toggleAIPanel() { showAIPanel.value = !showAIPanel.value }
function closeAIPanel() { showAIPanel.value = false }
function toggleLayerFlag(layerId) { store.setLayerVisibility(layerId, !store.layerVisibility[layerId]) }

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

onMounted(() => {
  ;(async () => {
    mapRef.value?.onMouseCoordinateChange?.(handleMouseCoordinateChange)
    await nextTick()
    scheduleMouseReadoutGlassSync()
    mouseReadoutResizeObserver = new ResizeObserver(() => {
      scheduleMouseReadoutGlassSync()
    })
    if (mouseReadoutRef.value) {
      mouseReadoutResizeObserver.observe(mouseReadoutRef.value)
    }
    await store.initializeData()
    store.setMapMode(HOME_DEFAULT_MAP_MODE)

    previousLayerSnapshot = { ...store.layerVisibility }

    const seaConditionLayers = {
      coastal_stations: false,
      coastal_base: false,
      tide_stations: false,
      surge_stations: true,
      erosion_monitor: true,
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
    document.addEventListener('fullscreenchange', syncFullscreenState)
    syncFullscreenState()

    // 初始化全局视图的视口同步
    nextTick(() => {
      updateViewBounds()
      mapRef.value?.onMapMove(updateViewBounds)
      mapRef.value?.onZoomChange(updateViewBounds)
    })
  })()
})

function updateViewBounds() {
  if (viewBoundsRaf) return
  viewBoundsRaf = requestAnimationFrame(() => {
    viewBoundsRaf = null
    const bounds = mapRef.value?.getViewBounds()
    if (bounds) viewBounds.value = bounds
  })
}

function handleMinimapNavigate({ lat, lng }) {
  mapRef.value?.flyToLatLng(lat, lng)
}

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', syncFullscreenState)
  mapRef.value?.offMouseCoordinateChange?.(handleMouseCoordinateChange)
  if (mouseReadoutSyncRaf) {
    cancelAnimationFrame(mouseReadoutSyncRaf)
    mouseReadoutSyncRaf = null
  }
  if (mouseReadoutResizeObserver) {
    mouseReadoutResizeObserver.disconnect()
    mouseReadoutResizeObserver = null
  }
  if (mouseReadoutGlassInstance) {
    mouseReadoutGlassInstance.destroy()
    mouseReadoutGlassInstance = null
  }
  if (previousLayerSnapshot) {
    Object.entries(previousLayerSnapshot).forEach(([key, val]) => {
      store.setLayerVisibility(key, val)
    })
  }
  // 清理拖拽事件
  document.removeEventListener('mousemove', onSidebarResize)
  document.removeEventListener('mouseup', stopSidebarResize)
  // 清理鹰眼图
  mapRef.value?.offMapMove(updateViewBounds)
  mapRef.value?.offZoomChange(updateViewBounds)
  if (viewBoundsRaf) { cancelAnimationFrame(viewBoundsRaf); viewBoundsRaf = null }
})
</script>

<style scoped>
.home-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  overflow: hidden;
}

/* ─── 左侧固定侧边栏 ─── */
.geology-sidebar {
  position: fixed;
  top: 92px;
  left: 0;
  bottom: 0;
  z-index: 800;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
  border-right: 1px solid #dee2e6;
  user-select: none;
  flex-shrink: 0;
}

.sidebar-accordion {
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: flex 0.3s ease;
  border-bottom: 1px solid #dee2e6;
}

.sidebar-section.is-expanded {
  flex: 1;
  min-height: 0;
}

.sidebar-section-title {
  padding: 12px 14px;
  font-size: 14px;
  font-weight: 400;
  color: #222222;
  letter-spacing: 0.01em;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  background: linear-gradient(to bottom, #fafafa, #e5e5e5);
  border-top: 1px solid #ffffff;
  border-bottom: 1px solid #cccccc;
  transition: all 0.2s ease;
}

.sidebar-section.is-expanded > .sidebar-section-title {
  background: linear-gradient(to bottom, #f0f0f0, #dfdfdf);
  font-weight: 700;
  color: #000000;
  border-bottom: 1px solid #b3b3b3;
}

.title-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-left i {
  color: #555555;
  font-size: 14px;
}

.sidebar-section-title:hover {
  background: linear-gradient(to bottom, #ffffff, #ebebeb);
  color: #000000;
}

.sidebar-section-body :deep(.layer-item input[type="checkbox"]) {
  width: 15px;
  height: 15px;
  accent-color: #0ea5e9;
}

.sidebar-section-body :deep(.layer-group-content) {
  padding-left: 16px;
}

.sidebar-section-body :deep(.layer-children) {
  padding-left: 16px;
}

.sidebar-section-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  background: #ffffff;
}

.map-legend-body {
  padding: 0;
}

/* 覆盖 LayerControl 的样式使其适应侧边栏 */
.sidebar-section-body :deep(.layer-control) {
  padding: 0;
}

.sidebar-section-body :deep(.layer-tree-scroll) {
  max-height: none;
}

.empty-content {
  color: #888;
  font-size: 14px;
  text-align: center;
  padding: 24px 0;
}

/* 内部滚动条美化 */
.sidebar-section-body::-webkit-scrollbar {
  width: 4px;
}

.sidebar-section-body::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-section-body::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 2px;
}

.sidebar-section-body::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.25);
}

.sidebar-section-title i {
  font-size: 14px;
  color: #64748b;
  transition: transform 0.2s;
}

.sidebar-section-title:hover {
  background: rgba(0,0,0,0.02);
}

.sidebar-section-body {
  padding: 0 8px 12px;
}

/* 覆盖 LayerControl 的样式使其适应侧边栏 */
.sidebar-section-body :deep(.layer-control) {
  padding: 0;
}

.sidebar-section-body :deep(.layer-tree-scroll) {
  max-height: none;
}

.sidebar-section-body :deep(.layer-group) {
  margin-bottom: 12px;
}

.sidebar-section-body :deep(.layer-group-header) {
  color: #334155;
  font-size: 14px;
  font-weight: 700;
  padding: 6px 4px;
  background-color: transparent;
  border-radius: 4px;
  margin-bottom: 4px;
  transition: background-color 0.2s;
}

.sidebar-section-body :deep(.layer-group-header:hover) {
  background-color: #f1f5f9;
}

.sidebar-section-body :deep(.layer-group-header i) {
  font-size: 11px;
  color: #64748b;
  margin-right: 6px;
}

.sidebar-section-body :deep(.layer-item) {
  color: #475569;
  font-size: 13px;
  padding: 5px 6px;
  gap: 8px;
  border-radius: 4px;
  transition: background-color 0.15s;
}

.sidebar-section-body :deep(.layer-item:hover) {
  background-color: rgba(14, 165, 233, 0.05);
}

.sidebar-section-body :deep(.layer-item.parent) {
  color: #222;
  font-weight: 600;
  margin-top: 4px;
}

.sidebar-section-body :deep(.layer-item.child) {
  font-size: 13px;
  color: #555;
}



/* ─── 拖拽手柄 ─── */
.sidebar-resize-handle {
  position: absolute;
  top: 0;
  right: -4px;
  bottom: 0;
  width: 8px;
  cursor: col-resize;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-resize-handle:hover .resize-handle-line,
.sidebar-resize-handle:active .resize-handle-line {
  background: #0ea5e9;
  opacity: 1;
}

.resize-handle-line {
  width: 2px;
  height: 40px;
  border-radius: 2px;
  background: #adb5bd;
  opacity: 0.5;
  transition: opacity 0.15s ease, background 0.15s ease;
}

/* ─── 右侧主内容区 ─── */
.geology-main {
  position: relative;
  flex: 1;
  height: 100vh;
  min-width: 0;
}

.home-map {
  position: absolute !important;
  inset: 0;
  z-index: 1;
}

.map-search-glass-anchor {
  position: fixed;
  top: 112px;
  left: calc(var(--sidebar-width) + 28px);
  width: clamp(320px, calc(100vw - var(--sidebar-width) - 780px), 460px);
  z-index: 1220;
  pointer-events: auto;
  transition: left 0.25s ease, width 0.25s ease, top 0.25s ease;
}

/* ─── 全局视图（鹰眼图）定位 ─── */
.minimap-anchor {
  position: fixed;
  bottom: 12px;
  z-index: 1100;
  pointer-events: auto;
  transition: left 0.25s ease;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

/* ─── 工具栏面板（保留） ─── */
.home-page :deep(.tool-rail) {
  right: 12px;
  z-index: 1250;
}

.map-search-glass-anchor :deep(.map-search-glass) {
  width: 100%;
}

.tool-rail-typhoon-shell {
  position: fixed;
  top: 150px;
  right: calc(12px + 68px);
  z-index: 1240;
  pointer-events: auto;
}

.tool-rail-typhoon-panel {
  width: 480px;
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

.tool-rail-typhoon-close,
.tool-rail-device-close,
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

.tool-rail-typhoon-close:hover,
.tool-rail-device-close:hover,
.tool-rail-ai-close:hover {
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

/* ── Device Panel ── */
.tool-rail-device-shell {
  position: fixed;
  top: 150px;
  right: calc(12px + 68px);
  z-index: 1243;
  pointer-events: auto;
}

.tool-rail-device-panel {
  width: 480px;
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

.tool-rail-device-stats {
  padding: 14px 18px 0;
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

/* ── AI Decision Panel ── */
.tool-rail-ai-shell {
  position: fixed;
  top: 150px;
  right: calc(12px + 68px);
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

.tool-rail-ai-content {
  padding: 0;
  overflow-y: auto;
  max-height: min(72vh, 700px);
}

.tool-rail-ai-content :deep(.ai-decision-panel) {
  height: auto;
  min-height: 0;
}

/* ── Layer Control Panel (Right) ── */
.tool-rail-layer-shell {
  position: fixed;
  top: 150px;
  right: calc(12px + 68px);
  z-index: 1244;
  pointer-events: auto;
}

.tool-rail-layer-panel {
  width: 380px;
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
  background: linear-gradient(90deg, transparent, rgba(14, 165, 233, 0.82), transparent);
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
  max-height: min(68vh, 680px);
}

.tool-rail-layer-content :deep(.layer-control) {
  padding: 0;
}

.tool-rail-layer-content :deep(.layer-tree-scroll) {
  max-height: none;
}

.tool-rail-layer-content :deep(.layer-group-header) {
  color: #334155;
  font-size: 14px;
  font-weight: 700;
}

.tool-rail-layer-content :deep(.layer-item) {
  color: #475569;
  font-size: 13px;
}

.tool-rail-layer-content :deep(.layer-item.parent) {
  color: #222;
  font-weight: 600;
}

.tool-rail-layer-content :deep(.layer-item.child) {
  color: #555;
  font-size: 13px;
}

/* ── 地质采样图例风格子菜单 ── */
.geology-sidebar .map-legend-wrapper.embedded {
  border: none;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  pointer-events: auto;
  position: static;
  width: 100%;
}

.geology-sidebar .legend-container {
  padding: 0;
}

.geology-sidebar .legend-scroll {
  max-height: none;
  overflow: visible;
}

.geology-sidebar .legend-panel {
  border: none;
  margin: 0;
  background: transparent;
}

.geology-sidebar .legend-header {
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #334155;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid #e2e8f0;
  transition: background 0.15s;
}

.geology-sidebar .legend-header:hover {
  background: rgba(0, 0, 0, 0.02);
}

.geology-sidebar .legend-name {
  font-size: 14px;
  font-weight: 700;
  color: #334155;
}

.geology-sidebar .legend-header i {
  font-size: 11px;
  color: #64748b;
  transition: transform 0.2s;
}

.geology-sidebar .legend-content {
  padding: 8px 0;
}

.geology-layer-options {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.geology-layer-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  cursor: pointer;
  font-size: 13px;
  color: #475569;
  transition: background 0.15s, color 0.15s;
  user-select: none;
  border-radius: 4px;
}

.geology-layer-option:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.geology-layer-option.active {
  background: rgba(14, 165, 233, 0.06);
  color: #0369a1;
}

.geology-layer-option input[type='checkbox'] {
  width: 15px;
  height: 15px;
  accent-color: #0ea5e9;
  cursor: pointer;
}

.geology-layer-option-label {
  flex: 1;
}

/* ── 鼠标经纬度读数组件 ── */
.map-mouse-readout {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.92);
  letter-spacing: 0.03em;
  white-space: nowrap;
  pointer-events: auto;
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  margin-left: 12px;
}

.map-mouse-readout-separator {
  opacity: 0.45;
  font-weight: 400;
}

.map-mouse-readout-value {
  font-variant-numeric: tabular-nums;
}

/* ── Transitions ── */
.tool-rail-panel-enter-active,
.tool-rail-panel-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.tool-rail-panel-enter-from,
.tool-rail-panel-leave-to {
  opacity: 0;
  transform: translateX(14px);
}

@media (max-width: 1080px) {
  .map-search-glass-anchor {
    left: calc(var(--sidebar-width) + 20px);
    width: min(420px, calc(100vw - var(--sidebar-width) - 120px));
  }
}

@media (max-width: 860px) {
  .map-search-glass-anchor {
    top: 104px;
    left: calc(var(--sidebar-width) + 16px);
    width: calc(100vw - var(--sidebar-width) - 32px);
  }
}
</style>

