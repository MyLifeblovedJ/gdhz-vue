<template>
  <div class="data-panel-sidebar">
    <!-- 1. 关键监测指标（整合Tab页） -->
    <div class="panel data-panel">
      <div class="panel-header">
        <div class="panel-title">
          <i class="fa-solid fa-chart-simple"></i>
          关键监测指标
          <span v-if="activeDataTab === 'core'" class="badge normal">{{ normalCount }}</span>
          <span v-if="activeDataTab === 'core' && warnCount > 0" class="badge warn">{{ warnCount }}异常</span>
        </div>
      </div>
      
      <!-- Tab切换栏 -->
      <div class="data-tab-bar">
        <button 
          v-for="tab in dataTabs" 
          :key="tab.id"
          class="data-tab-btn"
          :class="{ active: activeDataTab === tab.id }"
          @click="activeDataTab = tab.id"
        >
          <i :class="tab.icon"></i>
          {{ tab.label }}
        </button>
      </div>
      
      <div class="panel-content">
        <!-- 风浪潮核心指标 -->
        <div v-if="activeDataTab === 'core'" class="data-cards-scroll">
          <div
            v-for="(item, key) in realtimeData.overview"
            :key="key"
            class="data-card"
            :class="getCardStatus(item)"
          >
            <div class="card-header">
              <span class="card-label">{{ item.label }}</span>
              <span class="card-trend" :class="item.trend">
                <i :class="getTrendIcon(item.trend)"></i>
              </span>
            </div>
            <div class="card-value">
              <span class="value">{{ item.value }}</span>
              <span class="unit">{{ item.unit }}</span>
              <span v-if="item.direction" class="direction">{{ item.direction }}</span>
            </div>
            <div class="card-station">{{ item.station }}</div>
            <div class="card-status-text" :class="getCardStatus(item)">
              {{ getStatusText(item) }}
            </div>
          </div>
        </div>
        
        <!-- 水温 -->
        <div v-if="activeDataTab === 'temperature'" class="observation-grid">
          <div class="obs-item">
            <div class="obs-label">表层水温</div>
            <div class="obs-value">26.8<span class="unit">°C</span></div>
            <div class="obs-trend up"><i class="fa-solid fa-arrow-up"></i> +0.5</div>
          </div>
          <div class="obs-item">
            <div class="obs-label">底层水温</div>
            <div class="obs-value">18.2<span class="unit">°C</span></div>
            <div class="obs-trend stable"><i class="fa-solid fa-minus"></i> 稳定</div>
          </div>
          <div class="obs-item full">
            <div class="obs-label">温跃层深度</div>
            <div class="obs-value">45<span class="unit">m</span></div>
          </div>
        </div>
        
        <!-- 盐度 -->
        <div v-if="activeDataTab === 'salinity'" class="observation-grid">
          <div class="obs-item">
            <div class="obs-label">表层盐度</div>
            <div class="obs-value">33.5<span class="unit">‰</span></div>
            <div class="obs-trend down"><i class="fa-solid fa-arrow-down"></i> -0.2</div>
          </div>
          <div class="obs-item">
            <div class="obs-label">底层盐度</div>
            <div class="obs-value">34.8<span class="unit">‰</span></div>
            <div class="obs-trend stable"><i class="fa-solid fa-minus"></i> 稳定</div>
          </div>
        </div>
        
        <!-- 流场 -->
        <div v-if="activeDataTab === 'current'" class="observation-grid">
          <div class="obs-item">
            <div class="obs-label">表层流速</div>
            <div class="obs-value">0.8<span class="unit">m/s</span></div>
            <div class="obs-direction">西南</div>
          </div>
          <div class="obs-item">
            <div class="obs-label">潮流相位</div>
            <div class="obs-value">涨潮</div>
            <div class="obs-status normal">正常</div>
          </div>
        </div>
        
        <!-- 气象 -->
        <div v-if="activeDataTab === 'weather'" class="observation-grid">
          <div class="obs-item">
            <div class="obs-label">气压</div>
            <div class="obs-value">1008<span class="unit">hPa</span></div>
            <div class="obs-trend down"><i class="fa-solid fa-arrow-down"></i> -5</div>
          </div>
          <div class="obs-item">
            <div class="obs-label">能见度</div>
            <div class="obs-value">8.5<span class="unit">km</span></div>
            <div class="obs-status normal">良好</div>
          </div>
          <div class="obs-item">
            <div class="obs-label">降水量(24h)</div>
            <div class="obs-value">12<span class="unit">mm</span></div>
          </div>
          <div class="obs-item">
            <div class="obs-label">相对湿度</div>
            <div class="obs-value">85<span class="unit">%</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. 潮位趋势分析 -->
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
        <div class="tide-tags">
          <div class="tide-tag peak">
            <i class="fa-solid fa-arrow-trend-up"></i>
            <span class="tag-label">峰值</span>
            <span class="tag-value">{{ currentPeakInfo?.value }}m @ {{ currentPeakInfo?.time }}</span>
          </div>
          <div class="tide-tag warning">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span class="tag-label">超警戒</span>
            <span class="tag-value">+{{ currentPeakInfo?.overWarning }}m</span>
          </div>
        </div>
        <!-- 影响区域标签列表 -->
        <div class="affected-areas-row">
          <span class="areas-label">
            <i class="fa-solid fa-map-location-dot"></i>
            影响区域
          </span>
          <div class="areas-tags">
            <span 
              v-for="district in currentAffectedDistricts" 
              :key="district" 
              class="area-tag"
            >
              <i class="fa-solid fa-map-marker-alt"></i>
              {{ district }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. 设备与数据统计 -->
    <div class="stats-section">
      <div class="stats-header">
        <i class="fa-solid fa-chart-pie"></i>
        <span>设备与数据</span>
      </div>
      <div class="stats-grid">
        <div class="stat-mini">
          <div class="stat-mini-value">{{ deviceStats.totalDevices }}</div>
          <div class="stat-mini-label">设备总数</div>
        </div>
        <div class="stat-mini online">
          <div class="stat-mini-value">{{ deviceStats.onlineDevices }}</div>
          <div class="stat-mini-label">在线设备</div>
        </div>
        <div class="stat-mini" :class="{ alert: alertDevicesCount > 0 }">
          <div class="stat-mini-value">{{ alertDevicesCount }}</div>
          <div class="stat-mini-label">预警设备</div>
        </div>
        <div class="stat-mini data">
          <div class="stat-mini-value">{{ databaseStats.totalData }}<span class="unit">TB</span></div>
          <div class="stat-mini-label">数据总量</div>
        </div>
      </div>
      <div class="quality-row">
        <span class="quality-label">数据完整率</span>
        <div class="quality-bar">
          <div class="quality-fill" :style="{ width: dataQuality.completeness + '%' }"></div>
        </div>
        <span class="quality-value">{{ dataQuality.completeness }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useAppStore } from '../../stores/app'

import { mockRealtimeData } from '../../data/mockData'
import { mockAISummaryData } from '../../data/aiSummaryData'

const store = useAppStore()

// 面板折叠状态
const tideCollapsed = ref(false)


// Tab切换状态
const activeDataTab = ref('core')

// Tab配置
const dataTabs = [
  { id: 'core', label: '风浪潮', icon: 'fa-solid fa-water' },
  { id: 'temperature', label: '水温', icon: 'fa-solid fa-temperature-half' },
  { id: 'salinity', label: '盐度', icon: 'fa-solid fa-droplet' },
  { id: 'current', label: '流场', icon: 'fa-solid fa-arrows-spin' },
  { id: 'weather', label: '气象', icon: 'fa-solid fa-cloud' }
]

// 计算属性
const realtimeData = computed(() => mockRealtimeData)
const dataQuality = computed(() => mockRealtimeData.dataQuality)

// 潮位趋势分析数据
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
    grid: { left: 40, right: 12, top: 30, bottom: 20 },
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
      // 自动计算 Y 轴最大值，确保能显示所有数据
      axisLine: { show: false },
      axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 9, formatter: '{value}m' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } }
    },
    series: [
      {
        name: '警戒线',
        type: 'line',
        data: allTimes.map(() => currentStationData.value?.warningLevel || 3.5),
        lineStyle: { color: '#ef4444', width: 1, type: 'dashed' },
        symbol: 'none',
        z: 1
      },
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

// 设备统计
const deviceStats = computed(() => store.stats)
const databaseStats = computed(() => store.databaseStats)
const alertDevicesCount = computed(() =>
  store.devices.filter(d => d.status === 'alarm' || d.status === 'warn').length
)

// 统计正常和异常指标数量
const normalCount = computed(() => {
  const overview = realtimeData.value.overview
  return Object.values(overview).filter(item => item.value < item.threshold.warn).length
})

const warnCount = computed(() => {
  const overview = realtimeData.value.overview
  return Object.values(overview).filter(item => item.value >= item.threshold.warn).length
})

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
  /* 启用 GPU 加速，优化滚动性能 */
  transform: translateZ(0);
  will-change: scroll-position;
  -webkit-overflow-scrolling: touch;
}

