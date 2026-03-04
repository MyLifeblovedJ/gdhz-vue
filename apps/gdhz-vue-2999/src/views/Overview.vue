<template>
  <div class="overview-page">
    <MapContainer
      ref="mapRef"
      class="overview-map"
      :current-basemap="currentBasemap"
      :map-mode="store.mapMode"
      :fullscreen="true"
      @device-click="handleDeviceClick"
    >
      <AlertBanner class="overlay-banner" />

      <div class="overlay-panel overlay-panel-left">
        <RightSidebar @risk-click="handleRiskClick" />
      </div>

      <div class="overlay-panel overlay-panel-right">
        <RealtimeDataPanel @station-click="handleStationClick" />
      </div>

      <FloatingToolbar
        @device-click="handleDeviceClick"
        @layer-toggle="handleLayerToggle"
        @model-click="handleModelClick"
      />

      <TyphoonInfo />

      <MapLegend />
      <BottomControls
        :map-mode="store.mapMode"
        @zoom-in="handleZoomIn"
        @zoom-out="handleZoomOut"
        @reset-view="handleResetView"
        @locate="handleLocate"
        @basemap-change="handleBasemapChange"
        @toggle-map-mode="handleToggleMapMode"
      />
      <DetailPopup
        v-if="selectedDevice"
        :device="selectedDevice"
        @close="selectedDevice = null"
      />
    </MapContainer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAppStore } from '../stores/app'
import MapContainer from '../components/map/MapContainer.vue'
import MapLegend from '../components/map/MapLegend.vue'
import TyphoonInfo from '../components/map/TyphoonInfo.vue'
import FloatingToolbar from '../components/map/FloatingToolbar.vue'
import RightSidebar from '../components/layout/RightSidebar.vue'
import RealtimeDataPanel from '../components/layout/RealtimeDataPanel.vue'
import BottomControls from '../components/layout/BottomControls.vue'
import DetailPopup from '../components/common/DetailPopup.vue'
import AlertBanner from '../components/layout/AlertBanner.vue'

const store = useAppStore()
const mapRef = ref(null)
const currentBasemap = ref('satellite')
const selectedDevice = ref(null)

function handleDeviceClick(device) {
  selectedDevice.value = device
  mapRef.value?.flyToDevice(device.id)
}

function handleRiskClick(risk) {
  console.log('Risk clicked:', risk)
  mapRef.value?.flyToRisk(risk)
}

function handleLayerToggle({ layerId, checked }) {
  console.log('Layer toggle:', layerId, checked)
}

function handleModelClick(model) {
  console.log('Model clicked:', model)
}

function handleStationClick(station) {
  console.log('Station clicked:', station)
  mapRef.value?.flyToStation(station.id)
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
  alert('瀹氫綅鍔熻兘闇€瑕丟PS鎺ュ叆')
}

function handleBasemapChange(basemapId) {
  currentBasemap.value = basemapId
}

function handleToggleMapMode() {
  store.toggleMapMode()
}

onMounted(() => {
  store.initializeData()
  store.setMapMode('3D')
})
</script>

<style scoped>
.overview-page {
  position: relative;
  flex: 1;
  min-height: 0;
  height: 100%;
  width: 100%;
  --overlay-panel-left-width: 360px;
  --overlay-panel-right-width: 360px;
  --overlay-panel-side-offset: 12px;
  --map-safe-left: calc(var(--overlay-panel-left-width) + var(--overlay-panel-side-offset) + 10px);
  --toolbar-safe-left: calc(var(--overlay-panel-left-width) + var(--overlay-panel-side-offset) + 10px);
}

.overview-map {
  width: 100%;
  height: 100%;
}

.overlay-banner {
  pointer-events: auto;
}

.overlay-panel {
  position: absolute;
  top: 80px;
  bottom: 12px;
  width: 360px;
  z-index: 700;
  pointer-events: none;
}

.overlay-panel-left {
  left: 12px;
}

.overlay-panel-right {
  right: 12px;
}

.overlay-panel :deep(.decision-sidebar),
.overlay-panel :deep(.data-panel-sidebar) {
  height: 100%;
  pointer-events: auto;
}

.overlay-panel :deep(.data-panel-sidebar) {
  border-left: 1px solid rgba(79, 179, 216, 0.34);
}
</style>
