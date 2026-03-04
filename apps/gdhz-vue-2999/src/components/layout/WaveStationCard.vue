<template>
  <button class="wave-card" :class="[levelClass, { active }]" @click="$emit('select', station)">
    <div class="card-top">
      <span class="name">{{ station.name }}</span>
      <span class="badge" :class="station.warningColor">{{ levelText }}</span>
    </div>
    <div class="value-row">
      <span class="main">{{ station.currentHeight.toFixed(1) }}<em>m</em></span>
      <span class="sub">警戒 {{ station.warningLevel.toFixed(1) }}m</span>
    </div>
    <div class="meta-row">
      <span>越界 {{ deviationText }}</span>
      <span>峰值 {{ station.maxHeight.toFixed(1) }}m @ {{ station.time }}</span>
    </div>
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  station: { type: Object, required: true },
  active: { type: Boolean, default: false },
})

defineEmits(['select'])

const levelLabel = {
  red: '红',
  orange: '橙',
  yellow: '黄',
  blue: '蓝',
}

const levelText = computed(() => `${levelLabel[props.station.warningColor] || ''}预警`)
const levelClass = computed(() => `level-${props.station.warningColor || 'blue'}`)
const deviationText = computed(() => {
  const diff = (props.station.currentHeight || 0) - (props.station.warningLevel || 0)
  const sign = diff >= 0 ? '+' : ''
  return `${sign}${diff.toFixed(1)}m`
})
</script>

<style scoped>
.wave-card {
  min-width: 280px;
  height: 112px;
  border-radius: 10px;
  border: 1px solid rgba(120, 160, 196, 0.32);
  background: rgba(255, 255, 255, 0.03);
  padding: 10px;
  color: #e6f4ff;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
}
.wave-card.active {
  border-color: rgba(95, 198, 255, 0.78);
  box-shadow: 0 0 0 1px rgba(95, 198, 255, 0.24);
}
.card-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.name { font-size: 14px; font-weight: 700; }
.badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid transparent;
}
.badge.red { color: #fecaca; background: rgba(220, 38, 38, 0.24); border-color: rgba(220, 38, 38, 0.5); }
.badge.orange { color: #fed7aa; background: rgba(249, 115, 22, 0.24); border-color: rgba(249, 115, 22, 0.5); }
.badge.yellow { color: #fef08a; background: rgba(234, 179, 8, 0.24); border-color: rgba(234, 179, 8, 0.5); }
.badge.blue { color: #bfdbfe; background: rgba(59, 130, 246, 0.24); border-color: rgba(59, 130, 246, 0.5); }
.value-row { display: flex; justify-content: space-between; align-items: baseline; }
.main { font-size: 24px; font-weight: 800; line-height: 1; }
.main em { font-size: 12px; font-style: normal; opacity: 0.72; margin-left: 2px; }
.sub { font-size: 12px; color: rgba(194, 215, 234, 0.78); }
.meta-row { display: flex; justify-content: space-between; font-size: 12px; color: rgba(191, 212, 232, 0.82); }
</style>
