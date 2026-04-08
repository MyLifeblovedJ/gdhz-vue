<template>
  <div class="timeline-controller">
    <div class="timeline-header">
      <span class="timeline-title">婕哗妯℃嫙鏃堕棿杞?/span>
      <span class="speed-control">
        閫熷害: 
        <select v-model="playSpeed" class="speed-select">
          <option value="0.5">0.5x</option>
          <option value="1">1x</option>
          <option value="2">2x</option>
          <option value="4">4x</option>
        </select>
      </span>
    </div>
    
    <div class="timeline-body">
      <!-- 鎾斁鎺у埗鎸夐挳 -->
      <div class="playback-controls">
        <button class="control-btn" @click="handleStepBackward" title="鍚庨€€涓€姝?>
          <i class="fa-solid fa-backward-step"></i>
        </button>
        <button class="control-btn play-btn" @click="togglePlay" :title="isPlaying ? '鏆傚仠' : '鎾斁'">
          <i :class="isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play'"></i>
        </button>
        <button class="control-btn" @click="handleStepForward" title="鍓嶈繘涓€姝?>
          <i class="fa-solid fa-forward-step"></i>
        </button>
      </div>

      <!-- 鏃堕棿杞存粦鍧?-->
      <div class="timeline-slider-container">
        <span class="time-label start">{{ formatTime(startTime) }}</span>
        <div class="slider-wrapper">
          <input
            type="range"
            class="timeline-slider"
            :min="0"
            :max="100"
            :value="sliderValue"
            @input="handleSliderChange"
          />
          <div class="slider-progress" :style="{ width: sliderValue + '%' }"></div>
          <div class="current-time-marker" :style="{ left: sliderValue + '%' }">
            <div class="marker-tooltip">{{ formatTime(currentTime) }}</div>
          </div>
        </div>
        <span class="time-label end">{{ formatTime(endTime) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'

const props = defineProps({
  startTime: {
    type: String,
    default: '2026-01-27 14:00'
  },
  endTime: {
    type: String,
    default: '2026-01-27 20:00'
  },
  currentTime: {
    type: String,
    default: '2026-01-27 14:00'
  }
})

const emit = defineEmits(['time-change', 'play', 'pause'])

const isPlaying = ref(false)
const playSpeed = ref('1')
let playInterval = null

// 璁＄畻婊戝潡鍊硷紙0-100锛?
const sliderValue = computed(() => {
  const start = new Date(props.startTime).getTime()
  const end = new Date(props.endTime).getTime()
  const current = new Date(props.currentTime).getTime()
  
  if (end <= start) return 0
  return Math.max(0, Math.min(100, ((current - start) / (end - start)) * 100))
})

function formatTime(datetime) {
  const time = datetime.split(' ')[1]
  return time || datetime
}

function togglePlay() {
  isPlaying.value = !isPlaying.value
  
  if (isPlaying.value) {
    emit('play')
    startPlayback()
  } else {
    emit('pause')
    stopPlayback()
  }
}

function startPlayback() {
  const intervalMs = 1000 / parseFloat(playSpeed.value)
  playInterval = setInterval(() => {
    // 妯℃嫙鏃堕棿鍓嶈繘30鍒嗛挓
    const current = new Date(props.currentTime)
    const end = new Date(props.endTime)
    
    current.setMinutes(current.getMinutes() + 30)
    
    if (current >= end) {
      // 鍒拌揪缁堢偣锛屽仠姝㈡挱鏀?
      isPlaying.value = false
      stopPlayback()
      emit('time-change', props.endTime)
    } else {
      const newTime = current.toISOString().slice(0, 16).replace('T', ' ')
      emit('time-change', newTime)
    }
  }, intervalMs)
}

function stopPlayback() {
  if (playInterval) {
    clearInterval(playInterval)
    playInterval = null
  }
}

function handleSliderChange(e) {
  const value = parseFloat(e.target.value)
  const start = new Date(props.startTime).getTime()
  const end = new Date(props.endTime).getTime()
  
  const newTime = new Date(start + (end - start) * (value / 100))
  const formattedTime = newTime.toISOString().slice(0, 16).replace('T', ' ')
  
  emit('time-change', formattedTime)
}

function handleStepBackward() {
  const current = new Date(props.currentTime)
  const start = new Date(props.startTime)
  
  current.setMinutes(current.getMinutes() - 30)
  
  if (current < start) {
    emit('time-change', props.startTime)
  } else {
    const newTime = current.toISOString().slice(0, 16).replace('T', ' ')
    emit('time-change', newTime)
  }
}

function handleStepForward() {
  const current = new Date(props.currentTime)
  const end = new Date(props.endTime)
  
  current.setMinutes(current.getMinutes() + 30)
  
  if (current > end) {
    emit('time-change', props.endTime)
  } else {
    const newTime = current.toISOString().slice(0, 16).replace('T', ' ')
    emit('time-change', newTime)
  }
}

// 閫熷害鍙樺寲鏃堕噸鏂板紑濮嬫挱鏀?
watch(playSpeed, () => {
  if (isPlaying.value) {
    stopPlayback()
    startPlayback()
  }
})

onUnmounted(() => {
  stopPlayback()
})
</script>

<style scoped>
.timeline-controller {
  position: absolute;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  max-width: calc(100% - 40px);
  background: var(--bg-panel);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-normal);
  border-radius: var(--border-radius);
  padding: 12px 16px;
  z-index: 1000;
  box-shadow: var(--shadow-panel);
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.timeline-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--accent-cyan);
}

