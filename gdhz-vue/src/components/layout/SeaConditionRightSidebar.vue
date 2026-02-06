<template>
  <div class="data-panel-sidebar">
    <!-- 1. 风浪潮监测重点 -->
    <div class="panel data-panel" :class="{ 'collapsed': manualCollapse }">
      <div class="panel-header" @click="toggleFocusPanel">
        <div class="panel-title">
          <i class="fa-solid fa-crosshairs"></i>
          风浪潮监测重点
          <span v-if="focusCount > 0" class="badge warn">{{ focusCount }} 异常</span>
          <span v-else class="badge normal">一切平稳</span>
        </div>
        <i class="fa-solid fa-chevron-down toggle-icon"></i>
      </div>
      
      <div class="panel-content" v-show="!manualCollapse">
        <div class="data-cards-scroll">

            <!-- 0. 天文潮 (始终显示) -->
          <div class="category-group">
            <div class="category-title">
               <i class="fa-solid fa-moon"></i> 天文潮 ({{ astroTide.currentType }})
               <button class="view-more-btn" @click="showQueryModal = true">查询 <i class="fa-solid fa-magnifying-glass"></i></button>
            </div>
             <div class="data-card astro-card">
              <div class="card-header">
                <span class="card-label">今日潮位最高站 ({{ todayHighTide.station || '珠海站' }})</span>
                <span class="card-tag normal">{{ todayHighTide.time }}</span>
              </div>
               <div class="card-main">
                 <div class="card-row">
                  <span class="label">预测水位</span>
                  <span class="value big">{{ todayHighTide.level }}<span class="unit">m</span></span>
                </div>
              </div>
            </div>
            <!-- 天文潮叠加风险警示 (保留) -->
             <div v-if="astroTide.superimpositionRisk && astroTide.superimpositionRisk.level !== 'low'" 
                  class="superimposition-risk" 
                  :class="astroTide.superimpositionRisk.level">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <div class="risk-content">
                  <div class="risk-title">叠加风险提示</div>
                  <div class="risk-desc">{{ astroTide.superimpositionRisk.description }}</div>
                </div>
            </div>
          </div>
          
          <!-- 1. 潮位观测组 -->
          <div v-if="abnormalTideStations.length > 0" class="category-group">
            <div class="category-title">
              <i class="fa-solid fa-water"></i> 潮位异常
            </div>
            <div
              v-for="(station, index) in abnormalTideStations"
              :key="'tide-'+index"
              class="data-card"
              :class="getParamsClass(station.state)"
            >
              <div class="card-header">
                <span class="card-label single-line" :title="station.name">{{ station.name }}</span>
                <span class="card-tag no-wrap" :class="getParamsClass(station.state)">{{ station.state }}</span>
              </div>
              <div class="card-main">
                <div class="card-row">
                  <span class="label" title="天文潮位 + 风暴潮增水的总潮位">预计最高 <i class="fa-regular fa-circle-question" style="font-size:10px"></i></span>
                  <span class="value big">{{ station.maxLevel }}<span class="unit">m</span></span>
                </div>
                <div class="card-row">
                  <span class="label">出现时间</span>
                  <span class="value time">{{ station.time }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. 海浪观测组 -->
          <div v-if="isWaveAbnormal" class="category-group">
            <div class="category-title">
              <i class="fa-solid fa-ship"></i> 海浪异常
            </div>
            <div class="data-card wave warn"> <!-- 假设 waveData 总是异常/需关注 -->
              <div class="card-header">
                <span class="card-label single-line" :title="waveData.station">{{ waveData.station }}</span>
                <span class="card-tag orange no-wrap">需关注</span>
              </div>
               <div class="card-main">
                <div class="card-row">
                  <span class="label">有效波高</span>
                  <span class="value big">{{ waveData.height }}<span class="unit">m</span></span>
                </div>
                <div class="card-row">
                  <span class="label">出现时间</span>
                  <span class="value time">{{ waveData.appearTime }}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- 2. 潮位趋势分析 -->
    <div class="panel tide-panel" :class="{ collapsed: tideCollapsed }">
      <div class="panel-header" @click="tideCollapsed = !tideCollapsed">
        <div class="panel-title">
          <i class="fa-solid fa-chart-area"></i>
          潮位趋势分析
        </div>
        <select v-model="selectedStation" class="station-select" @click.stop>
          <option 
            v-for="station in tideTrendData.stations" 
            :key="station.id" 
            :value="station.id"
          >
            {{ station.name }}
            <template v-if="station.isAtRisk">⚠</template>
          </option>
        </select>
        <i class="fa-solid fa-chevron-down toggle-icon"></i>
      </div>
      <div class="panel-content">
        <div class="chart-container" ref="chartContainer"></div>
        <div class="tide-info">
          <div class="tide-info-item">
            <span class="label">站点</span>
            <span class="value">{{ currentStationData?.name || '加载中...' }}</span>
          </div>
          <div class="tide-info-item peak">
            <span class="label">峰值</span>
            <span class="value">{{ currentPeakInfo?.value }}m @ {{ currentPeakInfo?.time }}</span>
          </div>
          <div class="tide-info-item warning">
            <span class="label">超警戒</span>
            <span class="value">+{{ currentPeakInfo?.overWarning }}m</span>
          </div>
          <div class="tide-info-item">
            <span class="label">影响区域</span>
            <span class="value">{{ currentAffectedDistricts?.join('、') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 6. 实时观测概览 (移至底部) -->
    <div class="panel observation-panel">
      <div class="panel-header">
        <div class="panel-title">
          <i class="fa-solid fa-eye"></i>
          实时观测概览
        </div>
      </div>
      <div class="panel-content">
        <ObservationOverview />
      </div>
    </div>
    
    <!-- 天文潮查询弹窗 -->
    <AstroTideQueryModal 
      v-model:visible="showQueryModal" 
      @query="handleAstroQuery"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '../../stores/app'
import ObservationOverview from '../data/ObservationOverview.vue'
import AstroTideQueryModal from '../common/AstroTideQueryModal.vue'
import { mockRealtimeData } from '../../data/mockData'

const store = useAppStore()
const emit = defineEmits(['station-click'])

// 计算属性
const realtimeData = computed(() => mockRealtimeData)
const dataQuality = computed(() => mockRealtimeData.dataQuality)

// 新数据源
import { mockTideForecastStations, mockNearshoreWave } from '../../data/seaConditionData'

const tideStations = computed(() => mockTideForecastStations)
const waveData = computed(() => mockNearshoreWave)

// 过滤异常数据
const abnormalTideStations = computed(() => {
  return tideStations.value.filter(s => s.state !== '正常')
})

const isWaveAbnormal = computed(() => true) // 假设 mockData 中的 wave 总是重点关注，实际可根据阈值判断

// 引入天文潮数据
import { mockAstronomicalTide } from '../../data/seaConditionData'
const astroTide = computed(() => mockAstronomicalTide)

const focusCount = computed(() => {
  return abnormalTideStations.value.length + (isWaveAbnormal.value ? 1 : 0)
})

// 弹窗状态
const showQueryModal = ref(false)

// 潮位趋势面板折叠状态
const tideCollapsed = ref(false)

// 潮位趋势分析数据
import { mockAISummaryData } from '../../data/aiSummaryData'
const tideTrendData = computed(() => mockAISummaryData.tideAnalysis)

// 站点选择
const selectedStation = ref('zhuhai')
const chartContainer = ref(null)
let chartInstance = null

// 当前站点数据
const currentStationData = computed(() => {
  return tideTrendData.value.stations.find(s => s.id === selectedStation.value)
})

const currentTideData = computed(() => {
  return tideTrendData.value.stationData[selectedStation.value]
})

const currentPeakInfo = computed(() => {
  return currentTideData.value?.peakInfo
})

const currentAffectedDistricts = computed(() => {
  return currentTideData.value?.affectedDistricts
})

// 图表渲染
import * as echarts from 'echarts'
import { onMounted, watch, nextTick } from 'vue'

function renderTideChart() {
  if (!chartContainer.value) return
  
  if (!chartInstance) {
    chartInstance = echarts.init(chartContainer.value)
  }
  
  const data = currentTideData.value
  if (!data) return
  
  const allTimes = [...new Set([
    ...data.observation.map(d => d.time),
    ...data.prediction.map(d => d.time)
  ])].sort()
  
  const option = {
    grid: {
      left: 40,
      right: 12,
      top: 30,
      bottom: 20
    },
    xAxis: {
      type: 'category',
      data: allTimes,
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
      axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 9 },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 3.5,
      axisLine: { show: false },
      axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 9, formatter: '{value}m' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } }
    },
    series: [
      // 警戒线
      {
        name: '警戒线',
        type: 'line',
        data: allTimes.map(() => data.warningLevel),
        lineStyle: { color: '#ef4444', width: 1, type: 'dashed' },
        symbol: 'none',
        z: 1
      },
      // 观测曲线
      {
        name: '观测值',
        type: 'line',
        data: allTimes.map(t => {
          const point = data.observation.find(d => d.time === t)
          return point ? point.value : null
        }),
        lineStyle: { color: '#10b981', width: 2.5 },
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: '#10b981' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
            { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
          ])
        },
        z: 3
      },
      // 预测曲线
      {
        name: '预测值',
        type: 'line',
        data: allTimes.map(t => {
          const point = data.prediction.find(d => d.time === t)
          return point ? point.value : null
        }),
        lineStyle: { color: '#8b5cf6', width: 2, type: 'dashed' },
        symbol: 'circle',
        symbolSize: 5,
        itemStyle: { color: '#8b5cf6' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(139, 92, 246, 0.2)' },
            { offset: 1, color: 'rgba(139, 92, 246, 0.02)' }
          ])
        },
        z: 2
      }
    ],
    legend: {
      data: ['观测值', '预测值', '警戒线'],
      top: 0,
      textStyle: { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
      itemWidth: 15,
      itemHeight: 8
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(20, 30, 50, 0.9)',
      borderColor: 'rgba(6, 182, 212, 0.3)',
      textStyle: { color: '#fff', fontSize: 11 }
    }
  }
  
  chartInstance.setOption(option)
}

