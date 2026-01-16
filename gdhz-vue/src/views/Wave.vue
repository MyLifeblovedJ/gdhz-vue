<template>
  <div class="page-container">
    <LeftSidebar 
      :show-resource-overview="true"
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
</style>
