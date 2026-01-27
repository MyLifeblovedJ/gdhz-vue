<template>
  <div class="page-container">
    <!-- 左侧边栏 - 决策核心 -->
    <SeaConditionLeftSidebar
      @risk-click="handleRiskClick"
      @evacuation-click="handleEvacuationClick"
      @seawall-click="handleSeawallClick"
    />

    <!-- 中间主内容区（包含地图） -->
    <div class="main-content-area">
      <!-- 预警横幅 -->
      <AlertBanner />

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

        <!-- 台风信息面板 (复用态势感知，位置固定) -->
        <TyphoonInfo />



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

    <!-- 右侧边栏 - 数据支撑 -->
    <SeaConditionRightSidebar @station-click="handleStationClick" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAppStore } from '../stores/app'
import MapContainer from '../components/map/MapContainer.vue'
import MapLegend from '../components/map/MapLegend.vue'
import TyphoonInfo from '../components/map/TyphoonInfo.vue'
import FloatingToolbar from '../components/map/FloatingToolbar.vue'
import SeaConditionLeftSidebar from '../components/layout/SeaConditionLeftSidebar.vue'
import SeaConditionRightSidebar from '../components/layout/SeaConditionRightSidebar.vue'
import BottomControls from '../components/layout/BottomControls.vue'
import DetailPopup from '../components/common/DetailPopup.vue'
import TimelineController from '../components/map/TimelineController.vue'
import AlertBanner from '../components/layout/AlertBanner.vue'

const store = useAppStore()
const mapRef = ref(null)
const currentBasemap = ref('satellite')
const selectedDevice = ref(null)

// 漫滩模拟相关状态
const hasFloodSimulation = ref(true)  // 是否有漫滩模拟数据
const floodSimulationStartTime = ref('2026-01-27 14:00')
const floodSimulationEndTime = ref('2026-01-27 20:00')
const floodSimulationCurrentTime = ref('2026-01-27 16:30')

function handleDeviceClick(device) {
  selectedDevice.value = device
  mapRef.value?.flyToDevice(device.id)
}

function handleRiskClick(risk) {
  console.log('Risk clicked:', risk)
  mapRef.value?.flyToRisk(risk)
}

function handleEvacuationClick(location) {
  console.log('Evacuation route requested:', location)
  // 触发疏散路径动画
  mapRef.value?.showEvacuationRoute(location)
}

function handleSeawallClick(seawall) {
  console.log('Seawall clicked:', seawall)
  mapRef.value?.flyToSeawall(seawall.id)
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

// 时间轴控制
function handleTimeChange(time) {
  floodSimulationCurrentTime.value = time
  // 更新漫滩模拟图层显示
  console.log('Time changed:', time)
}

function handlePlay() {
  console.log('Start flood simulation animation')
}

function handlePause() {
  console.log('Pause flood simulation animation')
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
