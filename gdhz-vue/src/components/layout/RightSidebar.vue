<template>
  <div class="decision-sidebar" :class="{ 'high-risk-mode': hasHighRisk }">
    <!-- 1. 当前预警 -->
    <div class="panel alert-panel">
      <div class="panel-header">
        <div class="panel-title">
          <i class="fa-solid fa-triangle-exclamation"></i>
          当前预警
          <span class="badge">{{ store.alerts.length }}</span>
        </div>
      </div>
      <div class="panel-content">
        <div class="panel-summary summary-alert">{{ alertPanelSummary }}</div>
        <div class="alerts-scroll-container">
          <div
            v-for="alert in displayAlerts"
            :key="alert.id"
            class="alert-card"
            :class="alert.level"
            @click="handleAlertClick(alert)"
          >
            <img
              :src="alert.icon"
              :alt="alert.title"
              @error="handleImageError"
              class="alert-icon"
            >
            <div class="alert-info">
              <div class="alert-title">{{ alert.title }}</div>
              <div class="alert-time-row">
                <span class="alert-time">发布: 今日 {{ alert.time }}</span>
                <span class="alert-valid">有效至: {{ alert.validUntil }}</span>
              </div>
            </div>
          </div>
          <!-- 历史预警入口 -->
          <div class="history-entry" @click="handleViewHistory">
            <i class="fa-solid fa-clock-rotate-left"></i>
            <span>查看历史预警记录</span>
            <i class="fa-solid fa-chevron-right"></i>
          </div>
        </div>
        <div v-if="store.alerts.length > 3" class="alerts-more">
          共 {{ store.alerts.length }} 条预警，滚动查看更多
        </div>
      </div>
    </div>


    <!-- 2. AI态势摘要（融合态势研判+预测趋势+重点风险） -->
    <AISituationSummary 
      :header-summary="situationPanelSummary"
      @risk-click="handleRiskClick"
      @refresh="handleAIRefresh"
    />

    <!-- 5. 决策建议 -->
    <div class="panel decision-panel" :class="{ collapsed: decisionCollapsed }">
      <div class="panel-header" @click="decisionCollapsed = !decisionCollapsed">
        <div class="panel-title">
          <i class="fa-solid fa-bullhorn"></i>
          决策建议
        </div>
        <i class="fa-solid fa-chevron-down toggle-icon"></i>
      </div>
      <div class="panel-content">
        <!-- 应急响应状态（亮色卡片） -->
        <div class="response-card" :class="responseLevel.class">
          <div class="response-header">
            <span class="response-title">当前响应等级</span>
            <div class="level-dots">
              <span class="dot" :class="{ active: responseLevel.levelKey === 'I' }"></span>
              <span class="dot" :class="{ active: ['I', 'II'].includes(responseLevel.levelKey) }"></span>
              <span class="dot" :class="{ active: ['I', 'II', 'III'].includes(responseLevel.levelKey) }"></span>
              <span class="dot active"></span>
            </div>
          </div>
          <div class="response-body">
            <i class="fa-solid fa-shield-halved level-icon"></i>
            <span class="level-name">{{ responseLevel.short }}</span>
          </div>
        </div>

        <!-- 决策要点列表 -->
        <div class="decision-points">
          <div class="points-title">建议措施</div>
          <div class="points-list">
            <div v-for="(action, idx) in keyActions" :key="idx" class="point-item">
              <span class="point-number">{{ idx + 1 }}</span>
              <span class="point-text">{{ action }}</span>
            </div>
          </div>
        </div>

        <!-- 快捷操作 -->
        <div class="quick-actions">
          <button class="action-btn" @click="handleStartMeeting">
            <i class="fa-solid fa-video"></i>
            启动会商
          </button>
          <button class="action-btn" @click="handleViewPlan">
            <i class="fa-solid fa-file-lines"></i>
            应急预案
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '../../stores/app'
import AISituationSummary from '../decision/AISituationSummary.vue'
import { mockRealtimeData, mockPredictions } from '../../data/mockData'

