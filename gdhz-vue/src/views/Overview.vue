<template>
  <div class="page-container">
    <!-- 左侧边栏 - 贯通布局 -->
    <LeftSidebar 
      @device-click="handleDeviceClick"
      @layer-toggle="handleLayerToggle"
      @model-click="handleModelClick"
    />
    
    <!-- 中间主内容区（包含横幅、统计条、地图） -->
    <div class="main-content-area">
      <!-- 预警横幅 -->
      <AlertBanner />
      
      <!-- 统计条 -->
      <StatBar />
      
      <!-- 地图容器 -->
      <MapContainer 
        ref="mapRef"
        :current-basemap="currentBasemap"
        @device-click="handleDeviceClick"
      >
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
    
    <!-- 右侧边栏 - 贯通布局 -->
    <RightSidebar @risk-click="handleRiskClick" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAppStore } from '../stores/app'
import LeftSidebar from '../components/layout/LeftSidebar.vue'
import MapContainer from '../components/map/MapContainer.vue'
import MapLegend from '../components/map/MapLegend.vue'
import RightSidebar from '../components/layout/RightSidebar.vue'
import BottomControls from '../components/layout/BottomControls.vue'
import DetailPopup from '../components/common/DetailPopup.vue'
import AlertBanner from '../components/layout/AlertBanner.vue'
import StatBar from '../components/layout/StatBar.vue'

const store = useAppStore()
const mapRef = ref(null)
const currentBasemap = ref('dark')
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
  // TODO: 打开模型配置面板
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

/* 右侧主内容区 - 包含横幅和地图 */
.main-content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  position: relative; /* 用于展开按钮定位 */
}
</style>

