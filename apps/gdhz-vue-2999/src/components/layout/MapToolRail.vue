<template>
  <div class="tool-rail">
    <button class="tool-btn mode" @click="$emit('toggle-map-mode')">{{ mapMode }}</button>
    <button class="tool-btn" :class="{ active: cameraActive }" @click="$emit('toggle-camera')" title="海岸观测视频叠加">
      <i class="fa-solid fa-camera"></i>
    </button>
    <button class="tool-btn" @click="$emit('zoom-in')"><i class="fa-solid fa-plus"></i></button>
    <button class="tool-btn" @click="$emit('zoom-out')"><i class="fa-solid fa-minus"></i></button>
    <button class="tool-btn" @click="$emit('reset-view')"><i class="fa-solid fa-house"></i></button>
    <button class="tool-btn" @click="$emit('locate')"><i class="fa-solid fa-crosshairs"></i></button>
    <button class="tool-btn" @click="switchBasemap"><i class="fa-solid fa-map"></i></button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  mapMode: { type: String, default: '3D' },
  cameraActive: { type: Boolean, default: false }
})

const emit = defineEmits(['zoom-in', 'zoom-out', 'reset-view', 'locate', 'toggle-map-mode', 'basemap-change', 'toggle-camera'])

const basemaps = ['satellite', 'dark', 'street']
const index = ref(0)

function switchBasemap() {
  index.value = (index.value + 1) % basemaps.length
  emit('basemap-change', basemaps[index.value])
}
</script>

<style scoped>
.tool-rail {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 900;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: auto;
}
.tool-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(110, 156, 196, 0.4);
  background: rgba(7, 23, 44, 0.86);
  color: #c9e8ff;
  cursor: pointer;
}
.tool-btn.mode {
  width: 46px;
  font-weight: 700;
}
.tool-btn:hover {
  border-color: rgba(82, 195, 255, 0.75);
  background: rgba(23, 72, 111, 0.86);
}

.tool-btn.active {
  border-color: rgba(82, 195, 255, 0.85);
  background: rgba(35, 105, 158, 0.88);
}
</style>
