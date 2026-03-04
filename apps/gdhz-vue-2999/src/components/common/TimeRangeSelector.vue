<template>
  <div class="time-range-selector">
    <!-- 快捷按钮 -->
    <div class="quick-buttons">
      <button 
        v-for="option in quickOptions" 
        :key="option.value"
        class="quick-btn"
        :class="{ active: selectedRange === option.value }"
        @click="selectQuickRange(option.value)"
      >
        {{ option.label }}
      </button>
    </div>
    
    <!-- 自定义日期范围 -->
    <div class="custom-range" v-if="selectedRange === 'custom'">
      <div class="date-input-group">
        <label>开始时间</label>
        <input 
          type="datetime-local" 
          v-model="customStart"
          @change="handleCustomChange"
        >
      </div>
      <div class="date-input-group">
        <label>结束时间</label>
        <input 
          type="datetime-local" 
          v-model="customEnd"
          @change="handleCustomChange"
        >
      </div>
      <button class="apply-btn" @click="applyCustomRange">
        <i class="fa-solid fa-check"></i>
        应用
      </button>
    </div>
    
    <!-- 时间轴 -->
    <div class="timeline-container" ref="timelineRef">
      <div 
        class="timeline-track"
        @mousedown="startDrag"
        @wheel="handleWheel"
      >
        <div class="timeline-range" :style="rangeStyle"></div>
        <div 
          class="timeline-handle start" 
          :style="{ left: startHandlePos + '%' }"
          @mousedown.stop="startHandleDrag('start', $event)"
        ></div>
        <div 
          class="timeline-handle end" 
          :style="{ left: endHandlePos + '%' }"
          @mousedown.stop="startHandleDrag('end', $event)"
        ></div>
      </div>
      <div class="timeline-labels">
        <span>{{ formatDate(rangeStart) }}</span>
        <span>{{ formatDate(rangeEnd) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      start: new Date(Date.now() - 24 * 3600000),
      end: new Date(),
    })
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const quickOptions = [
  { label: '今日', value: 'today' },
  { label: '近7天', value: '7d' },
  { label: '近30天', value: '30d' },
  { label: '自定义', value: 'custom' },
]

const selectedRange = ref('today')
const customStart = ref('')
const customEnd = ref('')
const rangeStart = ref(new Date(Date.now() - 24 * 3600000))
const rangeEnd = ref(new Date())

// 时间轴拖拽
const startHandlePos = ref(0)
const endHandlePos = ref(100)
const isDragging = ref(false)
const dragType = ref(null)
const timelineRef = ref(null)

const rangeStyle = computed(() => ({
  left: startHandlePos.value + '%',
  width: (endHandlePos.value - startHandlePos.value) + '%',
}))

function selectQuickRange(range) {
  selectedRange.value = range
  const now = new Date()
  
  switch (range) {
    case 'today':
      rangeStart.value = new Date(now.setHours(0, 0, 0, 0))
      rangeEnd.value = new Date()
      break
    case '7d':
      rangeStart.value = new Date(Date.now() - 7 * 24 * 3600000)
      rangeEnd.value = new Date()
      break
    case '30d':
      rangeStart.value = new Date(Date.now() - 30 * 24 * 3600000)
      rangeEnd.value = new Date()
      break
    case 'custom':
      customStart.value = formatForInput(rangeStart.value)
      customEnd.value = formatForInput(rangeEnd.value)
      return
  }
  
  emitChange()
  resetHandles()
}

function handleCustomChange() {
  // 验证输入
}

function applyCustomRange() {
  if (customStart.value && customEnd.value) {
    rangeStart.value = new Date(customStart.value)
    rangeEnd.value = new Date(customEnd.value)
    emitChange()
    resetHandles()
  }
}

function resetHandles() {
  startHandlePos.value = 0
  endHandlePos.value = 100
}

function startHandleDrag(type, event) {
  isDragging.value = true
  dragType.value = type
  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', stopDrag)
}

function handleDrag(event) {
  if (!isDragging.value || !timelineRef.value) return
  
  const rect = timelineRef.value.getBoundingClientRect()
  let pos = ((event.clientX - rect.left) / rect.width) * 100
  pos = Math.max(0, Math.min(100, pos))
  
  if (dragType.value === 'start') {
    startHandlePos.value = Math.min(pos, endHandlePos.value - 5)
  } else {
    endHandlePos.value = Math.max(pos, startHandlePos.value + 5)
  }
  
  updateRangeFromHandles()
}

function stopDrag() {
  isDragging.value = false
  dragType.value = null
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
  emitChange()
}

function handleWheel(event) {
  event.preventDefault()
  const delta = event.deltaY > 0 ? 5 : -5
  
  // 缩放时间轴
  const newStart = Math.max(0, startHandlePos.value + delta)
  const newEnd = Math.min(100, endHandlePos.value - delta)
  
  if (newEnd - newStart >= 10) {
    startHandlePos.value = newStart
    endHandlePos.value = newEnd
    updateRangeFromHandles()
    emitChange()
  }
}

function updateRangeFromHandles() {
  const totalRange = rangeEnd.value - rangeStart.value
  const fullStart = rangeStart.value.getTime()
  
  // 根据手柄位置计算实际时间范围
  // 这里简化处理，实际应用中需要更复杂的逻辑
}

function emitChange() {
  const value = { start: rangeStart.value, end: rangeEnd.value }
  emit('update:modelValue', value)
  emit('change', value)
}

function formatDate(date) {
  return date.toLocaleString('zh-CN', { 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatForInput(date) {
  return date.toISOString().slice(0, 16)
}

onMounted(() => {
  selectQuickRange('today')
})
</script>

<style scoped>
.time-range-selector {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quick-buttons {
  display: flex;
  gap: 6px;
}

.quick-btn {
  flex: 1;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-btn:hover {
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
}

.quick-btn.active {
  background: rgba(0, 180, 230, 0.2);
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
}

.custom-range {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.date-input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 140px;
}

.date-input-group label {
  font-size: 10px;
  color: var(--text-muted);
}

.date-input-group input {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  color: var(--text-primary);
  padding: 6px 8px;
  font-size: 11px;
}

.date-input-group input:focus {
  outline: none;
  border-color: var(--accent-cyan);
}

.apply-btn {
  padding: 6px 12px;
  background: var(--accent-cyan);
  border: none;
  border-radius: 4px;
  color: var(--bg-deepest);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.apply-btn:hover {
  filter: brightness(1.1);
}

.timeline-container {
  padding: 5px 0;
}

.timeline-track {
  position: relative;
  height: 20px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 10px;
  cursor: pointer;
}

.timeline-range {
  position: absolute;
  top: 4px;
  height: 12px;
  background: linear-gradient(90deg, rgba(0, 180, 230, 0.5), rgba(0, 180, 230, 0.8));
  border-radius: 6px;
}

.timeline-handle {
  position: absolute;
  top: 0;
  width: 16px;
  height: 20px;
  background: var(--accent-cyan);
  border-radius: 4px;
  transform: translateX(-50%);
  cursor: ew-resize;
  transition: transform 0.1s;
}

.timeline-handle:hover {
  transform: translateX(-50%) scale(1.1);
}

.timeline-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 9px;
  color: var(--text-muted);
}
</style>
