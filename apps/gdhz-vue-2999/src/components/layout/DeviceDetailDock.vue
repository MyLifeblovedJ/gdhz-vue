<template>
  <Transition name="dock-rise">
    <div v-if="device" class="device-detail-dock">
      <div class="dock-head">
        <div class="dock-title-wrap">
          <div class="dock-title">观测设备详情</div>
          <div class="dock-subtitle">{{ device.name }} · {{ device.typeName }}</div>
        </div>
        <button class="dock-close" type="button" @click="$emit('close')">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="dock-grid">
        <div class="metric-card">
          <span class="label">设备状态</span>
          <span class="value" :class="device.status">{{ statusLabel }}</span>
        </div>
        <div class="metric-card">
          <span class="label">当前读数</span>
          <span class="value">{{ device.val || '--' }}</span>
        </div>
        <div class="metric-card">
          <span class="label">经纬度</span>
          <span class="value">{{ coordText }}</span>
        </div>
        <div class="metric-card">
          <span class="label">最近更新</span>
          <span class="value">{{ updateText }}</span>
        </div>
      </div>

      <div class="trend-strip">
        <div v-for="(item, index) in trendItems" :key="index" class="trend-bar">
          <span class="trend-time">{{ item.time }}</span>
          <div class="bar-wrap">
            <div class="bar-fill" :style="{ width: `${item.level}%` }"></div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  device: {
    type: Object,
    default: null,
  },
})

defineEmits(['close'])

const statusTextMap = {
  online: '在线',
  warn: '预警',
  alarm: '告警',
  offline: '离线',
}

const statusLabel = computed(() => statusTextMap[props.device?.status] || '--')

const coordText = computed(() => {
  if (!props.device) return '--'
  return `${Number(props.device.lng).toFixed(2)}E / ${Number(props.device.lat).toFixed(2)}N`
})

const updateText = computed(() => {
  const raw = props.device?.lastUpdate
  if (!raw) return '--'
  return new Date(raw).toLocaleString('zh-CN', { hour12: false })
})

const trendItems = computed(() => {
  const base = props.device?.status === 'alarm' ? 88 : props.device?.status === 'warn' ? 70 : 45
  return [
    { time: 'T-3h', level: Math.max(base - 18, 8) },
    { time: 'T-2h', level: Math.max(base - 10, 12) },
    { time: 'T-1h', level: Math.max(base - 4, 16) },
    { time: '当前', level: base },
  ]
})
</script>

<style scoped>
.device-detail-dock {
  position: absolute;
  left: 386px;
  right: 386px;
  bottom: 72px;
  z-index: 910;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(9, 18, 34, 0.93), rgba(11, 25, 43, 0.91));
  border: 1px solid rgba(94, 146, 191, 0.36);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.36);
  padding: 10px 12px 12px;
  pointer-events: auto;
}

.dock-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.dock-title {
  font-size: 14px;
  font-weight: 700;
  color: #cce6ff;
}

.dock-subtitle {
  margin-top: 2px;
  font-size: 12px;
  color: rgba(206, 224, 242, 0.76);
}

.dock-close {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: #e6f0fa;
  background: rgba(255, 255, 255, 0.08);
}

.dock-grid {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.metric-card {
  border-radius: 8px;
  border: 1px solid rgba(125, 164, 200, 0.2);
  background: rgba(255, 255, 255, 0.03);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.metric-card .label {
  font-size: 11px;
  color: rgba(179, 205, 229, 0.68);
}

.metric-card .value {
  font-size: 13px;
  color: #edf5ff;
  font-weight: 600;
}

.metric-card .value.online { color: #53b07e; }
.metric-card .value.warn { color: #f59e0b; }
.metric-card .value.alarm { color: #ef4444; }
.metric-card .value.offline { color: #9ca3af; }

.trend-strip {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.trend-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.trend-time {
  min-width: 36px;
  font-size: 11px;
  color: rgba(186, 210, 231, 0.76);
}

.bar-wrap {
  flex: 1;
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #22d3ee, #60a5fa);
}

.dock-rise-enter-active,
.dock-rise-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.dock-rise-enter-from,
.dock-rise-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