/* 侧边栏滚动条 */
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

/* ========== Tab切换栏（观测数据风格） ========== */
.data-tab-bar {
  display: flex;
  gap: 6px;
  padding: 8px 12px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(59, 130, 246, 0.08));
  border-radius: 8px;
  border: 1px solid rgba(16, 185, 129, 0.15);
  margin: 0 12px;
}

.data-tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 6px 4px;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  white-space: nowrap;
}

.data-tab-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(59, 130, 246, 0.15));
  opacity: 0;
  transition: opacity 0.3s;
}

.data-tab-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(16, 185, 129, 0.3);
  transform: translateY(-1px);
}

.data-tab-btn:hover::before {
  opacity: 0.5;
}

.data-tab-btn.active {
  color: #10b981;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1));
  border-color: #10b981;
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.data-tab-btn.active::before {
  opacity: 1;
}

.data-tab-btn i {
  font-size: 10px;
}

/* ========== 核心指标卡片网格（2x2对齐） ========== */
.data-cards-scroll {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

/* ========== 观测数据网格（统一风格） ========== */
.observation-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.obs-item {
  padding: 12px;
  background: linear-gradient(135deg, rgba(30, 40, 60, 0.6), rgba(20, 30, 50, 0.4));
  border: 1px solid rgba(16, 185, 129, 0.15);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.obs-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: linear-gradient(180deg, #10b981, #3b82f6);
  opacity: 0;
  transition: opacity 0.3s;
}

.obs-item:hover {
  border-color: #10b981;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.05));
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}

.obs-item:hover::before {
  opacity: 1;
}

.obs-item.full {
  grid-column: span 2;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(59, 130, 246, 0.08));
  border-color: rgba(16, 185, 129, 0.3);
}

.obs-label {
  font-size: 10px;
  color: var(--text-secondary);
  margin-bottom: 6px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.obs-value {
  font-size: 22px;
  font-weight: 700;
  font-family: var(--font-display);
  color: #10b981;
  text-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
  line-height: 1;
}

.obs-value .unit {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-secondary);
  margin-left: 3px;
  text-shadow: none;
}

.obs-trend {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  margin-top: 6px;
  padding: 3px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.obs-trend.up {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.obs-trend.down {
  color: #10b981;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.obs-trend.stable {
  color: #8b5cf6;
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.obs-direction {
  font-size: 11px;
  color: #3b82f6;
  margin-top: 6px;
  padding: 3px 8px;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 10px;
  display: inline-block;
  font-weight: 600;
}

.obs-status {
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 10px;
  margin-top: 6px;
  display: inline-block;
  font-weight: 600;
  border: 1px solid;
}

.obs-status.normal {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.4);
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.2);
}

/* 态势研判总结区 */
.summary-section {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.02));
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: var(--border-radius);
  padding: 12px;
  position: relative;
  flex-shrink: 0;
}

.summary-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 15%;
  right: 15%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #10b981 30%, #10b981 70%, transparent);
  opacity: 0.8;
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 15px;
  font-weight: 600;
  color: #10b981;
}

