<template>
  <div class="warning-ribbon">
    <div class="ribbon-title">
      <i class="fa-solid fa-tower-broadcast"></i>
      {{ title }}
    </div>
    <div class="ribbon-track">
      <button
        v-for="item in warningStations"
        :key="item.id"
        class="station-chip"
        :class="item.level"
        @click="$emit('station-click', item)"
      >
        <span class="name">{{ item.station }}</span>
        <span class="meta">{{ item.element }} · {{ item.levelText }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { mockDataAlerts } from '../../data/mockData'

const props = defineProps({
  title: {
    type: String,
    default: '风浪潮预警站点'
  },
  elementKeyword: {
    type: String,
    default: ''
  }
})

defineEmits(['station-click'])

const levelMap = {
  high: '红色',
  medium: '橙黄',
  low: '蓝色'
}

const warningStations = computed(() => {
  const keyword = props.elementKeyword.trim()
  return mockDataAlerts
    .filter(item => {
      if (item.type !== 'threshold_exceed') return false
      if (!keyword) return true
      return String(item.element || '').includes(keyword)
    })
    .slice(0, 8)
    .map(item => ({
      ...item,
      levelText: levelMap[item.level] || '关注'
    }))
})
</script>

<style scoped>
.warning-ribbon {
  position: absolute;
  left: 22%;
  right: 22%;
  bottom: 120px;
  z-index: 880;
  border-radius: 12px;
  border: 1px solid rgba(102, 152, 194, 0.4);
  background: linear-gradient(180deg, rgba(2, 12, 26, 0.92), rgba(5, 20, 41, 0.9));
  padding: 10px 12px;
  pointer-events: auto;
}
.ribbon-title {
  color: #8fd5ff;
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
}
.ribbon-track {
  margin-top: 8px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}
.station-chip {
  height: 44px;
  border-radius: 8px;
  border: 1px solid rgba(120, 156, 191, 0.28);
  background: rgba(255, 255, 255, 0.03);
  color: #e7f4ff;
  text-align: left;
  padding: 6px 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
}
.station-chip .name { font-size: 12px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.station-chip .meta { font-size: 11px; color: rgba(200, 220, 240, 0.72); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.station-chip.high { border-color: rgba(239, 68, 68, 0.5); }
.station-chip.medium { border-color: rgba(245, 158, 11, 0.5); }
.station-chip.low { border-color: rgba(59, 130, 246, 0.5); }
</style>
