<template>
  <div class="map-action-dock">
    <div class="action-pill-bar primary-bar">
      <button
        v-for="item in primaryActions"
        :key="item.key"
        class="dock-btn"
        :class="{ active: isActive(item) }"
        type="button"
        @click="emit(item.event)"
      >
        <span v-if="item.text" class="dock-btn-text">{{ item.text }}</span>
        <i v-else :class="item.icon"></i>
        <span class="dock-btn-tooltip">{{ item.label }}</span>
      </button>
    </div>

    <div class="action-pill-bar secondary-bar">
      <button
        v-for="item in secondaryActions"
        :key="item.key"
        class="dock-btn secondary-btn"
        :class="{ active: isActive(item), disabled: item.disabled }"
        type="button"
        :disabled="item.disabled"
        @click="handleSecondaryClick(item)"
      >
        <i :class="item.icon"></i>
        <span class="dock-btn-tooltip">{{ item.label }}</span>
      </button>
    </div>

    <div class="wave-legend wave-legend-bar">
      <div class="wave-legend-gradient">
        <span class="wave-legend-unit">kt</span>
        <span
          v-for="tick in waveLegendTicks"
          :key="tick.value"
          class="wave-legend-tick"
          :style="{ left: tick.pct + '%' }"
        >{{ tick.value }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  mapMode: { type: String, default: '3D' },
  cameraActive: { type: Boolean, default: false },
  typhoonActive: { type: Boolean, default: false },
  vesselActive: { type: Boolean, default: false },
  windActive: { type: Boolean, default: false },
  fullscreenActive: { type: Boolean, default: false },
})

const emit = defineEmits([
  'zoom-in',
  'zoom-out',
  'toggle-map-mode',
  'reset-view',
  'toggle-basemap',
  'toggle-typhoon',
  'toggle-fullscreen',
  'toggle-camera',
  'toggle-vessels',
  'toggle-wind',
])

const primaryActions = [
  { key: 'zoom-in', label: '放大', icon: 'fa-solid fa-plus', event: 'zoom-in', active: false },
  { key: 'zoom-out', label: '缩小', icon: 'fa-solid fa-minus', event: 'zoom-out', active: false },
  { key: 'map-mode', label: '3D/2D', text: '3D', event: 'toggle-map-mode', activeProp: 'mapMode' },
  { key: 'reset-view', label: '重置视角', icon: 'fa-solid fa-house', event: 'reset-view', active: false },
  { key: 'basemap', label: '底图切换', icon: 'fa-solid fa-map', event: 'toggle-basemap', active: false },
  { key: 'typhoon', label: '台风', icon: 'fa-solid fa-hurricane', event: 'toggle-typhoon', activeProp: 'typhoonActive' },
  { key: 'fullscreen', label: '全屏', icon: 'fa-solid fa-expand', event: 'toggle-fullscreen', activeProp: 'fullscreenActive' },
]

const secondaryActions = [
  { key: 'camera', label: '摄像头', icon: 'fa-solid fa-camera', event: 'toggle-camera', activeProp: 'cameraActive' },
  { key: 'vessels', label: '船舶', icon: 'fa-solid fa-ship', event: 'toggle-vessels', activeProp: 'vesselActive' },
  { key: 'wind', label: '风场', icon: 'fa-solid fa-wind', event: 'toggle-wind', activeProp: 'windActive' },
  { key: 'temperature', label: '温度', icon: 'fa-solid fa-temperature-three-quarters', disabled: true },
  { key: 'precipitation', label: '降水', icon: 'fa-solid fa-cloud-rain', disabled: true },
  { key: 'pressure', label: '海平面气压', icon: 'fa-solid fa-gauge-high', disabled: true },
  { key: 'terrain', label: '地形', icon: 'fa-solid fa-mountain', disabled: true },
]

const waveLegendTicks = [
  { value: '0', pct: 0 },
  { value: '5', pct: 8.3 },
  { value: '10', pct: 16.7 },
  { value: '20', pct: 33.3 },
  { value: '30', pct: 50 },
  { value: '40', pct: 66.7 },
  { value: '60', pct: 100 },
]

function isActive(item) {
  if (!item.activeProp) return Boolean(item.active)
  if (item.activeProp === 'mapMode') return props.mapMode === '2D'
  return Boolean(props[item.activeProp])
}

function handleSecondaryClick(item) {
  if (item.disabled) return
  emit(item.event)
}
</script>

<style scoped>
.map-action-dock {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 940;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: min(520px, calc(100vw - 32px));
  pointer-events: auto;
}

.action-pill-bar {
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.58);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(240, 244, 248, 0.66));
  backdrop-filter: blur(18px) saturate(1.08);
  -webkit-backdrop-filter: blur(18px) saturate(1.08);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.14);
}

.action-pill-bar {
  display: flex;
  justify-content: space-evenly;
  padding: 0 6px;
  height: 30px;
  align-items: center;
}

.dock-btn-text {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.dock-btn {
  width: 42px;
  height: 34px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #4a5565;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  font-size: 15px;
  position: relative;
  transition: background 0.15s ease, color 0.15s ease;
}

.dock-btn:hover:not(:disabled) {
  background: rgba(15, 23, 42, 0.07);
  color: #1f2937;
}

.dock-btn-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%) translateY(4px);
  background: rgba(15, 23, 42, 0.88);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  padding: 5px 12px;
  border-radius: 6px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.dock-btn-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: rgba(15, 23, 42, 0.88);
}

.dock-btn:hover .dock-btn-tooltip {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.dock-btn.active {
  background: rgba(196, 134, 28, 0.12);
  color: #8a5a00;
}

.dock-btn.disabled,
.dock-btn:disabled {
  color: #b0b8c4;
  opacity: 1;
  cursor: not-allowed;
}

.dock-btn i {
  font-size: 15px;
  flex-shrink: 0;
}

.wave-legend-bar {
  display: flex;
  align-items: center;
  padding: 0;
  height: 30px;
}

.wave-legend-unit {
  position: absolute;
  left: 8px;
  font-size: 11px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  z-index: 1;
}

.wave-legend-gradient {
  width: 100%;
  height: 26px;
  border-radius: 999px;
  background: linear-gradient(
    to right,
    #f0f4e8 0%,
    #b8dba0 8.3%,
    #78c46a 16.7%,
    #f3df6e 33.3%,
    #f09e4a 50%,
    #e04545 66.7%,
    #9b1d5a 100%
  );
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.22);
  position: relative;
  display: flex;
  align-items: center;
}

.wave-legend-tick {
  position: absolute;
  transform: translateX(-50%);
  font-size: 10px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.92);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
  line-height: 1;
  pointer-events: none;
}

.wave-legend-tick:first-child {
  transform: translateX(0);
  left: 6px !important;
}

.wave-legend-tick:last-child {
  transform: translateX(-100%);
  left: calc(100% - 6px) !important;
}

@media (max-width: 1100px) {
  .map-action-dock {
    right: 12px;
    bottom: 12px;
  }
}

@media (max-width: 720px) {
  .dock-btn {
    width: 36px;
    height: 30px;
    font-size: 13px;
  }

  .wave-legend-bar {
    width: min(400px, calc(100vw - 24px));
  }
}
</style>
