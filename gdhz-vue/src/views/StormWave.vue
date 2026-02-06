<template>
  <div class="page-container">
    <!-- 左侧边栏 - 决策核心 -->
    <RightSidebar disaster-type="storm-wave" @risk-click="handleRiskClick" />

    <!-- 中间主内容区（包含地图） -->
    <div class="main-content-area">
      <!-- 地图容器 -->
      <MapContainer
        ref="mapRef"
        :current-basemap="currentBasemap"
        @device-click="handleDeviceClick"
      >
        <!-- Windy 风格悬浮工具栏 -->
        <FloatingToolbar
          @device-click="handleDeviceClick"
          @layer-toggle="handleLayerToggle"
        />

        <MapLegend />
        <BottomControls
          @zoom-in="handleZoomIn"
          @zoom-out="handleZoomOut"
          @reset-view="handleResetView"
          @locate="handleLocate"
          @basemap-change="handleBasemapChange"
        />
        <DetailPopup
          v-if="selectedDevice"
          :device="selectedDevice"
          @close="selectedDevice = null"
        />
      </MapContainer>
    </div>

    <!-- 右侧边栏 - 实时数据监控 -->
    <RealtimeDataPanel @station-click="handleStationClick" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAppStore } from '../stores/app'
import MapContainer from '../components/map/MapContainer.vue'
import MapLegend from '../components/map/MapLegend.vue'
import FloatingToolbar from '../components/map/FloatingToolbar.vue'
import RightSidebar from '../components/layout/RightSidebar.vue'
import RealtimeDataPanel from '../components/layout/RealtimeDataPanel.vue'
import BottomControls from '../components/layout/BottomControls.vue'
import DetailPopup from '../components/common/DetailPopup.vue'

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

function handleStationClick(station) {
  console.log('Station clicked:', station)
  mapRef.value?.flyToStation(station.id)
}

onMounted(() => {
  store.initializeData()
})
</script>

<style scoped>
.page-container {
  flex: 1;
  display: flex;
  min-height: 0;
  position: relative;
}

/* 中间主内容区 */
.main-content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  position: relative;
}
</style>

