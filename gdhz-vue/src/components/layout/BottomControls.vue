<template>
  <div class="bottom-controls-wrapper">


    <div class="bottom-controls">
      <!-- 时间轴 -->
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

      <!-- 底图切换 -->
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

      <!-- 地图工具 -->
      <div class="map-tools-compact">
        <button class="tool-btn" @click="zoomIn" title="放大">
          <i class="fa-solid fa-plus"></i>
        </button>
        <button class="tool-btn" @click="zoomOut" title="缩小">
          <i class="fa-solid fa-minus"></i>
        </button>
        <button class="tool-btn" @click="resetView" title="复位">
          <i class="fa-solid fa-house"></i>
        </button>
        <button class="tool-btn" @click="locateUser" title="定位">
          <i class="fa-solid fa-crosshairs"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '../../stores/app'
import { basemaps } from '../../data/mockData'

const emit = defineEmits(['zoom-in', 'zoom-out', 'reset-view', 'locate', 'basemap-change', 'timeline-change'])

const store = useAppStore()

// 状态
const sliderValue = ref(24)
const isPlaying = ref(false)
const showDropdown = ref(false)
const currentBasemap = ref('dark')
let playInterval = null



// 计算属性
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

// 时间轴方法
function timelineStep(direction) {
  sliderValue.value = Math.max(0, Math.min(72, parseInt(sliderValue.value) + direction * 3))
  emit('timeline-change', sliderValue.value)
}

function togglePlay() {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    playInterval = setInterval(() => timelineStep(1), 1000)
  } else {
    clearInterval(playInterval)
  }
}

function updateTimelineValue() {
  emit('timeline-change', sliderValue.value)
}

// 底图切换
function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

function switchBasemap(id) {
  currentBasemap.value = id
  showDropdown.value = false
  emit('basemap-change', id)
}

// 地图工具
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

// 点击外部关闭下拉
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
  if (playInterval) clearInterval(playInterval)
})
</script>

<style scoped>
.bottom-controls-wrapper {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 0; /* 不占用空间 */
  display: flex;
  justify-content: center;
  z-index: 1000;
  pointer-events: none;
}

.bottom-controls {
  position: absolute;
  bottom: 15px;
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

/* 悬浮台风倒计时 - 紧凑单行 */
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
  color: #FCD34D; /* 金黄色 */
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

/* 时间轴 */
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

/* 分隔线 */
.divider {
  width: 1px;
  height: 20px;
  background: var(--border-subtle);
}

/* 底图切换 */
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

/* 地图工具 */
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