const store = useAppStore()

// 面板折叠状态
const situationCollapsed = ref(false)
const predictionCollapsed = ref(true)
const decisionCollapsed = ref(false)

// 显示的预警
const displayAlerts = computed(() => store.alerts)

const alertLevelConfig = {
  red: { label: '红', weight: 4 },
  orange: { label: '橙', weight: 3 },
  yellow: { label: '黄', weight: 2 },
  blue: { label: '蓝', weight: 1 }
}

const alertPanelSummary = computed(() => {
  const alerts = displayAlerts.value
  if (!alerts.length) {
    return '摘要：当前暂无预警，保持常态监测。'
  }

  const levelCount = { red: 0, orange: 0, yellow: 0, blue: 0 }
  alerts.forEach(alert => {
    if (levelCount[alert.level] !== undefined) {
      levelCount[alert.level] += 1
    }
  })

  const levelText = ['red', 'orange', 'yellow', 'blue']
    .filter(level => levelCount[level] > 0)
    .map(level => `${alertLevelConfig[level].label}${levelCount[level]}条`)
    .join('，')

  const topAlert = [...alerts].sort((a, b) => {
    const wa = alertLevelConfig[a.level]?.weight || 0
    const wb = alertLevelConfig[b.level]?.weight || 0
    return wb - wa
  })[0]

  return `摘要：${levelText}，重点关注${topAlert.title}。`
})

// 预测趋势数据
const predictions = computed(() => mockPredictions)

// 检测是否有高风险
const hasHighRisk = computed(() =>
  store.riskDecisions?.risks?.some(r => r.level === 'high') || false
)

// === 态势研判相关计算属性 ===
const realtimeData = computed(() => mockRealtimeData)

