<template>
  <div class="tool-rail">
    <button
      class="tool-btn"
      :class="{ active: layerPanelOpen }"
      title="图层控制"
      @click="$emit('toggle-layer-panel')"
    >
      <i class="fa-solid fa-layer-group"></i>
    </button>
    <button
      class="tool-btn"
      :class="{ active: typhoonPanelOpen }"
      title="台风专题"
      @click="$emit('toggle-typhoon')"
    >
      <i class="fa-solid fa-hurricane"></i>
    </button>
    <button class="tool-btn mode" @click="$emit('toggle-map-mode')">{{ mapMode }}</button>
    <button class="tool-btn" :class="{ active: cameraActive }" title="海岸观测视频叠加" @click="$emit('toggle-camera')">
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

defineProps({
  mapMode: { type: String, default: '3D' },
  cameraActive: { type: Boolean, default: false },
  layerPanelOpen: { type: Boolean, default: false },
  typhoonPanelOpen: { type: Boolean, default: false },
})

const emit = defineEmits(['zoom-in', 'zoom-out', 'reset-view', 'locate', 'toggle-map-mode', 'basemap-change', 'toggle-camera', 'toggle-layer-panel', 'toggle-typhoon'])

const basemaps = ['satellite', 'dark', 'street']
const index = ref(0)

function switchBasemap() {
  index.value = (index.value + 1) % basemaps.length
  emit('basemap-change', basemaps[index.value])
}
</script>

<style scoped>
.tool-rail {
  position: fixed;
  right: 24px;
  top: 150px;
  z-index: 900;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: auto;
  padding: 10px 8px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.58);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(244, 247, 250, 0.56));
  backdrop-filter: blur(18px) saturate(1.08);
  -webkit-backdrop-filter: blur(18px) saturate(1.08);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12);
}

.tool-btn {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(237, 241, 245, 0.82));
  color: #526071;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.85);
  transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
}

.tool-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(15, 23, 42, 0.12);
  background: linear-gradient(180deg, rgba(255, 255, 255, 1), rgba(244, 247, 251, 0.9));
  color: #1f2937;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.95);
}

.tool-btn.active {
  border-color: rgba(196, 134, 28, 0.24);
  background: linear-gradient(180deg, rgba(255, 248, 236, 0.98), rgba(248, 237, 214, 0.9));
  color: #8a5a00;
  box-shadow: 0 12px 24px rgba(196, 134, 28, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.tool-btn i {
  font-size: 14px;
}
</style>
