<template>
  <div class="page-container">
    <!-- 左侧边栏 - 决策核心（可收缩） -->
    <RightSidebar disaster-type="wave" @risk-click="handleRiskClick" />

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

        <!-- 海浪专属信息面板 -->
        <div class="wave-info-panel">
          <div class="panel-title">
            <i class="fa-solid fa-wind"></i>
            海浪监测
          </div>
          <div class="wave-stats">
            <div class="wave-stat-item">
              <span class="label">当前预警等级</span>
              <span class="value level-red">I级 (红色)</span>
            </div>
            <div class="wave-stat-item">
              <span class="label">预计最大浪高</span>
              <span class="value">6.5 m</span>
            </div>
            <div class="wave-stat-item">
              <span class="label">影响区域</span>
              <span class="value">粤东海域</span>
            </div>
            <div class="wave-stat-item">
              <span class="label">预警发布时间</span>
              <span class="value">今日 09:30</span>
            </div>
          </div>
        </div>
      </MapContainer>
    </div>

    <!-- 右侧边栏 - 实时数据监控（可收缩） -->
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

/* 海浪专属信息面板 */
.wave-info-panel {
  position: absolute;
  top: 10px;
  left: 90px;  /* 为悬浮工具栏留出空间 */
  width: 260px;
  background: var(--bg-panel);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-normal);
  border-radius: var(--border-radius);
  padding: 12px;
  z-index: 1000;
  pointer-events: auto;
  box-shadow: var(--shadow-panel);
  animation: slideInLeft 0.4s ease-out;
}

.wave-info-panel .panel-title {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-cyan);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.wave-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wave-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  padding: 6px 0;
  border-bottom: 1px solid var(--border-subtle);
}

.wave-stat-item:last-child {
  border-bottom: none;
}

.wave-stat-item .label {
  color: var(--text-muted);
}

.wave-stat-item .value {
  color: var(--text-secondary);
  font-weight: 500;
}

.wave-stat-item .value.level-red {
  color: var(--alert-red);
  font-weight: 700;
}
</style>
