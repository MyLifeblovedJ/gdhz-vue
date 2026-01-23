<template>
  <div class="data-panel-sidebar">
    <!-- 1. 观测数据概览 -->
    <div class="panel observation-panel">
      <div class="panel-header">
        <div class="panel-title">
          <i class="fa-solid fa-eye"></i>
          观测数据概览
        </div>
      </div>
      <div class="panel-content">
        <ObservationOverview />
      </div>
    </div>

    <!-- 2. 关键监测指标 -->
    <div class="panel data-panel">
      <div class="panel-header">
        <div class="panel-title">
          <i class="fa-solid fa-chart-simple"></i>
          关键监测指标
          <span class="badge normal">{{ normalCount }}</span>
          <span v-if="warnCount > 0" class="badge warn">{{ warnCount }}异常</span>
        </div>
      </div>
      <div class="panel-content">
        <div class="data-cards-scroll">
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
      </div>
    </div>

    <!-- 3. 潮位预报/观测对比 -->
    <div class="panel tide-panel" :class="{ collapsed: tideCollapsed }">
      <div class="panel-header" @click="tideCollapsed = !tideCollapsed">
        <div class="panel-title">
          <i class="fa-solid fa-water"></i>
          潮位预报/观测对比
        </div>
        <i class="fa-solid fa-chevron-down toggle-icon"></i>
      </div>
      <div class="panel-content">
        <TideChart />
      </div>
    </div>

    <!-- 4. 历史灾害匹配 -->
    <div class="panel disaster-panel" :class="{ collapsed: disasterCollapsed }">
      <div class="panel-header" @click="disasterCollapsed = !disasterCollapsed">
        <div class="panel-title">
          <i class="fa-solid fa-clock-rotate-left"></i>
          历史灾害匹配
        </div>
        <i class="fa-solid fa-chevron-down toggle-icon"></i>
      </div>
      <div class="panel-content">
        <HistoricalDisasterMatch />
      </div>
    </div>

    <!-- 5. 设备与数据统计 -->
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
import { ref, computed } from 'vue'
import { useAppStore } from '../../stores/app'
import ObservationOverview from '../data/ObservationOverview.vue'
import TideChart from '../data/TideChart.vue'
import HistoricalDisasterMatch from '../data/HistoricalDisasterMatch.vue'
import { mockRealtimeData } from '../../data/mockData'

const store = useAppStore()

// 面板折叠状态
const tideCollapsed = ref(false)
const disasterCollapsed = ref(false)

// 计算属性
const realtimeData = computed(() => mockRealtimeData)
const dataQuality = computed(() => mockRealtimeData.dataQuality)

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
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 10px;
  transition: all 0.3s;
}

.data-card.warn {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05));
  border-color: rgba(245, 158, 11, 0.4);
}

.data-card.alarm {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05));
  border-color: rgba(239, 68, 68, 0.4);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.card-label {
  font-size: 10px;
  color: var(--text-muted);
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
  gap: 2px;
}

.card-value .value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-mono);
}

.card-value .unit {
  font-size: 10px;
  color: var(--text-muted);
}

.card-value .direction {
  font-size: 10px;
  color: var(--accent-cyan);
  margin-left: 4px;
}

.card-station {
  font-size: 9px;
  color: var(--text-muted);
  margin-top: 2px;
}

.card-status-text {
  font-size: 9px;
  margin-top: 4px;
  padding: 2px 6px;
  border-radius: 3px;
  display: inline-block;
}

.card-status-text.normal {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.card-status-text.warn {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.card-status-text.alarm {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
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
</style>
