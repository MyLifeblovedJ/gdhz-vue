<template>
  <div class="realtime-panel">
    <!-- 1. 态势研判总结（核心区域） -->
    <div class="summary-section">
      <div class="summary-header">
        <i class="fa-solid fa-lightbulb"></i>
        <span>态势研判</span>
        <span class="update-badge">
          <i class="fa-solid fa-sync-alt" :class="{ spinning: isRefreshing }"></i>
          {{ lastUpdateText }}
        </span>
      </div>
      <div class="summary-content">
        <div class="summary-conclusion" :class="overallRiskLevel">
          <div class="conclusion-icon">
            <i :class="conclusionIcon"></i>
          </div>
          <div class="conclusion-text">
            <div class="conclusion-title">{{ conclusionTitle }}</div>
            <div class="conclusion-desc">{{ conclusionDesc }}</div>
          </div>
        </div>
        <div class="key-findings">
          <div v-for="(finding, idx) in keyFindings" :key="idx" class="finding-item" :class="finding.level">
            <i :class="finding.icon"></i>
            <span>{{ finding.text }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. 关键监测指标（固定高度，内部滚动） -->
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

    <!-- 3. 数据异常（像预警一样，固定高度内部滚动） -->
    <div class="panel alert-panel">
      <div class="panel-header">
        <div class="panel-title">
          <i class="fa-solid fa-bell"></i>
          数据异常
          <span class="alert-count">{{ dataAlerts.length }}</span>
        </div>
      </div>
      <div class="panel-content">
        <div class="alert-scroll-container">
          <div
            v-for="alert in dataAlerts"
            :key="alert.id"
            class="alert-item"
            :class="alert.level"
            @click="handleAlertClick(alert)"
          >
            <div class="alert-icon-wrap">
              <i :class="getAlertIcon(alert.type)"></i>
            </div>
            <div class="alert-content">
              <div class="alert-message">{{ alert.message }}</div>
              <div class="alert-meta">
                <span class="alert-station">{{ alert.station }}</span>
                <span class="alert-time">{{ formatTime(alert.time) }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-if="dataAlerts.length > 3" class="scroll-hint">
          共 {{ dataAlerts.length }} 条异常，滚动查看更多
        </div>
      </div>
    </div>

    <!-- 4. 重点关注区域 -->
    <div class="panel focus-panel" :class="{ collapsed: focusCollapsed }">
      <div class="panel-header" @click="focusCollapsed = !focusCollapsed">
        <div class="panel-title">
          <i class="fa-solid fa-location-dot"></i>
          重点关注区域
          <span class="badge warn">{{ focusAreas.filter(a => a.level === 'high').length }}高风险</span>
        </div>
        <i class="fa-solid fa-chevron-down toggle-icon"></i>
      </div>
      <div class="panel-content">
        <div class="focus-list">
          <div
            v-for="area in focusAreas"
            :key="area.id"
            class="focus-item"
            :class="area.level"
          >
            <div class="focus-header">
              <span class="focus-name">{{ area.name }}</span>
              <span class="focus-level" :class="area.level">
                {{ area.level === 'high' ? '高风险' : '中风险' }}
              </span>
            </div>
            <div class="focus-reason">{{ area.reason }}</div>
            <div class="focus-meta">
              <span><i class="fa-solid fa-users"></i> {{ area.population }}万人</span>
              <span><i class="fa-solid fa-city"></i> {{ area.affectedCities.join('、') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 5. 预测趋势 -->
    <div class="panel prediction-panel" :class="{ collapsed: predictionCollapsed }">
      <div class="panel-header" @click="predictionCollapsed = !predictionCollapsed">
        <div class="panel-title">
          <i class="fa-solid fa-chart-line"></i>
          预测趋势
        </div>
        <i class="fa-solid fa-chevron-down toggle-icon"></i>
      </div>
      <div class="panel-content">
        <div class="prediction-summary">{{ predictions.summary }}</div>
        <div class="prediction-timeline">
          <div
            v-for="(item, idx) in predictions.items"
            :key="idx"
            class="timeline-item"
            :class="item.level"
          >
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <div class="timeline-header">
                <span class="timeline-time">{{ item.time }}</span>
                <span class="timeline-event">{{ item.event }}</span>
              </div>
              <div class="timeline-detail">{{ item.detail }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 6. 应急资源概览 -->
    <div class="panel resource-panel" :class="{ collapsed: resourceCollapsed }">
      <div class="panel-header" @click="resourceCollapsed = !resourceCollapsed">
        <div class="panel-title">
          <i class="fa-solid fa-truck-medical"></i>
          应急资源
        </div>
        <i class="fa-solid fa-chevron-down toggle-icon"></i>
      </div>
      <div class="panel-content">
        <div class="resource-grid">
          <div class="resource-item">
            <div class="resource-label">{{ resources.rescueTeams.label }}</div>
            <div class="resource-value">
              <span class="deployed">{{ resources.rescueTeams.deployed }}</span>
              <span class="total">/{{ resources.rescueTeams.total }}{{ resources.rescueTeams.unit }}</span>
            </div>
            <div class="resource-bar">
              <div class="resource-fill" :style="{ width: (resources.rescueTeams.deployed / resources.rescueTeams.total * 100) + '%' }"></div>
            </div>
          </div>
          <div class="resource-item">
            <div class="resource-label">{{ resources.rescueBoats.label }}</div>
            <div class="resource-value">
              <span class="available">{{ resources.rescueBoats.available }}</span>
              <span class="total">/{{ resources.rescueBoats.total }}{{ resources.rescueBoats.unit }}</span>
            </div>
            <div class="resource-bar">
              <div class="resource-fill green" :style="{ width: (resources.rescueBoats.available / resources.rescueBoats.total * 100) + '%' }"></div>
            </div>
          </div>
          <div class="resource-item">
            <div class="resource-label">{{ resources.shelters.label }}</div>
            <div class="resource-value">
              <span class="activated">{{ resources.shelters.activated }}</span>
              <span class="total">/{{ resources.shelters.total }}{{ resources.shelters.unit }}</span>
            </div>
            <div class="resource-bar">
              <div class="resource-fill purple" :style="{ width: (resources.shelters.activated / resources.shelters.total * 100) + '%' }"></div>
            </div>
          </div>
          <div class="resource-item highlight">
            <div class="resource-label">{{ resources.evacuated.label }}</div>
            <div class="resource-value large">
              <span class="value">{{ resources.evacuated.value }}</span>
              <span class="unit">{{ resources.evacuated.unit }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 7. 设备与数据统计 -->
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '../../stores/app'
import { mockRealtimeData, mockDataAlerts, mockFocusAreas, mockPredictions, mockResources } from '../../data/mockData'

const store = useAppStore()
const emit = defineEmits(['station-click'])

// 面板折叠状态
const focusCollapsed = ref(false)
const predictionCollapsed = ref(false)
const resourceCollapsed = ref(false)
const isRefreshing = ref(false)

// 计算属性
const realtimeData = computed(() => mockRealtimeData)
const dataAlerts = computed(() => mockDataAlerts)
const dataQuality = computed(() => mockRealtimeData.dataQuality)
const focusAreas = computed(() => mockFocusAreas)
const predictions = computed(() => mockPredictions)
const resources = computed(() => mockResources)

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

const lastUpdateText = computed(() => {
  const date = new Date(dataQuality.value.lastUpdate)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
})

// 计算整体风险等级和总结
const overallRiskLevel = computed(() => {
  const overview = realtimeData.value.overview
  let highCount = 0
  let warnCount = 0

  Object.values(overview).forEach(item => {
    if (item.value >= item.threshold.alarm) highCount++
    else if (item.value >= item.threshold.warn) warnCount++
  })

  if (highCount > 0) return 'high'
  if (warnCount > 0) return 'medium'
  return 'low'
})

const conclusionIcon = computed(() => {
  switch (overallRiskLevel.value) {
    case 'high': return 'fa-solid fa-circle-exclamation'
    case 'medium': return 'fa-solid fa-triangle-exclamation'
    default: return 'fa-solid fa-circle-check'
  }
})

const conclusionTitle = computed(() => {
  switch (overallRiskLevel.value) {
    case 'high': return '当前态势紧张，需立即关注'
    case 'medium': return '部分指标异常，建议密切监控'
    default: return '当前态势平稳，各项指标正常'
  }
})

const conclusionDesc = computed(() => {
  const overview = realtimeData.value.overview
  const alerts = []

  if (overview.tideLevel.value >= overview.tideLevel.threshold.warn) {
    alerts.push(`潮位偏高${(overview.tideLevel.value - overview.tideLevel.threshold.warn).toFixed(2)}m`)
  }
  if (overview.waveHeight.value >= overview.waveHeight.threshold.warn) {
    alerts.push(`浪高超警戒`)
  }
  if (overview.windSpeed.value >= overview.windSpeed.threshold.warn) {
    alerts.push(`风力较大`)
  }

  if (alerts.length === 0) {
    return '所有监测站点运行正常，未发现异常情况。'
  }
  return alerts.join('，') + '，请注意防范。'
})

// 关键发现列表
const keyFindings = computed(() => {
  const findings = []
  const overview = realtimeData.value.overview

  if (overview.tideLevel.value >= overview.tideLevel.threshold.alarm) {
    findings.push({
      icon: 'fa-solid fa-water',
      text: `${overview.tideLevel.station}潮位已达${overview.tideLevel.value}m，超过警戒`,
      level: 'high'
    })
  } else if (overview.tideLevel.value >= overview.tideLevel.threshold.warn) {
    findings.push({
      icon: 'fa-solid fa-water',
      text: `${overview.tideLevel.station}潮位接近警戒值`,
      level: 'medium'
    })
  }

  if (overview.waveHeight.value >= overview.waveHeight.threshold.warn) {
    findings.push({
      icon: 'fa-solid fa-wind',
      text: `${overview.waveHeight.station}浪高${overview.waveHeight.value}m，不宜出海`,
      level: overview.waveHeight.value >= overview.waveHeight.threshold.alarm ? 'high' : 'medium'
    })
  }

  if (overview.windSpeed.value >= overview.windSpeed.threshold.warn) {
    findings.push({
      icon: 'fa-solid fa-tornado',
      text: `${overview.windSpeed.station}风速${overview.windSpeed.value}m/s，注意防风`,
      level: overview.windSpeed.value >= overview.windSpeed.threshold.alarm ? 'high' : 'medium'
    })
  }

  if (findings.length === 0) {
    findings.push({
      icon: 'fa-solid fa-check',
      text: '各监测站点数据正常，海况良好',
      level: 'low'
    })
  }

  return findings
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

function getAlertIcon(type) {
  switch (type) {
    case 'threshold_exceed': return 'fa-solid fa-triangle-exclamation'
    case 'rapid_change': return 'fa-solid fa-bolt'
    case 'data_gap': return 'fa-solid fa-link-slash'
    case 'sensor_fault': return 'fa-solid fa-wrench'
    default: return 'fa-solid fa-circle-exclamation'
  }
}

function formatTime(timeStr) {
  const date = new Date(timeStr)
  const now = new Date()
  const diff = Math.floor((now - date) / 60000)
  if (diff < 1) return '刚刚'
  if (diff < 60) return `${diff}分钟前`
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function handleAlertClick(alert) {
  emit('station-click', { id: alert.stationId, name: alert.station })
}

// 模拟数据刷新
let refreshInterval = null
function startRefresh() {
  refreshInterval = setInterval(() => {
    isRefreshing.value = true
    setTimeout(() => {
      isRefreshing.value = false
    }, 500)
  }, 10000)
}

onMounted(() => {
  startRefresh()
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})
</script>

<style scoped>
.realtime-panel {
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
.realtime-panel::-webkit-scrollbar {
  width: 4px;
}

.realtime-panel::-webkit-scrollbar-track {
  background: transparent;
}

.realtime-panel::-webkit-scrollbar-thumb {
  background: var(--border-subtle);
  border-radius: 2px;
}

.realtime-panel::-webkit-scrollbar-thumb:hover {
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
  font-size: 13px;
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
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.conclusion-desc {
  font-size: 10px;
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
  font-size: 10px;
  padding: 4px 6px;
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
  font-size: 12px;
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
  max-height: 200px;  /* 约2行卡片高度 */
  overflow-y: auto;
  padding-right: 4px;
}

.data-cards-scroll::-webkit-scrollbar {
  width: 3px;
}

.data-cards-scroll::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.data-cards-scroll::-webkit-scrollbar-thumb {
  background: var(--accent-cyan);
  border-radius: 2px;
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

/* 数据异常 - 红色主题 */
.alert-panel::before {
  background: linear-gradient(90deg, transparent, #ef4444 30%, #ef4444 70%, transparent);
}

.alert-panel .panel-title {
  color: #ef4444;
}

.alert-panel .panel-header {
  cursor: default;
}

.alert-panel .panel-header:hover {
  background: transparent;
}

.alert-scroll-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 150px;  /* 约2-3条的高度 */
  overflow-y: auto;
  padding-right: 4px;
}

.alert-scroll-container::-webkit-scrollbar {
  width: 3px;
}

.alert-scroll-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.alert-scroll-container::-webkit-scrollbar-thumb {
  background: rgba(239, 68, 68, 0.5);
  border-radius: 2px;
}

.scroll-hint {
  text-align: center;
  font-size: 9px;
  color: var(--text-muted);
  padding-top: 6px;
  border-top: 1px solid var(--border-subtle);
  margin-top: 6px;
}

.alert-item {
  display: flex;
  gap: 8px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(30, 40, 60, 0.4);
  flex-shrink: 0;
}

.alert-item:hover {
  background: rgba(40, 50, 70, 0.6);
}

.alert-item.high {
  border-left: 2px solid #ef4444;
}

.alert-item.medium {
  border-left: 2px solid #f59e0b;
}

.alert-item.low {
  border-left: 2px solid #6b7280;
}

.alert-icon-wrap {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  flex-shrink: 0;
}

.alert-item.high .alert-icon-wrap {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.alert-item.medium .alert-icon-wrap {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.alert-item.low .alert-icon-wrap {
  background: rgba(107, 114, 128, 0.2);
  color: #9ca3af;
}

.alert-content {
  flex: 1;
  min-width: 0;
}

.alert-message {
  font-size: 10px;
  color: var(--text-secondary);
  line-height: 1.3;
}

.alert-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 9px;
  color: var(--text-muted);
}

/* 重点关注区域 */
.focus-panel::before {
  background: linear-gradient(90deg, transparent, #ef4444 30%, #ef4444 70%, transparent);
}

.focus-panel .panel-title {
  color: #ef4444;
}

.focus-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.focus-item {
  padding: 10px;
  border-radius: 6px;
  background: rgba(30, 40, 60, 0.4);
}

.focus-item.high {
  border-left: 3px solid #ef4444;
  background: rgba(239, 68, 68, 0.05);
}

.focus-item.medium {
  border-left: 3px solid #f59e0b;
  background: rgba(245, 158, 11, 0.05);
}

.focus-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.focus-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.focus-level {
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 4px;
}

.focus-level.high {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.focus-level.medium {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.focus-reason {
  font-size: 10px;
  color: var(--text-secondary);
  line-height: 1.4;
  margin-bottom: 6px;
}

.focus-meta {
  display: flex;
  gap: 12px;
  font-size: 9px;
  color: var(--text-muted);
}

.focus-meta i {
  margin-right: 4px;
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

/* 应急资源 */
.resource-panel::before {
  background: linear-gradient(90deg, transparent, #f97316 30%, #f97316 70%, transparent);
}

.resource-panel .panel-title {
  color: #f97316;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.resource-item {
  padding: 8px;
  background: rgba(30, 40, 60, 0.4);
  border-radius: 6px;
}

.resource-item.highlight {
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(249, 115, 22, 0.05));
  border: 1px solid rgba(249, 115, 22, 0.3);
}

.resource-label {
  font-size: 9px;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.resource-value {
  font-size: 12px;
  color: var(--text-primary);
}

.resource-value .deployed,
.resource-value .available,
.resource-value .activated {
  font-weight: 700;
  color: #f97316;
}

.resource-value .total {
  font-size: 10px;
  color: var(--text-muted);
}

.resource-value.large {
  font-size: 16px;
}

.resource-value.large .value {
  font-weight: 700;
  color: #f97316;
}

.resource-value.large .unit {
  font-size: 10px;
  color: var(--text-muted);
}

.resource-bar {
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  margin-top: 6px;
  overflow: hidden;
}

.resource-fill {
  height: 100%;
  background: #f97316;
  border-radius: 2px;
  transition: width 0.5s;
}

.resource-fill.green {
  background: #10b981;
}

.resource-fill.purple {
  background: #8b5cf6;
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
