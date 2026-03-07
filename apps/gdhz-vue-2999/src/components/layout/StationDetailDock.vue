<template>
  <div class="station-detail-dock" v-if="station">
    <div class="head">
      <div class="title">站点详细数据</div>
      <div class="name">{{ station.station }} · {{ station.element }}</div>
    </div>
    <div class="content">
      <div class="metric">
        <span class="label">告警级别</span>
        <span class="value" :class="station.level">{{ levelText }}</span>
      </div>
      <div class="metric">
        <span class="label">告警说明</span>
        <span class="value ellipsis">{{ station.message }}</span>
      </div>
      <div class="metric">
        <span class="label">触发时间</span>
        <span class="value">{{ formatTime(station.time) }}</span>
      </div>
      <div class="metric" v-if="station.value !== undefined">
        <span class="label">当前值</span>
        <span class="value">{{ station.value }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  station: {
    type: Object,
    default: null,
  },
})

const levelMap = {
  high: '红色预警',
  medium: '橙黄预警',
  low: '蓝色预警',
}

const levelText = computed(() => levelMap[props.station?.level] || '关注')

function formatTime(raw) {
  if (!raw) return '--'
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return raw
  return d.toLocaleString('zh-CN', { hour12: false })
}
</script>

<style scoped>
.station-detail-dock {
  position: absolute;
  left: 22%;
  right: 22%;
  bottom: 58px;
  z-index: 881;
  border-radius: 12px;
  border: 1px solid rgba(14, 116, 144, 0.18);
  background: rgba(225, 240, 252, 0.78);
  backdrop-filter: blur(16px) saturate(1.2);
  -webkit-backdrop-filter: blur(16px) saturate(1.2);
  padding: 10px 12px;
  pointer-events: auto;
}
.head { display: flex; align-items: baseline; gap: 10px; }
.title { font-size: 13px; font-weight: 700; color: #0e7490; }
.name { font-size: 12px; color: rgba(26, 58, 92, 0.65); }
.content {
  margin-top: 6px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}
.metric {
  border-radius: 8px;
  border: 1px solid rgba(14, 116, 144, 0.12);
  background: rgba(220, 238, 248, 0.65);
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.label { font-size: 11px; color: rgba(26, 58, 92, 0.55); }
.value { font-size: 13px; color: #1a3a5c; font-weight: 700; }
.value.high { color: #ef4444; }
.value.medium { color: #f59e0b; }
.value.low { color: #60a5fa; }
.ellipsis { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