// 计算整体风险等级
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
  const tide = overview?.tideLevel
  const wave = overview?.waveHeight
  const wind = overview?.windSpeed

  if (tide && tide.value >= tide.threshold.warn) {
    alerts.push(`潮位偏高${(tide.value - tide.threshold.warn).toFixed(2)}m`)
  }
  if (wave && wave.value >= wave.threshold.warn) {
    alerts.push(`浪高超警戒`)
  }
  if (wind && wind.value >= wind.threshold.warn) {
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
  const tide = overview?.tideLevel
  const wave = overview?.waveHeight
  const wind = overview?.windSpeed

  if (tide && tide.value >= tide.threshold.alarm) {
    findings.push({
      icon: 'fa-solid fa-water',
      text: `${tide.station}潮位已达${tide.value}m，超过警戒`,
      level: 'high'
    })
  } else if (tide && tide.value >= tide.threshold.warn) {
    findings.push({
      icon: 'fa-solid fa-water',
      text: `${tide.station}潮位接近警戒值`,
      level: 'medium'
    })
  }

  if (wave && wave.value >= wave.threshold.warn) {
    findings.push({
      icon: 'fa-solid fa-wind',
      text: `${wave.station}浪高${wave.value}m，不宜出海`,
      level: wave.value >= wave.threshold.alarm ? 'high' : 'medium'
    })
  }

  if (wind && wind.value >= wind.threshold.warn) {
    findings.push({
      icon: 'fa-solid fa-tornado',
      text: `${wind.station}风速${wind.value}m/s，注意防风`,
      level: wind.value >= wind.threshold.alarm ? 'high' : 'medium'
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
const situationPanelSummary = computed(() => {
  const findings = keyFindings.value.slice(0, 2).map(item => item.text).join('；')
  return `摘要：${conclusionTitle.value}。${findings || '当前海况平稳，持续监测。'}`
})

function getStatusText(level) {
  switch (level) {
    case 'high': return '紧张'
    case 'medium': return '关注'
    default: return '平稳'
  }
}

// 应急响应等级
const responseLevel = computed(() => {
  const level = store.riskDecisions?.recommendations?.responseLevel || 'IV'
  const levels = {
    'I': { short: 'I级响应', class: 'level-1', levelKey: 'I' },
    'II': { short: 'II级响应', class: 'level-2', levelKey: 'II' },
    'III': { short: 'III级响应', class: 'level-3', levelKey: 'III' },
    'IV': { short: 'IV级响应', class: 'level-4', levelKey: 'IV' },
  }
  return levels[level] || levels['IV']
})

// 关键决策行动
const keyActions = computed(() => {
  return store.riskDecisions?.recommendations?.actions?.slice(0, 5) || [
    '密切监测灾害发展态势',
    '做好应急值守准备',
    '及时发布预警信息',
    '通知相关部门做好防范',
    '检查应急物资储备情况'
  ]
})

const emit = defineEmits(['risk-click'])

function handleAlertClick(alert) {
  console.log('Alert clicked:', alert)
}

function handleImageError(e) {
  e.target.style.display = 'none'
}

function handleStartMeeting() {
  console.log('启动会商')
  alert('视频会商系统启动中...')
}

function handleViewPlan() {
  console.log('查看应急预案')
  alert('正在加载应急预案...')
}

function handleViewHistory() {
  alert('历史预警查询功能开发中...')
}

// AI态势摘要事件处理
function handleRiskClick(risk) {
  console.log('定位到风险区域:', risk.name, risk.lat, risk.lng)
  emit('risk-click', risk)
}

function handleAIRefresh() {
  console.log('AI态势摘要刷新')
}
</script>

<style scoped>
.decision-sidebar {
  width: 340px;
  flex-shrink: 0;
  background: var(--bg-deepest);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  padding: 8px 10px;
  gap: 10px;
  overflow-y: auto;
  z-index: 50;
  transition: border-color 0.5s, box-shadow 0.5s;
  /* 启用 GPU 加速，优化滚动性能 */
  transform: translateZ(0);
  will-change: scroll-position;
  -webkit-overflow-scrolling: touch;
}

/* 侧边栏滚动条 */
.decision-sidebar::-webkit-scrollbar {
  width: 4px;
}

.decision-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.decision-sidebar::-webkit-scrollbar-thumb {
  background: var(--border-subtle);
  border-radius: 2px;
}

.decision-sidebar::-webkit-scrollbar-thumb:hover {
  background: var(--accent-cyan);
}

/* 高风险模式 - 微红色边框呼吸 */
.decision-sidebar.high-risk-mode {
  animation: sidebar-risk-pulse 3s ease-in-out infinite;
}

@keyframes sidebar-risk-pulse {
  0%, 100% {
    border-right-color: var(--border-subtle);
    box-shadow: inset -2px 0 10px rgba(239, 68, 68, 0.05);
  }
  50% {
    border-right-color: rgba(239, 68, 68, 0.6);
    box-shadow: inset -3px 0 20px rgba(239, 68, 68, 0.15);
  }
}

/* 通用摘要条 */
.panel-summary {
  margin-bottom: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
  background: rgba(255, 255, 255, 0.03);
}

.panel-summary.summary-situation {
  border-color: rgba(16, 185, 129, 0.25);
  background: rgba(16, 185, 129, 0.08);
}

.panel-summary.summary-alert {
  margin-bottom: 8px;
  border-color: rgba(245, 158, 11, 0.3);
  background: rgba(245, 158, 11, 0.08);
}

/* 历史预警入口 */
.history-entry {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  margin-top: 4px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  border: 1px dashed var(--border-subtle);
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-muted);
  font-size: 11px;
}

.history-entry:hover {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.4);
  color: #60a5fa;
}

.history-entry span {
  flex: 1;
}

.history-entry i:first-child {
  font-size: 12px;
}

.history-entry i:last-child {
  font-size: 10px;
  opacity: 0.6;
}

/* ===== 态势研判面板 ===== */
.situation-panel::before {
  background: linear-gradient(90deg, transparent, #10b981 30%, #10b981 70%, transparent);
}

.situation-panel .panel-title {
  color: #10b981;
}

.status-badge {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.status-badge.high {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.status-badge.medium {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.status-badge.low {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

/* 结论卡片 */
.summary-conclusion {
  display: flex;
  gap: 12px;
  padding: 12px;
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
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
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
  width: 14px;
  text-align: center;
}

.finding-item.low { color: var(--text-secondary); }
.finding-item.low i { color: #10b981; }
.finding-item.medium { color: var(--text-secondary); background: rgba(245, 158, 11, 0.05); }
.finding-item.medium i { color: #f59e0b; }
.finding-item.high { color: var(--text-primary); background: rgba(239, 68, 68, 0.08); }
.finding-item.high i { color: #ef4444; }

/* ===== 预测趋势面板 ===== */
.prediction-panel::before {
  background: linear-gradient(90deg, transparent, #8b5cf6 30%, #8b5cf6 70%, transparent);
}

.prediction-panel .panel-title {
  color: #8b5cf6;
}

.prediction-summary {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
  padding: 8px 10px;
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
  font-size: 10px;
  color: var(--text-muted);
  white-space: nowrap;
}

.timeline-event {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.timeline-detail {
  font-size: 10px;
  color: var(--text-muted);
  line-height: 1.4;
}

/* 图标旋转 */
.toggle-icon.rotated {
  transform: rotate(180deg);
}

/* 展开提示 */
.expand-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  font-size: 11px;
  color: var(--text-muted);
  cursor: pointer;
  border-top: 1px solid var(--border-subtle);
  margin-top: 8px;
  transition: all 0.2s;
}

.expand-hint:hover {
  color: var(--accent-cyan);
  background: rgba(0, 255, 255, 0.05);
}

.expand-hint i {
  animation: bounce 1.5s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(3px); }
}

/* 时间线折叠动画 */
.slide-timeline-enter-active,
.slide-timeline-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-timeline-enter-from,
.slide-timeline-leave-to {
  opacity: 0;
  max-height: 0;
}

.slide-timeline-enter-to,
.slide-timeline-leave-from {
  opacity: 1;
  max-height: 300px;
}

/* ===== 面板通用样式 ===== */
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
  background: linear-gradient(90deg,
    transparent,
    var(--accent-cyan) 30%,
    var(--accent-cyan) 70%,
    transparent);
  opacity: 0.6;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
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
  font-size: 10px;
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  padding: 2px 6px;
  border-radius: 10px;
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

/* ===== 预警面板 ===== */
.alert-panel .panel-header {
  cursor: default;
}

.alert-panel .panel-header:hover {
  background: transparent;
}

.alerts-scroll-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;  /* 约3条预警的高度 */
  overflow-y: auto;
  padding-right: 4px;
  /* 启用 GPU 加速，优化滚动性能 */
  transform: translateZ(0);
  contain: layout style paint;
}

.alerts-scroll-container::-webkit-scrollbar {
  width: 3px;
}

.alerts-scroll-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.alerts-scroll-container::-webkit-scrollbar-thumb {
  background: rgba(239, 68, 68, 0.5);
  border-radius: 2px;
}

.alerts-more {
  text-align: center;
  font-size: 10px;
  color: var(--text-muted);
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle);
  margin-top: 8px;
}

.alert-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  /* 优化：只过渡需要的属性 */
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  flex-shrink: 0;
  /* 限制重绘区域 */
  contain: layout style;
}

.alert-card.red {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05));
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.alert-card.orange {
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(249, 115, 22, 0.05));
  border: 1px solid rgba(249, 115, 22, 0.3);
}

.alert-card.yellow {
  background: linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(234, 179, 8, 0.05));
  border: 1px solid rgba(234, 179, 8, 0.3);
}

.alert-card:hover {
  transform: translateX(-4px);
  box-shadow: 4px 0 15px rgba(0, 0, 0, 0.3);
}

.alert-icon {
  width: 44px;
  height: 44px;
  filter: drop-shadow(0 0 6px rgba(255, 100, 100, 0.5));
  animation: pulse-icon 2s ease-in-out infinite;
  flex-shrink: 0;
  object-fit: contain;
}

@keyframes pulse-icon {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.alert-info {
  flex: 1;
  min-width: 0;
}

.alert-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.3;
}

.alert-time-row {
  display: flex;
  gap: 10px;
  margin-top: 6px;
  flex-wrap: wrap;
}

.alert-time {
  font-size: 10px;
  color: var(--text-muted);
}

.alert-valid {
  font-size: 10px;
  color: var(--accent-cyan);
}

/* ===== 风险研判面板 ===== */
.risk-panel::before {
  background: linear-gradient(90deg,
    transparent,
    #f59e0b 30%,
    #f59e0b 70%,
    transparent);
}

.risk-panel .panel-title {
  color: #f59e0b;
}

/* ===== 决策建议面板 ===== */
.decision-panel::before {
  background: linear-gradient(90deg,
    transparent,
    #10b981 30%,
    #10b981 70%,
    transparent);
}

.decision-panel .panel-title {
  color: #10b981;
}

/* 应急响应卡片（亮色设计） */
.response-card {
  position: relative;
  padding: 12px 14px;
  border-radius: 10px;
  margin-bottom: 12px;
  overflow: hidden;
}

/* 各等级颜色 */
.response-card.level-1 {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.05));
  border: 1px solid rgba(239, 68, 68, 0.5);
  box-shadow: 0 0 16px rgba(239, 68, 68, 0.25);
}

.response-card.level-2 {
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(249, 115, 22, 0.05));
  border: 1px solid rgba(249, 115, 22, 0.5);
  box-shadow: 0 0 16px rgba(249, 115, 22, 0.25);
}

.response-card.level-3 {
  background: linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(234, 179, 8, 0.05));
  border: 1px solid rgba(234, 179, 8, 0.5);
  box-shadow: 0 0 16px rgba(234, 179, 8, 0.25);
}

