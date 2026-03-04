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
      <svg viewBox="0 0 340 140" class="chart-svg" preserveAspectRatio="xMidYMid meet">
        <!-- 定义渐变和滤镜 -->
        <defs>
          <!-- 网格 -->
          <pattern id="grid" width="30" height="20" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>
          </pattern>

          <!-- 观测曲线渐变 -->
          <linearGradient id="observationGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
          </linearGradient>

          <!-- 预报曲线渐变 -->
          <linearGradient id="predictionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:1" />
          </linearGradient>

          <!-- 观测区域渐变填充 -->
          <linearGradient id="observationAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#10b981;stop-opacity:0.15" />
            <stop offset="100%" style="stop-color:#10b981;stop-opacity:0.02" />
          </linearGradient>

          <!-- 预报区域渐变填充 -->
          <linearGradient id="predictionAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:0.12" />
            <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:0.02" />
          </linearGradient>

          <!-- 发光效果 -->
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <!-- 背景网格 -->
        <rect :x="margin.left" :y="margin.top" :width="chartWidth" :height="chartHeight" fill="url(#grid)"/>

        <!-- Y轴 -->
        <line :x1="margin.left" :y1="margin.top" :x2="margin.left" :y2="margin.top + chartHeight" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>

        <!-- Y轴刻度和标签 (0m, 1m, 2m, 3m) -->
        <g v-for="tick in [0, 1, 2, 3]" :key="'y-'+tick">
          <line
            :x1="margin.left - 4"
            :y1="margin.top + chartHeight - (tick / 3.5 * chartHeight)"
            :x2="margin.left"
            :y2="margin.top + chartHeight - (tick / 3.5 * chartHeight)"
            stroke="rgba(255,255,255,0.3)"
            stroke-width="1"
          />
          <text
            :x="margin.left - 8"
            :y="margin.top + chartHeight - (tick / 3.5 * chartHeight) + 3"
            fill="var(--text-muted)"
            font-size="9"
            text-anchor="end"
            font-weight="500"
          >{{ tick }}m</text>
        </g>

        <!-- Y轴标签 -->
        <text
          :x="5"
          :y="margin.top + chartHeight / 2"
          fill="var(--text-secondary)"
          font-size="10"
          font-weight="600"
          text-anchor="middle"
          transform="rotate(-90, 5, 70)"
        >潮位高度</text>

        <!-- X轴 -->
        <line :x1="margin.left" :y1="margin.top + chartHeight" :x2="margin.left + chartWidth" :y2="margin.top + chartHeight" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>

        <!-- 警戒线 -->
        <line :x1="margin.left" :y1="margin.top + chartHeight - (2.5 / 3.5 * chartHeight)" :x2="margin.left + chartWidth" :y2="margin.top + chartHeight - (2.5 / 3.5 * chartHeight)" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4,2" opacity="0.6"/>
        <text :x="margin.left + 5" :y="margin.top + chartHeight - (2.5 / 3.5 * chartHeight) - 3" fill="#ef4444" font-size="8" font-weight="600">警戒线</text>

        <!-- 预报区域填充 -->
        <path
          :d="predictionAreaPath"
          fill="url(#predictionAreaGradient)"
        />

        <!-- 预报曲线 -->
        <path
          :d="predictionPath"
          fill="none"
          stroke="url(#predictionGradient)"
          stroke-width="2.5"
          stroke-dasharray="5,3"
          filter="url(#glow)"
        />

        <!-- 观测区域填充 -->
        <path
          :d="observationAreaPath"
          fill="url(#observationAreaGradient)"
        />

        <!-- 观测曲线 -->
        <path
          :d="observationPath"
          fill="none"
          stroke="url(#observationGradient)"
          stroke-width="2.5"
          filter="url(#glow)"
        />

        <!-- 当前时间指示线 -->
        <line :x1="currentTimeX" :y1="margin.top" :x2="currentTimeX" :y2="margin.top + chartHeight" stroke="#00ffff" stroke-width="1.5" stroke-dasharray="3,2" opacity="0.8" filter="url(#glow)"/>
        <text :x="currentTimeX + 3" :y="margin.top + 10" fill="#00ffff" font-size="8" font-weight="600">当前</text>

        <!-- 数据点 -->
        <circle v-for="(point, idx) in observationPoints" :key="'obs-'+idx"
          :cx="point.x" :cy="point.y" r="3.5" fill="#10b981" stroke="#fff" stroke-width="1" filter="url(#glow)"/>
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
const svgWidth = 340
const svgHeight = 140
const margin = { top: 10, right: 10, bottom: 20, left: 40 }
const chartWidth = svgWidth - margin.left - margin.right
const chartHeight = svgHeight - margin.top - margin.bottom
const dataLength = predictionData.length

