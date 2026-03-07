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
        <RealtimeDataPanel
          :hide-tide-stations="true"
          @station-click="handleStationClick"
        />
      </div>

      <FloatingToolbar
        @device-click="handleDeviceClick"
        @layer-toggle="handleLayerToggle"
        @model-click="handleModelClick"
      />

      <TyphoonInfo />

      <MapLegend />
      <BottomWarningDock
        title="潮位预警站点"
        element-keyword="潮位"
        @station-click="handleWarningStationClick"
      />
      <StationDetailDock :station="selectedWarningStation" />
      <BottomControls
        :map-mode="store.mapMode"
        :active3-d-view="active3DView"
        @zoom-in="handleZoomIn"
        @zoom-out="handleZoomOut"
        @reset-view="handleResetView"
        @locate="handleLocate"
        @basemap-change="handleBasemapChange"
        @toggle-map-mode="handleToggleMapMode"
        @switch-3d-view="handleSwitch3DView"
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
import BottomWarningDock from '../components/layout/BottomWarningDock.vue'
import StationDetailDock from '../components/layout/StationDetailDock.vue'

const store = useAppStore()
const mapRef = ref(null)
const currentBasemap = ref('satellite')
const selectedDevice = ref(null)
const selectedWarningStation = ref(null)
const active3DView = ref('decision')

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

function handleWarningStationClick(station) {
  selectedWarningStation.value = station
  if (station?.stationId) {
    mapRef.value?.flyToStation(station.stationId)
  }
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

function handleSwitch3DView(viewKey) {
  active3DView.value = viewKey
  mapRef.value?.switch3DViewPreset(viewKey)
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
  --map-safe-bottom: 210px;
  --toolbar-safe-left: calc(var(--overlay-panel-left-width) + var(--overlay-panel-side-offset) + 10px);
}

.overview-map {
  width: 100%;
  height: 100%;
}

.overlay-banner {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  width: auto;
  min-width: 600px;
  max-width: 90vw;
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
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(18px) saturate(1.02);
  -webkit-backdrop-filter: blur(18px) saturate(1.02);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.12);
}

.overlay-panel :deep(.decision-sidebar) {
  border-right: 1px solid rgba(15, 23, 42, 0.08);
}

.overlay-panel :deep(.data-panel-sidebar) {
  border-left: 1px solid rgba(15, 23, 42, 0.08);
}

</style>
