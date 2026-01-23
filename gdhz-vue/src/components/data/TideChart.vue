<template>
  <div class="tide-chart">
    <!-- 站点选择 -->
    <div class="chart-header">
      <select v-model="selectedStation" class="station-select">
        <option v-for="station in stations" :key="station.id" :value="station.id">
          {{ station.name }}
        </option>
      </select>
      <div class="chart-legend">
        <span class="legend-item observation"><span class="dot"></span>观测</span>
        <span class="legend-item prediction"><span class="dot"></span>预报</span>
      </div>
    </div>

    <!-- 曲线图 -->
    <div class="chart-container">
      <svg viewBox="0 0 300 120" class="chart-svg" preserveAspectRatio="xMidYMid meet">
        <!-- 网格线 -->
        <defs>
          <pattern id="grid" width="30" height="20" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/>
          </pattern>
        </defs>
        <rect width="300" height="120" fill="url(#grid)"/>
        
        <!-- 警戒线 -->
        <line x1="0" y1="25" x2="300" y2="25" stroke="#ef4444" stroke-width="1" stroke-dasharray="4,2" opacity="0.5"/>
        <text x="5" y="22" fill="#ef4444" font-size="8">警戒</text>

        <!-- 预报曲线 -->
        <path 
          :d="predictionPath" 
          fill="none" 
          stroke="#8b5cf6" 
          stroke-width="2"
          stroke-dasharray="4,2"
        />
        
        <!-- 观测曲线 -->
        <path 
          :d="observationPath" 
          fill="none" 
          stroke="#10b981" 
          stroke-width="2"
        />

        <!-- 当前时间指示线 -->
        <line :x1="currentTimeX" y1="0" :x2="currentTimeX" y2="120" stroke="#00ffff" stroke-width="1" stroke-dasharray="2,2"/>
        
        <!-- 数据点 -->
        <circle v-for="(point, idx) in observationPoints" :key="'obs-'+idx" 
          :cx="point.x" :cy="point.y" r="3" fill="#10b981"/>
      </svg>

      <!-- X轴时间标签 -->
      <div class="time-axis">
        <span v-for="(time, idx) in timeLabels" :key="idx" class="time-label">{{ time }}</span>
      </div>
    </div>

    <!-- 当前数据 -->
    <div class="current-values">
      <div class="value-item">
        <span class="value-label">当前观测</span>
        <span class="value-number observation">{{ currentObservation }}m</span>
      </div>
      <div class="value-item">
        <span class="value-label">预报值</span>
        <span class="value-number prediction">{{ currentPrediction }}m</span>
      </div>
      <div class="value-item">
        <span class="value-label">偏差</span>
        <span class="value-number" :class="deviationClass">{{ deviation }}m</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const selectedStation = ref('zhuhai')

const stations = [
  { id: 'zhuhai', name: '珠海香洲站' },
  { id: 'dawan', name: '大万山岛站' },
  { id: 'shenzhen', name: '深圳蛇口站' },
  { id: 'zhanjiang', name: '湛江港站' }
]

// 模拟数据 - 24小时
const observationData = [
  1.2, 1.5, 1.8, 2.1, 2.4, 2.6, 2.8, 2.9, 2.85, 2.7, 2.5, 2.2, 1.9, null, null, null
]

const predictionData = [
  1.2, 1.4, 1.7, 2.0, 2.3, 2.5, 2.8, 3.0, 2.95, 2.8, 2.6, 2.3, 2.0, 1.7, 1.4, 1.2
]

const timeLabels = ['00:00', '06:00', '12:00', '18:00', '24:00']

// 当前值
const currentObservation = computed(() => {
  const lastValid = observationData.filter(v => v !== null).pop()
  return lastValid?.toFixed(2) || '--'
})

const currentPrediction = computed(() => {
  return predictionData[12]?.toFixed(2) || '--'
})

const deviation = computed(() => {
  const obs = parseFloat(currentObservation.value)
  const pred = parseFloat(currentPrediction.value)
  if (isNaN(obs) || isNaN(pred)) return '--'
  const diff = obs - pred
  return (diff > 0 ? '+' : '') + diff.toFixed(2)
})

const deviationClass = computed(() => {
  const dev = parseFloat(deviation.value)
  if (isNaN(dev)) return ''
  return Math.abs(dev) > 0.3 ? 'warn' : 'normal'
})

// SVG路径生成
const chartWidth = 300
const chartHeight = 120
const dataLength = predictionData.length

function dataToPath(data) {
  const points = data.map((val, idx) => {
    if (val === null) return null
    const x = (idx / (dataLength - 1)) * chartWidth
    const y = chartHeight - ((val / 3.5) * chartHeight)
    return { x, y }
  }).filter(p => p !== null)
  
  if (points.length === 0) return ''
  
  return points.map((p, i) => 
    (i === 0 ? 'M' : 'L') + `${p.x},${p.y}`
  ).join(' ')
}

const observationPath = computed(() => dataToPath(observationData))
const predictionPath = computed(() => dataToPath(predictionData))

const observationPoints = computed(() => {
  return observationData.map((val, idx) => {
    if (val === null) return null
    return {
      x: (idx / (dataLength - 1)) * chartWidth,
      y: chartHeight - ((val / 3.5) * chartHeight)
    }
  }).filter(p => p !== null)
})

// 当前时间线位置（假设现在是12:00）
const currentTimeX = computed(() => (12 / 24) * chartWidth)
</script>

<style scoped>
.tide-chart {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.station-select {
  padding: 6px 10px;
  font-size: 11px;
  background: rgba(30, 40, 60, 0.6);
  border: 1px solid var(--border-normal);
  border-radius: 4px;
  color: var(--text-primary);
  cursor: pointer;
}

.station-select:focus {
  outline: none;
  border-color: var(--accent-cyan);
}

.chart-legend {
  display: flex;
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: var(--text-muted);
}

.legend-item .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-item.observation .dot {
  background: #10b981;
}

.legend-item.prediction .dot {
  background: #8b5cf6;
}

.chart-container {
  background: rgba(30, 40, 60, 0.4);
  border-radius: 6px;
  padding: 10px;
}

.chart-svg {
  width: 100%;
  height: 100px;
}

.time-axis {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  padding: 0 5px;
}

.time-label {
  font-size: 9px;
  color: var(--text-muted);
}

.current-values {
  display: flex;
  gap: 8px;
}

.value-item {
  flex: 1;
  padding: 8px;
  background: rgba(30, 40, 60, 0.4);
  border-radius: 6px;
  text-align: center;
}

.value-label {
  display: block;
  font-size: 9px;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.value-number {
  font-size: 14px;
  font-weight: 700;
  font-family: var(--font-display);
}

.value-number.observation {
  color: #10b981;
}

.value-number.prediction {
  color: #8b5cf6;
}

.value-number.normal {
  color: var(--text-secondary);
}

.value-number.warn {
  color: #f59e0b;
}
</style>