.response-card.level-4 {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.03));
  border: 1px solid rgba(59, 130, 246, 0.4);
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.15);
}

/* 顶部：标题 + 指示灯 */
.response-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.response-title {
  font-size: 10px;
  color: var(--text-muted);
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* 等级指示灯 */
.level-dots {
  display: flex;
  gap: 5px;
}

.level-dots .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.3s;
}

.level-1 .level-dots .dot.active {
  background: #ef4444;
  box-shadow: 0 0 8px #ef4444;
}

.level-2 .level-dots .dot.active {
  background: #f97316;
  box-shadow: 0 0 8px #f97316;
}

.level-3 .level-dots .dot.active {
  background: #eab308;
  box-shadow: 0 0 8px #eab308;
}

.level-4 .level-dots .dot.active {
  background: #3b82f6;
  box-shadow: 0 0 6px #3b82f6;
}

/* 底部：图标 + 等级名称 */
.response-body {
  display: flex;
  align-items: center;
  gap: 10px;
}

.level-icon {
  font-size: 22px;
}

.level-1 .level-icon { color: #ef4444; }
.level-2 .level-icon { color: #f97316; }
.level-3 .level-icon { color: #eab308; }
.level-4 .level-icon { color: #3b82f6; }

.level-name {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 1px;
}

.level-1 .level-name { color: #ef4444; }
.level-2 .level-name { color: #f97316; }
.level-3 .level-name { color: #eab308; }
.level-4 .level-name { color: #60a5fa; }

/* 决策要点列表 */
.decision-points {
  margin-bottom: 12px;
}

.points-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.points-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.point-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.point-number {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.point-text {
  flex: 1;
}

/* 快捷操作 */
.quick-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle);
}

.action-btn {
  flex: 1;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid var(--border-subtle);
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(16, 185, 129, 0.1);
  border-color: #10b981;
  color: #10b981;
}
</style>