function dataToPath(data) {
  const points = data.map((val, idx) => {
    if (val === null) return null
    const x = margin.left + (idx / (dataLength - 1)) * chartWidth
    const y = margin.top + chartHeight - ((val / 3.5) * chartHeight)
    return { x, y }
  }).filter(p => p !== null)

  if (points.length === 0) return ''

  return points.map((p, i) =>
    (i === 0 ? 'M' : 'L') + `${p.x},${p.y}`
  ).join(' ')
}

const observationPath = computed(() => dataToPath(observationData))
const predictionPath = computed(() => dataToPath(predictionData))

// 区域填充路径（曲线到底部的填充）
function dataToAreaPath(data) {
  const points = data.map((val, idx) => {
    if (val === null) return null
    const x = margin.left + (idx / (dataLength - 1)) * chartWidth
    const y = margin.top + chartHeight - ((val / 3.5) * chartHeight)
    return { x, y }
  }).filter(p => p !== null)

  if (points.length === 0) return ''

  const bottomY = margin.top + chartHeight

  // 开始路径
  let path = `M${points[0].x},${bottomY}`
  path += ` L${points[0].x},${points[0].y}`

  // 添加所有数据点
  points.forEach((p, i) => {
    if (i > 0) path += ` L${p.x},${p.y}`
  })

  // 闭合路径到底部
  path += ` L${points[points.length - 1].x},${bottomY} Z`

  return path
}

const observationAreaPath = computed(() => dataToAreaPath(observationData))
const predictionAreaPath = computed(() => dataToAreaPath(predictionData))

const observationPoints = computed(() => {
  return observationData.map((val, idx) => {
    if (val === null) return null
    return {
      x: margin.left + (idx / (dataLength - 1)) * chartWidth,
      y: margin.top + chartHeight - ((val / 3.5) * chartHeight)
    }
  }).filter(p => p !== null)
})

// 当前时间线位置（假设现在是12:00）
const currentTimeX = computed(() => margin.left + (12 / 24) * chartWidth)
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
  margin-bottom: 8px;
}

.station-select {
  padding: 8px 12px;
  font-size: 11px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(30, 40, 60, 0.6));
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 6px;
  color: var(--text-primary);
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
}

.station-select:hover {
  border-color: #3b82f6;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.18), rgba(30, 40, 60, 0.7));
}

.station-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.chart-legend {
  display: flex;
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  color: var(--text-secondary);
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid transparent;
  transition: all 0.2s;
}

.legend-item:hover {
  transform: translateY(-1px);
}

.legend-item .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  box-shadow: 0 0 8px currentColor;
}

.legend-item.observation .dot {
  background: #10b981;
  color: #10b981;
}

.legend-item.observation {
  border-color: rgba(16, 185, 129, 0.3);
}

.legend-item.prediction .dot {
  background: #8b5cf6;
  color: #8b5cf6;
}

.legend-item.prediction {
  border-color: rgba(139, 92, 246, 0.3);
}

.chart-container {
  background: linear-gradient(135deg, rgba(30, 40, 60, 0.6), rgba(20, 30, 50, 0.4));
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 10px;
  padding: 12px;
  position: relative;
  overflow: hidden;
}

.chart-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #3b82f6 30%, #8b5cf6 70%, transparent);
  opacity: 0.6;
}

.chart-svg {
  width: 100%;
  height: 100px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.time-axis {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  padding: 0 5px;
}

.time-label {
  font-size: 9px;
  color: var(--text-muted);
  font-weight: 500;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.current-values {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.value-item {
  flex: 1;
  padding: 10px;
  background: linear-gradient(135deg, rgba(30, 40, 60, 0.6), rgba(20, 30, 50, 0.4));
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 8px;
  text-align: center;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.value-item::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: currentColor;
  opacity: 0;
  transition: opacity 0.3s;
}

.value-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.value-item:hover::before {
  opacity: 0.6;
}

.value-label {
  display: block;
  font-size: 9px;
  color: var(--text-muted);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.value-number {
  font-size: 16px;
  font-weight: 700;
  font-family: var(--font-display);
  text-shadow: 0 0 10px currentColor;
}

.value-item:nth-child(1) {
  border-color: rgba(16, 185, 129, 0.3);
}

.value-item:nth-child(1):hover {
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.value-number.observation {
  color: #10b981;
}

.value-item:nth-child(2) {
  border-color: rgba(139, 92, 246, 0.3);
}

.value-item:nth-child(2):hover {
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.value-number.prediction {
  color: #8b5cf6;
}

.value-item:nth-child(3) {
  border-color: rgba(234, 179, 8, 0.3);
}

.value-item:nth-child(3):hover {
  box-shadow: 0 4px 12px rgba(234, 179, 8, 0.3);
}

.value-number.normal {
  color: #3b82f6;
}

.value-number.warn {
  color: #f59e0b;
  animation: pulse-warn 2s ease-in-out infinite;
}

@keyframes pulse-warn {
  0%, 100% {
    text-shadow: 0 0 10px #f59e0b;
  }
  50% {
    text-shadow: 0 0 20px #f59e0b, 0 0 30px rgba(245, 158, 11, 0.5);
  }
}
</style>
