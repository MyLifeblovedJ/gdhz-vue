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
  border: 1px solid rgba(14, 116, 144, 0.18);
  background: rgba(220, 238, 248, 0.65);
  padding: 10px;
  color: #1a3a5c;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
}
.wave-card.active {
  border-color: rgba(8, 145, 178, 0.55);
  box-shadow: 0 0 0 1px rgba(8, 145, 178, 0.18);
}
.card-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.name { font-size: 14px; font-weight: 700; }
.badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid transparent;
}
.badge.red { color: #dc2626; background: rgba(220, 38, 38, 0.12); border-color: rgba(220, 38, 38, 0.35); }
.badge.orange { color: #ea580c; background: rgba(249, 115, 22, 0.12); border-color: rgba(249, 115, 22, 0.35); }
.badge.yellow { color: #ca8a04; background: rgba(234, 179, 8, 0.12); border-color: rgba(234, 179, 8, 0.35); }
.badge.blue { color: #2563eb; background: rgba(59, 130, 246, 0.12); border-color: rgba(59, 130, 246, 0.35); }
.value-row { display: flex; justify-content: space-between; align-items: baseline; }
.main { font-size: 24px; font-weight: 800; line-height: 1; }
.main em { font-size: 12px; font-style: normal; opacity: 0.72; margin-left: 2px; }
.sub { font-size: 12px; color: rgba(26, 58, 92, 0.6); }
.meta-row { display: flex; justify-content: space-between; font-size: 12px; color: rgba(26, 58, 92, 0.55); }
</style>
