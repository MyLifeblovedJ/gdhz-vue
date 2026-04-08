<template>
  <div class="time-range-shell">
    <div class="quick-range-row">
      <button
        v-for="option in quickOptions"
        :key="option.value"
        class="quick-btn"
        :class="{ active: selectedRange === option.value }"
        @click="selectQuickRange(option.value)"
      >
        {{ option.label }}
      </button>

      <template v-if="selectedRange === 'custom'">
        <input
          type="datetime-local"
          class="date-input"
          v-model="customStart"
          @change="handleCustomChange"
        >
        <span class="date-sep">–</span>
        <input
          type="datetime-local"
          class="date-input"
          v-model="customEnd"
          @change="handleCustomChange"
        >
        <button class="apply-btn" @click="applyCustomRange">
          <i class="fa-solid fa-check"></i>
        </button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      start: new Date(Date.now() - 24 * 3600000),
      end: new Date(),
    }),
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

const quickOptions = [
  { label: '实时', value: 'realtime' },
  { label: '今日', value: 'today' },
  { label: '近7天', value: '7d' },
  { label: '近30天', value: '30d' },
  { label: '自定义', value: 'custom' },
]

const selectedRange = ref('realtime')
const customStart = ref('')
const customEnd = ref('')
const rangeStart = ref(new Date(Date.now() - 24 * 3600000))
const rangeEnd = ref(new Date())

const startHandlePos = ref(0)
const endHandlePos = ref(100)
const isDragging = ref(false)
const dragType = ref(null)
const timelineRef = ref(null)

const rangeStyle = computed(() => ({
  left: startHandlePos.value + '%',
  width: (endHandlePos.value - startHandlePos.value) + '%',
}))

function syncFromModel(value) {
  const start = value?.start ? new Date(value.start) : new Date(Date.now() - 24 * 3600000)
  const end = value?.end ? new Date(value.end) : new Date()

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return
  }

  rangeStart.value = start
  rangeEnd.value = end
  customStart.value = formatForInput(start)
  customEnd.value = formatForInput(end)
}

function selectQuickRange(range) {
  selectedRange.value = range
  const now = new Date()

  switch (range) {
    case 'realtime':
      rangeStart.value = new Date(Date.now() - 2 * 3600000)
      rangeEnd.value = new Date()
      break
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
  // 保留现有交互入口
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

function startDrag(event) {
  if (!timelineRef.value) return
  const rect = timelineRef.value.getBoundingClientRect()
  const pos = ((event.clientX - rect.left) / rect.width) * 100
  const midpoint = (startHandlePos.value + endHandlePos.value) / 2
  startHandleDrag(pos <= midpoint ? 'start' : 'end')
}

function startHandleDrag(type) {
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

  const nextStart = Math.max(0, startHandlePos.value + delta)
  const nextEnd = Math.min(100, endHandlePos.value - delta)

  if (nextEnd - nextStart >= 10) {
    startHandlePos.value = nextStart
    endHandlePos.value = nextEnd
    updateRangeFromHandles()
    emitChange()
  }
}

function updateRangeFromHandles() {
  // 保留现有逻辑接口，当前仅用于时间窗口视觉提示
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
    minute: '2-digit',
  })
}

function formatForInput(date) {
  return date.toISOString().slice(0, 16)
}

onMounted(() => {
  syncFromModel(props.modelValue)
})

watch(
  () => props.modelValue,
  (value) => {
    syncFromModel(value)
  },
  { deep: true }
)

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
})
</script>

<style scoped>
.time-range-shell {
  width: 100%;
}

.quick-range-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.quick-btn {
  min-width: 64px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 10px;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;
}

.quick-btn:hover {
  border-color: rgba(14, 165, 233, 0.3);
  color: #0369a1;
  background: rgba(240, 249, 255, 0.96);
}

.quick-btn.active {
  background: rgba(14, 165, 233, 0.1);
  border-color: rgba(14, 165, 233, 0.28);
  color: #075985;
}


.date-input {
  flex: 1;
  min-width: 0;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  color: #0f172a;
  padding: 5px 6px;
  font-size: 11px;
  font-weight: 600;
  transition: border-color 0.18s ease;
}

.date-input:focus {
  outline: none;
  border-color: rgba(14, 165, 233, 0.42);
}

.date-sep {
  color: #94a3b8;
  font-size: 12px;
  flex-shrink: 0;
}

.apply-btn {
  padding: 5px 10px;
  background: #0284c7;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.18s ease;
}

.apply-btn:hover {
  background: #0369a1;
}

</style>