onMounted(() => {
  nextTick(() => {
    if (!tideCollapsed.value) {
      renderTideChart()
    }
  })
})

watch(selectedStation, () => {
  nextTick(() => renderTideChart())
})

watch(tideCollapsed, (collapsed) => {
  if (!collapsed) {
    nextTick(() => {
      if (chartInstance) {
        chartInstance.resize()
      } else {
        renderTideChart()
      }
    })
  }
})

function handleAstroQuery(params) {
  console.log('Query Astro Tide:', params)
  // 这里可以调用接口获取数据
}

// 计算今日最高潮
const todayHighTide = computed(() => {
    const todayRows = astroTide.value.tideTable.filter(row => row.date === '今日' && row.type === 'high')
    // Find highest
    if (todayRows.length === 0) return { time: '--:--', level: '--', station: '珠海站' }
    const highest = todayRows.reduce((prev, current) => (parseFloat(current.level) > parseFloat(prev.level)) ? current : prev)
    return { ...highest, station: '珠海站' } // Mock station name if missing in row
})

// 面板自适应折叠：如果无异常，默认折叠；有异常则展开
// 这里我们让数据驱动 collapse 状态，如果 focusCount > 0 则显示内容，否则显示 empty-state (或折叠)
// 为了响应用户手动折叠，可以在 toggle 中处理
const manualCollapse = ref(false)