.update-badge {
  margin-left: auto;
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 400;
}

.update-badge i.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 结论卡片 */
.summary-conclusion {
  display: flex;
  gap: 12px;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 10px;
}

.summary-conclusion.low {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.summary-conclusion.medium {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.summary-conclusion.high {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.conclusion-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.summary-conclusion.low .conclusion-icon {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.summary-conclusion.medium .conclusion-icon {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.summary-conclusion.high .conclusion-icon {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.conclusion-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.conclusion-desc {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* 关键发现列表 */
.key-findings {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.finding-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  padding: 6px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.03);
}

.finding-item i {
  width: 12px;
  text-align: center;
}

.finding-item.low { color: var(--text-secondary); }
.finding-item.low i { color: #10b981; }
.finding-item.medium { color: var(--text-secondary); background: rgba(245, 158, 11, 0.05); }
.finding-item.medium i { color: #f59e0b; }
.finding-item.high { color: var(--text-primary); background: rgba(239, 68, 68, 0.08); }
.finding-item.high i { color: #ef4444; }

/* 面板通用样式 */
.panel {
  background: var(--bg-panel);
  /* backdrop-filter 已移除以提升滚动性能 */
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

.alert-count {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 8px;
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

/* 关键监测指标 - 数据卡片区域 */
.data-panel .panel-header {
  cursor: default;
}

.data-panel .panel-header:hover {
  background: transparent;
}

.data-cards-scroll {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.data-card {
  background: linear-gradient(135deg, rgba(30, 40, 60, 0.6), rgba(20, 30, 50, 0.4));
  border: 1px solid rgba(16, 185, 129, 0.15);
  border-radius: 8px;
  padding: 12px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.data-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: linear-gradient(180deg, #10b981, #3b82f6);
  opacity: 0;
  transition: opacity 0.3s;
}

.data-card:hover {
  border-color: #10b981;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.05));
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}

.data-card:hover::before {
  opacity: 1;
}

.data-card.warn {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05));
  border-color: rgba(245, 158, 11, 0.4);
}

.data-card.warn::before {
  background: linear-gradient(180deg, #f59e0b, #ef4444);
  opacity: 1;
}

.data-card.alarm {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05));
  border-color: rgba(239, 68, 68, 0.4);
}

.data-card.alarm::before {
  background: linear-gradient(180deg, #ef4444, #dc2626);
  opacity: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.card-label {
  font-size: 10px;
  color: var(--text-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card-trend {
  font-size: 10px;
}

.card-trend.up { color: #ef4444; }
.card-trend.down { color: #10b981; }
.card-trend.stable { color: var(--text-muted); }

.card-value {
  display: flex;
  align-items: baseline;
  gap: 3px;
}

.card-value .value {
  font-size: 22px;
  font-weight: 700;
  font-family: var(--font-display);
  color: #10b981;
  text-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
}

.data-card.warn .card-value .value {
  color: #f59e0b;
  text-shadow: 0 0 10px rgba(245, 158, 11, 0.3);
}

.data-card.alarm .card-value .value {
  color: #ef4444;
  text-shadow: 0 0 10px rgba(239, 68, 68, 0.3);
}

.card-value .unit {
  font-size: 12px;
  color: var(--text-secondary);
  text-shadow: none;
}

.card-value .direction {
  font-size: 11px;
  color: #3b82f6;
  margin-left: 4px;
  padding: 2px 6px;
  background: rgba(59, 130, 246, 0.15);
  border-radius: 8px;
  font-weight: 600;
}

.card-station {
  font-size: 9px;
  color: var(--text-muted);
  margin-top: 4px;
}

.card-status-text {
  font-size: 10px;
  margin-top: 6px;
  padding: 3px 8px;
  border-radius: 10px;
  display: inline-block;
  font-weight: 600;
  border: 1px solid;
}

.card-status-text.normal {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.4);
}

.card-status-text.warn {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.4);
}

.card-status-text.alarm {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.4);
}

/* 模型能力展示 - 紫色主题 */
.model-panel::before {
  background: linear-gradient(90deg, transparent, #8b5cf6 30%, #8b5cf6 70%, transparent);
}

.model-panel .panel-title {
  color: #8b5cf6;
}


/* 预测趋势 */
.prediction-panel::before {
  background: linear-gradient(90deg, transparent, #8b5cf6 30%, #8b5cf6 70%, transparent);
}

.prediction-panel .panel-title {
  color: #8b5cf6;
}

.prediction-summary {
  font-size: 10px;
  color: var(--text-secondary);
  line-height: 1.5;
  padding: 8px;
  background: rgba(139, 92, 246, 0.05);
  border-radius: 6px;
  margin-bottom: 10px;
}

.prediction-timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
  padding-left: 12px;
}

.prediction-timeline::before {
  content: '';
  position: absolute;
  left: 4px;
  top: 8px;
  bottom: 8px;
  width: 1px;
  background: var(--border-subtle);
}

.timeline-item {
  position: relative;
  padding: 6px 0 6px 14px;
}

.timeline-dot {
  position: absolute;
  left: -8px;
  top: 10px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border-subtle);
}

.timeline-item.high .timeline-dot {
  background: #ef4444;
  box-shadow: 0 0 6px rgba(239, 68, 68, 0.5);
}

.timeline-item.medium .timeline-dot {
  background: #f59e0b;
}

.timeline-item.low .timeline-dot {
  background: #10b981;
}

.timeline-header {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 2px;
}

.timeline-time {
  font-size: 9px;
  color: var(--text-muted);
  white-space: nowrap;
}

.timeline-event {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-primary);
}

.timeline-detail {
  font-size: 9px;
  color: var(--text-muted);
  line-height: 1.4;
}

/* 历史灾害匹配 */
.disaster-panel::before {
  background: linear-gradient(90deg, transparent, #eab308 30%, #eab308 70%, transparent);
}

.disaster-panel .panel-title {
  color: #eab308;
}

/* 设备与数据统计区域 */
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
  height: 180px;
  width: 100%;
  box-sizing: border-box;
}

/* 潮位信息彩色标签 */
.tide-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.tide-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 11px;
  border: 1px solid;
}

.tide-tag i {
  font-size: 10px;
}

.tide-tag .tag-label {
  opacity: 0.8;
}

.tide-tag .tag-value {
  font-weight: 600;
}

/* 站点标签 - 青色 */
.tide-tag.station {
  background: rgba(6, 182, 212, 0.15);
  border-color: rgba(6, 182, 212, 0.4);
  color: #22d3ee;
}

/* 峰值标签 - 紫色 */
.tide-tag.peak {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.4);
  color: #a78bfa;
}

/* 超警戒标签 - 红色 */
.tide-tag.warning {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
  color: #f87171;
}

/* 影响区域标签 - 橙色 */
.tide-tag.area {
  background: rgba(251, 146, 60, 0.15);
  border-color: rgba(251, 146, 60, 0.4);
  color: #fb923c;
}

/* 影响区域行容器 */
.affected-areas-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid var(--border-subtle);
  margin-top: 8px;
}

.affected-areas-row .areas-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}

.affected-areas-row .areas-label i {
  color: #fb923c;
}

.affected-areas-row .areas-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.affected-areas-row .area-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(251, 146, 60, 0.15);
  border: 1px solid rgba(251, 146, 60, 0.35);
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  color: #fb923c;
  transition: all 0.2s;
}

.affected-areas-row .area-tag:hover {
  background: rgba(251, 146, 60, 0.25);
}

.affected-areas-row .area-tag i {
  font-size: 9px;
  opacity: 0.8;
}

/* 历史灾害面板 */
.disaster-panel::before {
  background: linear-gradient(90deg, transparent, #eab308 30%, #eab308 70%, transparent);
}

.disaster-panel .panel-title {
  color: #eab308;
}
</style>