.speed-control {
  font-size: 12px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
}

.speed-select {
  background: rgba(6, 12, 20, 0.35);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
}

.speed-select:focus {
  outline: none;
  border-color: var(--accent-cyan);
}

.timeline-body {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 鎾斁鎺у埗鎸夐挳 */
.playback-controls {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.control-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: rgba(6, 12, 20, 0.38);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.control-btn:hover {
  background: rgba(8, 16, 28, 0.56);
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
}

.control-btn.play-btn {
  width: 36px;
  height: 36px;
  background: rgba(79, 179, 216, 0.16);
  border-color: rgba(79, 179, 216, 0.42);
  color: #8fcbe3;
}

.control-btn.play-btn:hover {
  background: rgba(79, 179, 216, 0.25);
  border-color: #4fb3d8;
  color: #4fb3d8;
}

/* 鏃堕棿杞存粦鍧?*/
.timeline-slider-container {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.time-label {
  font-size: 12px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  white-space: nowrap;
}

.slider-wrapper {
  flex: 1;
  position: relative;
  height: 24px;
  display: flex;
  align-items: center;
}

.timeline-slider {
  width: 100%;
  height: 4px;
  background: rgba(94, 126, 160, 0.32);
  border-radius: 2px;
  appearance: none;
  cursor: pointer;
  position: relative;
  z-index: 2;
}

.timeline-slider::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #4fb3d8;
  border: 2px solid white;
  cursor: grab;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.timeline-slider::-webkit-slider-thumb:active {
  cursor: grabbing;
  transform: scale(1.1);
}

.slider-progress {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 4px;
  background: linear-gradient(90deg, #5a91d8, #4fb3d8);
  border-radius: 2px;
  pointer-events: none;
  z-index: 1;
}

.current-time-marker {
  position: absolute;
  top: -24px;
  transform: translateX(-50%);
  pointer-events: none;
}

.marker-tooltip {
  background: rgba(17, 38, 58, 0.95);
  border: 1px solid rgba(79, 179, 216, 0.45);
  color: white;
  font-size: 12px;
  font-family: var(--font-mono);
  padding: 3px 8px;
  border-radius: 4px;
  white-space: nowrap;
}

.marker-tooltip::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid rgba(17, 38, 58, 0.95);
}
</style>