function toggleFocusPanel() {
  // Always allow toggling
  manualCollapse.value = !manualCollapse.value
}

function getParamsClass(state) {
  if (state === '超警') return 'alarm'
  if (state === '需关注') return 'warn'
  return 'normal'
}

// 方法
function getCardStatus(item) {
  if (item.value >= item.threshold.alarm) return 'alarm'
  if (item.value >= item.threshold.warn) return 'warn'
  return 'normal'
}

function getStatusText(item) {
  if (item.value >= item.threshold.alarm) return '超警戒'
  if (item.value >= item.threshold.warn) return '需关注'
  return '正常'
}

function getTrendIcon(trend) {
  switch (trend) {
    case 'up': return 'fa-solid fa-arrow-up'
    case 'down': return 'fa-solid fa-arrow-down'
    default: return 'fa-solid fa-minus'
  }
}
</script>

<style scoped>
.data-panel-sidebar {
  width: 340px;
  flex-shrink: 0;
  background: var(--bg-deepest);
  border-left: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  padding: 8px 10px;
  gap: 10px;
  overflow-y: auto;
  z-index: 50;
}

.data-panel-sidebar::-webkit-scrollbar {
  width: 4px;
}

.data-panel-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.data-panel-sidebar::-webkit-scrollbar-thumb {
  background: var(--border-subtle);
  border-radius: 2px;
}

