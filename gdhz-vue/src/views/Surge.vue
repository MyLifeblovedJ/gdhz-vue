<template>
  <div class="page-container">
    <!-- 风暴潮页面：去掉观测资源概览 -->
    <LeftSidebar 
      :show-resource-overview="false"
      @device-click="handleDeviceClick"
      @layer-toggle="handleLayerToggle"
    />
    <MapContainer 
      ref="mapRef"
      :current-basemap="currentBasemap"
      @device-click="handleDeviceClick"
    >
      <RightSidebar />
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
      
      <!-- 风暴潮专属组件 -->
      <div class="surge-info-panel">
        <div class="panel-title">
          <i class="fa-solid fa-water"></i>
          风暴潮监测
        </div>
        <div class="surge-stats">
          <div class="surge-stat-item">
            <span class="label">当前预警等级</span>
            <span class="value level-red">I级 (红色)</span>
          </div>
          <div class="surge-stat-item">
            <span class="label">预计最大增水</span>
            <span class="value">180 cm</span>
          </div>
          <div class="surge-stat-item">
            <span class="label">影响区域</span>
            <span class="value">珠江口外海域</span>
          </div>
          <div class="surge-stat-item">
            <span class="label">预警发布时间</span>
            <span class="value">今日 10:00</span>
          </div>
        </div>
      </div>
    </MapContainer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAppStore } from '../stores/app'
import LeftSidebar from '../components/layout/LeftSidebar.vue'
import MapContainer from '../components/map/MapContainer.vue'
import RightSidebar from '../components/layout/RightSidebar.vue'
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

/* 风暴潮专属信息面板 */
.surge-info-panel {
  position: absolute;
  top: 10px;
  left: 10px;
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

.surge-info-panel .panel-title {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-cyan);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.surge-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.surge-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  padding: 6px 0;
  border-bottom: 1px solid var(--border-subtle);
}

.surge-stat-item:last-child {
  border-bottom: none;
}

.surge-stat-item .label {
  color: var(--text-muted);
}

.surge-stat-item .value {
  color: var(--text-secondary);
  font-weight: 500;
}

.surge-stat-item .value.level-red {
  color: var(--alert-red);
  font-weight: 700;
}
</style>
