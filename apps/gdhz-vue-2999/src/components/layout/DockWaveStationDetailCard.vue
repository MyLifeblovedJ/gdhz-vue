<template>
  <div class="dock-wave-card" :class="`warning-${station.warningColor}`">
    <div class="prediction-grid">
      <div class="pred-item station">
        <i class="fa-solid fa-location-dot"></i>
        <div class="pred-info">
          <span class="pred-label">监测站点</span>
          <span class="pred-value">{{ station.name }}</span>
        </div>
      </div>
      <div class="pred-item time">
        <i class="fa-solid fa-clock"></i>
        <div class="pred-info">
          <span class="pred-label">预测达峰</span>
          <span class="pred-value">今日 {{ station.time }}</span>
        </div>
      </div>
    </div>

    <div class="pred-item tide-peak wave-type" :class="`border-${station.warningColor}`">
      <i class="fa-solid fa-wind"></i>
      <div class="pred-info">
        <span class="pred-label">预测最大浪高</span>
        <span class="pred-value large">{{ station.maxHeight }}m</span>
      </div>
      <div class="pred-extra">
        <span class="color-badge" :class="station.warningColor">{{ warningText }}</span>
        <span class="over-text">波向 <strong>{{ station.direction || '--' }}</strong></span>
      </div>
    </div>

    <div class="observed-row">
      <div class="obs-item">
        <i class="fa-solid fa-chart-line"></i>
        <span class="obs-label">实测浪高</span>
        <span class="obs-value">{{ station.currentHeight }}m</span>
      </div>
      <div class="obs-item">
        <i class="fa-solid fa-clock"></i>
        <span class="obs-label">实测时间</span>
        <span class="obs-value">{{ station.observedTime }}</span>
      </div>
      <div class="obs-item" v-if="station.forecastWarning && station.observedWarning">
        <span class="dual-badge">预报+实测超警</span>
      </div>
      <div class="obs-item" v-else-if="station.observedWarning">
        <span class="obs-badge">实测超警</span>
      </div>
      <div class="obs-item" v-else>
        <span class="forecast-badge">预报超警</span>
      </div>
    </div>

    <div class="sparkline-row" v-if="station.trendData">
      <svg class="sparkline-svg" viewBox="0 0 200 36" preserveAspectRatio="none">
        <line
          v-if="warningLineY !== null"
          x1="0"
          :y1="warningLineY"
          x2="200"
          :y2="warningLineY"
          class="sparkline-warning"
        />
        <polyline :points="sparklinePoints" class="sparkline-line" :class="`sparkline-${station.warningColor}`" />
      </svg>
      <span class="sparkline-hint">24h趋势</span>
    </div>

    <div class="detail-trend">
      <div class="trend-bars">
        <span
          v-for="(value, idx) in trendBars"
          :key="idx"
          class="trend-bar"
          :style="{ height: `${value}px` }"
        ></span>
      </div>
      <div class="card-chart-tags">
        <div class="mini-tag peak"><i class="fa-solid fa-arrow-trend-up"></i><span>峰值 {{ station.maxHeight }}m</span></div>
        <div class="mini-tag warning"><i class="fa-solid fa-triangle-exclamation"></i><span>警戒 {{ station.warningLevel }}m</span></div>
        <div class="mini-tag direction" v-if="station.direction"><i class="fa-solid fa-compass"></i><span>波向 {{ station.direction }}</span></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  station: {
    type: Object,
    required: true,
  },
})

const warningMap = {
  red: '红色',
  orange: '橙色',
  yellow: '黄色',
  blue: '蓝色',
}

const warningText = computed(() => warningMap[props.station.warningColor] || '蓝色')