.data-panel-sidebar::-webkit-scrollbar-thumb:hover {
  background: #10b981;
}

/* 面板通用样式 */
.panel {
  background: var(--bg-panel);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-normal);
  border-radius: var(--border-radius);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: var(--shadow-panel);
  flex-shrink: 0;
}

.panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 15%;
  right: 15%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent-cyan) 30%, var(--accent-cyan) 70%, transparent);
  opacity: 0.6;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  user-select: none;
  transition: background var(--transition-fast);
}

.panel-header:hover {
  background: var(--bg-hover);
}

.panel-title {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 600;
  color: var(--accent-cyan);
  letter-spacing: 0.5px;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 6px;
}

.panel-title .badge {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 8px;
}

.panel-title .badge.normal {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.panel-title .badge.warn {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.toggle-icon {
  color: var(--text-muted);
  font-size: 10px;
  transition: transform var(--transition-fast);
}

.panel.collapsed .toggle-icon {
  transform: rotate(-90deg);
}

.panel-content {
  max-height: 2000px;
  overflow: visible;
  transition: max-height 0.3s ease, padding 0.3s ease;
  padding: 0 12px 12px 12px;
}

.panel.collapsed .panel-content {
  max-height: 0;
  padding: 0 12px;
  overflow: hidden;
}

/* 数据卡片 */
.data-panel .panel-header {
  cursor: default;
}

.data-panel .panel-header:hover {
  background: transparent;
}

/* 数据卡片新样式 */
.data-cards-scroll {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 480px; /* Limit height roughly for 7 items */
  overflow-y: auto;
  padding-right: 4px;
}

.category-title {
  font-size: 11px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: space-between; /* Align button right */
  gap: 6px;
  font-weight: 600;
  padding-left: 2px;
}

.view-more-btn {
    background: transparent;
    border: none;
    color: var(--accent-cyan);
    font-size: 10px;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 4px;
    transition: background 0.2s;
}
.view-more-btn:hover {
    background: rgba(6, 182, 212, 0.1);
}

.astro-card {
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05));
    border-color: rgba(139, 92, 246, 0.3);
}

.data-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 10px;
  border-radius: 6px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
  color: #10b981;
  gap: 8px;
  font-size: 12px;
}

.empty-state i {
  font-size: 20px;
}

.data-card.alarm {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
}

.data-card.warn {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
}

.data-card.wave {
    background: rgba(6, 182, 212, 0.1);
    border-color: rgba(6, 182, 212, 0.3);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px; /* Prevent overlap */
}

.card-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-primary);
}

.single-line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1; /* Allow taking available space */
  min-width: 0; /* Enable truncation */
}

.no-wrap {
  white-space: nowrap;
  flex-shrink: 0; /* Prevent shrinking */
}

