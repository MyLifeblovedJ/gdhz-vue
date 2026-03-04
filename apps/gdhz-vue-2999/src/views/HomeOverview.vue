<template>
  <div class="home-page">
    <MapContainer
      ref="mapRef"
      class="home-map"
      :current-basemap="currentBasemap"
      :map-mode="store.mapMode"
      :fullscreen="true"
      @device-click="handleDeviceClick"
    >
      <AlertBanner class="overlay-banner" />

      <div class="two-column-layout">
        <section class="column left-column">
          <div class="column-block layer-block">
            <div class="block-title"><i class="fa-solid fa-layer-group"></i> 图层控制</div>
            <div class="block-body">
              <LayerControl @layer-toggle="handleLayerToggle" />
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

      <DataDock />
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
import LayerControl from '../components/map/LayerControl.vue'
import DeviceExplorer from '../components/device/DeviceExplorer.vue'
import AlertBanner from '../components/layout/AlertBanner.vue'
import CoastalObservationPanel from '../components/layout/CoastalObservationPanel.vue'
import CoastalCameraOverlay from '../components/layout/CoastalCameraOverlay.vue'
import MapToolRail from '../components/layout/MapToolRail.vue'
import DataDock from '../components/layout/DataDock.vue'

const store = useAppStore()
const mapRef = ref(null)
const currentBasemap = ref('satellite')
const showCameraOverlay = ref(false)

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

onMounted(() => {
  store.initializeData()
  store.setMapMode('3D')
})
</script>

<style scoped>
.home-page {
  position: relative;
  flex: 1;
  min-height: 0;
  height: 100%;
  width: 100%;
  --home-column-width: clamp(360px, 28vw, 500px);
}

.home-map {
  width: 100%;
  height: 100%;
}

.overlay-banner {
  pointer-events: auto;
}

.two-column-layout {
  position: absolute;
  left: 12px;
  right: 12px;
  top: 82px;
  bottom: max(240px, 24vh);
  display: flex;
  justify-content: space-between;
  gap: 14px;
  z-index: 760;
  pointer-events: none;
}

.column {
  width: var(--home-column-width);
  border-radius: 14px;
  border: 1px solid rgba(110, 153, 188, 0.35);
  background: linear-gradient(180deg, rgba(1, 9, 22, 0.88), rgba(4, 17, 36, 0.85));
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.28);
  display: flex;
  flex-direction: column;
  min-height: 0;
  pointer-events: auto;
}

.column-block {
  margin: 10px;
  border-radius: 10px;
  border: 1px solid rgba(114, 157, 194, 0.24);
  background: rgba(255, 255, 255, 0.03);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.layer-block { flex: 0 0 40%; }
.device-block { flex: 1; margin-bottom: 10px; }
.typhoon-block { flex: 0 0 42%; }
.coast-block { flex: 1; margin-bottom: 10px; }

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
}

.block-body {
  flex: 1;
  min-height: 0;
  padding: 8px;
  overflow: hidden;
}

.layer-block .block-body { overflow-y: auto; }
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
  bottom: max(245px, 24vh);
  z-index: 110;
}
</style>
