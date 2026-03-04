<template>
  <div class="page-container">
    <!-- 左侧边栏 - 去掉模型集成 -->
    <LeftSidebar
      :show-model-integration="false"
      @device-click="handleDeviceClick"
      @layer-toggle="handleLayerToggle"
    />

    <!-- 中间主内容区（包含地图） -->
    <div class="main-content-area">
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

        <!-- 开发中提示浮层 -->
        <div class="dev-notice">
          <i class="fa-solid fa-hammer"></i>
          <span>{{ pageTitle }} 模块开发中</span>
        </div>
      </MapContainer>
    </div>

    <!-- 右侧边栏 - 根据页面类型过滤预警和风险 -->
    <RightSidebar :disaster-type="pageKey" @risk-click="handleRiskClick" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '../stores/app'
import LeftSidebar from '../components/layout/LeftSidebar.vue'
import MapContainer from '../components/map/MapContainer.vue'
import MapLegend from '../components/map/MapLegend.vue'
import RightSidebar from '../components/layout/RightSidebar.vue'
import BottomControls from '../components/layout/BottomControls.vue'
import DetailPopup from '../components/common/DetailPopup.vue'

const route = useRoute()
const store = useAppStore()
const mapRef = ref(null)
const currentBasemap = ref('satellite')
const selectedDevice = ref(null)

const pageTitle = computed(() => route.meta.title || '页面')
const pageKey = computed(() => route.meta.pageKey || '')

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

/* 开发中提示浮层 */
.dev-notice {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  border: 1px solid var(--accent-cyan);
  border-radius: 20px;
  padding: 8px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--accent-cyan);
  font-size: 13px;
  z-index: 1000;
  animation: fadeIn 0.5s ease-out;
}

.dev-notice i {
  animation: breathe 2s ease-in-out infinite;
}
</style>