.card-tag {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 2px;
    font-weight: 600;
}
.card-tag.alarm { color: #ef4444; background: rgba(239, 68, 68, 0.2); }
.card-tag.warn { color: #f59e0b; background: rgba(245, 158, 11, 0.2); }
.card-tag.normal { color: #10b981; background: rgba(16, 185, 129, 0.2); }
.card-tag.orange { color: #f97316; background: rgba(249, 115, 22, 0.2); }

.card-main {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.card-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 11px;
}

.card-row .label {
    color: var(--text-muted);
}
.card-row .value {
    color: var(--text-primary);
    font-family: 'DIN Alternate', sans-serif;
    font-weight: 500;
}
.card-row .value.big {
    font-size: 16px;
    font-weight: 700;
}
.card-row .value.time {
    color: var(--text-secondary);
    font-weight: 600;
}
.card-row .unit {
    font-size: 10px;
    margin-left: 2px;
    font-weight: normal;
    color: var(--text-muted);
}

/* 历史灾害面板 */
.disaster-panel::before {
  background: linear-gradient(90deg, transparent, #eab308 30%, #eab308 70%, transparent);
}

.disaster-panel .panel-title {
  color: #eab308;
}

/* 统计区域 */
.stats-section {
  background: rgba(30, 40, 60, 0.4);
  border-radius: 8px;
  padding: 12px;
  flex-shrink: 0;
}

.stats-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--accent-cyan);
  margin-bottom: 10px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 10px;
}

.stat-mini {
  text-align: center;
  padding: 6px 4px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  border: 1px solid var(--border-subtle);
}

.stat-mini-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-mono);
  line-height: 1.2;
}

.stat-mini-value .unit {
  font-size: 9px;
  color: var(--text-muted);
  font-weight: 400;
  margin-left: 1px;
}

.stat-mini-label {
  font-size: 9px;
  color: var(--text-muted);
  margin-top: 2px;
}

.stat-mini.online .stat-mini-value {
  color: #10b981;
}

.stat-mini.alert .stat-mini-value {
  color: #ef4444;
}

.stat-mini.data .stat-mini-value {
  color: #8b5cf6;
}

.quality-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quality-label {
  font-size: 9px;
  color: var(--text-muted);
  white-space: nowrap;
}

.quality-bar {
  flex: 1;
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.quality-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #34d399);
  border-radius: 2px;
  transition: width 0.5s;
}

.quality-value {
  font-size: 10px;
  font-weight: 600;
  color: #10b981;
  min-width: 35px;
  text-align: right;
}
/* 叠加风险提示 (复用样式) */
.superimposition-risk {
  display: flex;
  gap: 8px;
  padding: 8px;
  border-radius: 6px;
  align-items: flex-start;
  margin-top: 8px; /* Spacing from card */
}

.superimposition-risk.high {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05));
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.superimposition-risk.high i {
  color: #ef4444;
}

.superimposition-risk.medium {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05));
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.superimposition-risk.medium i {
  color: #f59e0b;
}

.superimposition-risk i {
  font-size: 14px;
  margin-top: 2px;
}

.risk-content {
  flex: 1;
}

.risk-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.risk-desc {
  font-size: 10px;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* 潮位趋势面板样式 */
.tide-panel::before {
  background: linear-gradient(90deg, transparent, #3b82f6 30%, #3b82f6 70%, transparent);
}

.tide-panel .panel-title {
  color: #3b82f6;
}

.station-select {
  margin-left: auto;
  margin-right: 8px;
  padding: 3px 8px;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 4px;
  color: #60a5fa;
  font-size: 10px;
  cursor: pointer;
  outline: none;
}

.station-select:focus {
  border-color: #3b82f6;
}

.station-select option {
  background: #1e293b;
  color: #fff;
}

.chart-container {
  height: 160px;
  width: 100%;
  box-sizing: border-box;
}

.tide-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 10px 0 0 0;
  border-top: 1px solid var(--border-subtle);
  margin-top: 10px;
}

.tide-info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10px;
}

.tide-info-item .label {
  color: var(--text-muted);
}

.tide-info-item .value {
  color: var(--text-primary);
  font-weight: 500;
}

.tide-info-item.peak .value {
  color: #8b5cf6;
  font-weight: 600;
}

.tide-info-item.warning .value {
  color: #ef4444;
  font-weight: 600;
}
</style>
