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
  border: 1px solid rgba(118, 161, 195, 0.4);
  background: linear-gradient(180deg, rgba(2, 13, 28, 0.92), rgba(7, 20, 38, 0.9));
  padding: 10px 12px;
  pointer-events: auto;
}
.head { display: flex; align-items: baseline; gap: 10px; }
.title { font-size: 13px; font-weight: 700; color: #95d7ff; }
.name { font-size: 12px; color: rgba(201, 224, 243, 0.82); }
.content {
  margin-top: 6px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}
.metric {
  border-radius: 8px;
  border: 1px solid rgba(111, 156, 191, 0.25);
  background: rgba(255, 255, 255, 0.03);
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.label { font-size: 11px; color: rgba(177, 207, 233, 0.72); }
.value { font-size: 13px; color: #e8f4ff; font-weight: 700; }
.value.high { color: #ef4444; }
.value.medium { color: #f59e0b; }
.value.low { color: #60a5fa; }
.ellipsis { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
