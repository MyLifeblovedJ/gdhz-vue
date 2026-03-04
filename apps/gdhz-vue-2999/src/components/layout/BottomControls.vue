<template>
  <div class="bottom-controls-wrapper">


    <div class="bottom-controls">
      <!-- 鏃堕棿杞?-->
      <div class="timeline-compact">
        <button class="timeline-btn" @click="timelineStep(-1)">
          <i class="fa-solid fa-backward-step"></i>
        </button>
        <button 
          class="timeline-btn play" 
          :class="{ playing: isPlaying }"
          @click="togglePlay"
        >
          <i :class="['fa-solid', isPlaying ? 'fa-pause' : 'fa-play']"></i>
        </button>
        <button class="timeline-btn" @click="timelineStep(1)">
          <i class="fa-solid fa-forward-step"></i>
        </button>
        <div class="timeline-slider">
          <input 
            type="range" 
            v-model="sliderValue"
            min="0" 
            max="72" 
            @input="updateTimelineValue"
          >
        </div>
        <span class="timeline-current">{{ currentTimeLabel }}</span>
      </div>

      <div class="divider"></div>

      <!-- 搴曞浘鍒囨崲 -->
      <div class="basemap-switcher">
        <button class="basemap-btn" @click="toggleDropdown">
          <i class="fa-solid fa-map"></i> 底图
        </button>
        <div class="basemap-dropdown" :class="{ show: showDropdown }">
          <div 
            v-for="basemap in basemaps" 
            :key="basemap.id"
            class="basemap-option"
            :class="{ active: currentBasemap === basemap.id }"
            @click="switchBasemap(basemap.id)"
          >
            <i :class="['fa-solid', basemap.icon]"></i>
            {{ basemap.name }}
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- 鍦板浘宸ュ叿 -->
      <div class="map-tools-compact">
        <button class="tool-btn tool-mode" @click="toggleMapMode" :title="`切换到${mapMode === '3D' ? '2D' : '3D'}`">
          <span>{{ mapMode }}</span>
        </button>
        <button class="tool-btn" @click="zoomIn" title="鏀惧ぇ">
          <i class="fa-solid fa-plus"></i>
        </button>
        <button class="tool-btn" @click="zoomOut" title="缂╁皬">
          <i class="fa-solid fa-minus"></i>
        </button>
        <button class="tool-btn" @click="resetView" title="澶嶄綅">
          <i class="fa-solid fa-house"></i>
        </button>
        <button class="tool-btn" @click="locateUser" title="瀹氫綅">
          <i class="fa-solid fa-crosshairs"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { basemaps } from '../../data/mockData'

const props = defineProps({
  mapMode: {
    type: String,
    default: '3D'
  }
})

const emit = defineEmits(['zoom-in', 'zoom-out', 'reset-view', 'locate', 'basemap-change', 'timeline-change', 'toggle-map-mode'])

const mapMode = computed(() => props.mapMode)

// 鐘舵€?
const sliderValue = ref(24)
const isPlaying = ref(false)
const showDropdown = ref(false)
const currentBasemap = ref('dark')
let playInterval = null



// 璁＄畻灞炴€?
const currentTimeLabel = computed(() => {
  const now = new Date()
  const hours = parseInt(sliderValue.value) - 24
  const targetTime = new Date(now.getTime() + hours * 3600 * 1000)
  return targetTime.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
})

// 鏃堕棿杞存柟娉?
function timelineStep(direction) {
  sliderValue.value = Math.max(0, Math.min(72, parseInt(sliderValue.value) + direction * 3))
  emit('timeline-change', sliderValue.value)
}

function togglePlay() {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    // 鍏堟竻鐞嗗彲鑳藉瓨鍦ㄧ殑鏃у畾鏃跺櫒锛岄槻姝㈤噸澶嶅垱寤?
    if (playInterval) {
      clearInterval(playInterval)
    }
    playInterval = setInterval(() => timelineStep(1), 1000)
  } else {
    if (playInterval) {
      clearInterval(playInterval)
      playInterval = null
    }
  }
}

function updateTimelineValue() {
  emit('timeline-change', sliderValue.value)
}

// 搴曞浘鍒囨崲
function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

function switchBasemap(id) {
  currentBasemap.value = id
  showDropdown.value = false
  emit('basemap-change', id)
}

// 鍦板浘宸ュ叿
function zoomIn() {
  emit('zoom-in')
}

function zoomOut() {
  emit('zoom-out')
}

function resetView() {
  emit('reset-view')
}

function locateUser() {
  emit('locate')
}

function toggleMapMode() {
  emit('toggle-map-mode')
}