const sparklinePoints = computed(() => {
  const data = props.station.trendData || []
  if (!data.length) return ''
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  return data
    .map((value, index) => {
      const x = (index / (data.length - 1 || 1)) * 200
      const y = 34 - ((value - min) / range) * 30
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
})

const warningLineY = computed(() => {
  const data = props.station.trendData || []
  const warning = Number(props.station.warningLevel)
  if (!data.length || !Number.isFinite(warning)) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  if (warning < min || warning > max) return null
  const range = max - min || 1
  return 34 - ((warning - min) / range) * 30
})

const trendBars = computed(() => {
  const data = (props.station.trendData || []).slice(-12)
  if (!data.length) return []
  const max = Math.max(...data)
  return data.map(value => Math.max(8, Math.round((value / max) * 50)))
})
</script>

<style scoped>
.dock-wave-card {
  min-width: 460px;
  max-width: 460px;
  border-radius: 10px;
  border: 1px solid rgba(111, 150, 184, 0.38);
  background: rgba(7, 20, 38, 0.82);
  overflow: hidden;
}
.prediction-grid { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid rgba(111, 150, 184, 0.2); }
.pred-item { display: flex; align-items: center; gap: 8px; padding: 8px 10px; }
.pred-item.station { border-right: 1px solid rgba(111, 150, 184, 0.2); }
.pred-item i { color: #60a5fa; }
.pred-label { font-size: 11px; color: rgba(191, 215, 237, 0.7); }
.pred-value { font-size: 12px; color: #e6f3ff; font-weight: 600; }
.tide-peak { display: flex; align-items: center; gap: 8px; padding: 10px; border-bottom: 1px solid rgba(111, 150, 184, 0.2); }
.pred-value.large { font-size: 22px; font-weight: 800; }
.pred-extra { margin-left: auto; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.color-badge { font-size: 11px; padding: 2px 6px; border-radius: 999px; border: 1px solid; }
.color-badge.red { color: #fecaca; background: rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.4); }
.color-badge.orange { color: #fed7aa; background: rgba(249, 115, 22, 0.2); border-color: rgba(249, 115, 22, 0.4); }
.color-badge.yellow { color: #fef08a; background: rgba(234, 179, 8, 0.2); border-color: rgba(234, 179, 8, 0.4); }
.color-badge.blue { color: #bfdbfe; background: rgba(59, 130, 246, 0.2); border-color: rgba(59, 130, 246, 0.4); }
.over-text { font-size: 12px; color: rgba(191, 214, 234, 0.82); }
.over-text strong { color: #93c5fd; }
.observed-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 8px 10px; border-bottom: 1px solid rgba(111, 150, 184, 0.2); }
.obs-item { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; }
.obs-label { color: rgba(183, 211, 236, 0.7); }
.obs-value { color: #e8f4ff; font-weight: 700; }
.dual-badge, .obs-badge, .forecast-badge { font-size: 11px; padding: 2px 6px; border-radius: 999px; border: 1px solid; }
.dual-badge { color: #fecaca; background: rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.4); }
.obs-badge { color: #fed7aa; background: rgba(249, 115, 22, 0.2); border-color: rgba(249, 115, 22, 0.4); }
.forecast-badge { color: #bfdbfe; background: rgba(59, 130, 246, 0.2); border-color: rgba(59, 130, 246, 0.4); }
.sparkline-row { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-bottom: 1px solid rgba(111, 150, 184, 0.2); }
.sparkline-svg { flex: 1; height: 36px; }
.sparkline-line { fill: none; stroke-width: 1.5; }
.sparkline-red { stroke: #ef4444; }
.sparkline-orange { stroke: #f97316; }
.sparkline-yellow { stroke: #eab308; }
.sparkline-blue { stroke: #60a5fa; }
.sparkline-warning { stroke: rgba(239, 68, 68, 0.4); stroke-width: 1; stroke-dasharray: 4 3; }
.sparkline-hint { font-size: 11px; color: rgba(186, 210, 231, 0.7); }
.detail-trend { padding: 8px 10px; }
.trend-bars { height: 52px; display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 4px; align-items: end; }
.trend-bar { border-radius: 3px 3px 0 0; background: linear-gradient(180deg, #7dd3fc, #2563eb); }
.card-chart-tags { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px; }
.mini-tag { font-size: 11px; border-radius: 999px; padding: 2px 8px; display: inline-flex; align-items: center; gap: 4px; }
.mini-tag.peak { color: #fca5a5; background: rgba(239, 68, 68, 0.2); }
.mini-tag.warning { color: #fcd34d; background: rgba(234, 179, 8, 0.2); }
.mini-tag.direction { color: #93c5fd; background: rgba(59, 130, 246, 0.2); }
</style>