// 鐐瑰嚮澶栭儴鍏抽棴涓嬫媺
function handleClickOutside(e) {
  if (!e.target.closest('.basemap-switcher')) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  // 纭繚娓呯悊瀹氭椂鍣ㄥ苟閲嶇疆鐘舵€?
  if (playInterval) {
    clearInterval(playInterval)
    playInterval = null
  }
  isPlaying.value = false
})
</script>

<style scoped>
.bottom-controls-wrapper {
  position: fixed;
  left: 50%;
  bottom: 15px;
  transform: translateX(-50%);
  height: auto;
  display: flex;
  justify-content: center;
  z-index: 1600;
  pointer-events: none;
}

.bottom-controls {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: var(--bg-panel);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-normal);
  border-radius: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  pointer-events: auto;
}

/* 鎮诞鍙伴鍊掕鏃?- 绱у噾鍗曡 */
.countdown-floater {
  position: absolute;
  bottom: 65px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(185, 28, 28, 0.95));
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(239, 68, 68, 0.4), 0 0 40px rgba(239, 68, 68, 0.2);
  pointer-events: auto;
  animation: countdown-pulse 2s ease-in-out infinite;
}

@keyframes countdown-pulse {
  0%, 100% { box-shadow: 0 4px 20px rgba(239, 68, 68, 0.4), 0 0 40px rgba(239, 68, 68, 0.2); }
  50% { box-shadow: 0 4px 25px rgba(239, 68, 68, 0.6), 0 0 60px rgba(239, 68, 68, 0.3); }
}

.countdown-floater > i {
  font-size: 16px;
  color: #fff;
  animation: spin 4s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.countdown-name {
  font-size: 12px;
  font-weight: 700;
  color: #fff;
}

.countdown-sep {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
}

.countdown-loc {
  font-size: 13px;
  font-weight: 700;
  color: #FCD34D; /* 閲戦粍鑹?*/
  margin: 0 2px;
}

.countdown-time {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.5px;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.5s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* 鏃堕棿杞?*/
.timeline-compact {
  display: flex;
  align-items: center;
  gap: 6px;
}

.timeline-btn {
  width: 26px;
  height: 26px;
  font-size: 10px;
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-tertiary);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.timeline-btn:hover {
  background: var(--bg-hover);
  color: var(--accent-cyan);
}

.timeline-btn.play {
  background: var(--accent-cyan);
  color: #000;
  border-color: var(--accent-cyan);
}

.timeline-btn.playing {
  background: var(--alert-orange);
  border-color: var(--alert-orange);
}

.timeline-slider {
  width: 140px;
  padding: 0 4px;
}

.timeline-slider input[type="range"] {
  width: 100%;
  height: 3px;
  -webkit-appearance: none;
  background: var(--border-subtle);
  border-radius: 2px;
}

.timeline-slider input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 10px;
  height: 10px;
  background: var(--accent-cyan);
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s;
}

.timeline-slider input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.timeline-current {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-cyan);
  min-width: 90px;
  padding: 4px 8px;
  background: rgba(0, 229, 255, 0.1);
  border-radius: 12px;
  text-align: center;
}

/* 鍒嗛殧绾?*/
.divider {
  width: 1px;
  height: 20px;
  background: var(--border-subtle);
}

/* 搴曞浘鍒囨崲 */
.basemap-switcher {
  position: relative;
}

.basemap-btn {
  padding: 5px 10px;
  font-size: 11px;
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-tertiary);
  border-radius: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.basemap-btn:hover {
  border-color: var(--accent-cyan);
  color: var(--text-secondary);
}

.basemap-dropdown {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-panel);
  border: 1px solid var(--border-normal);
  border-radius: var(--border-radius);
  padding: 6px;
  margin-bottom: 6px;
  display: none;
  min-width: 100px;
}

.basemap-dropdown.show {
  display: block;
  animation: slideDown 0.2s ease-out;
}

.basemap-option {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 11px;
  color: var(--text-tertiary);
  transition: all var(--transition-fast);
}

.basemap-option:hover {
  background: var(--bg-hover);
}

.basemap-option.active {
  background: var(--bg-active);
  color: var(--accent-cyan);
}

/* 鍦板浘宸ュ叿 */
.map-tools-compact {
  display: flex;
  gap: 4px;
}

.tool-btn {
  width: 28px;
  height: 28px;
  font-size: 11px;
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-tertiary);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.tool-btn.tool-mode {
  width: auto;
  min-width: 42px;
  padding: 0 10px;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 700;
}

.tool-btn:hover {
  background: var(--accent-cyan);
  color: #000;
  border-color: var(--accent-cyan);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>

