<template>
  <div class="right-sidebar" :class="{ 'high-risk-mode': hasHighRisk }">
    <!-- 1. 当前预警（首要信息，默认显示3条，多余滚动） -->
    <div class="panel alert-panel">
      <div class="panel-header">
        <div class="panel-title">
          <i class="fa-solid fa-triangle-exclamation"></i>
          当前预警
          <span class="badge">{{ store.alerts.length }}</span>
        </div>
      </div>
      <div class="panel-content">
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
        </div>
        <div v-if="store.alerts.length > 3" class="alerts-more">
          共 {{ store.alerts.length }} 条预警，滚动查看更多
        </div>
      </div>
    </div>

    <!-- 2. 风险研判（可折叠） -->
    <div class="panel risk-panel" :class="{ collapsed: riskCollapsed }">
      <div class="panel-header" @click="riskCollapsed = !riskCollapsed">
        <div class="panel-title">
          <i class="fa-solid fa-gavel"></i>
          风险研判
        </div>
        <i class="fa-solid fa-chevron-down toggle-icon"></i>
      </div>
      <div class="panel-content">
        <RiskDecisionPanel @risk-click="handleRiskClick"/>
      </div>
    </div>

    <!-- 3. 决策建议（可折叠，包含弱化的应急响应） -->
    <div class="panel decision-panel" :class="{ collapsed: decisionCollapsed }">
      <div class="panel-header" @click="decisionCollapsed = !decisionCollapsed">
        <div class="panel-title">
          <i class="fa-solid fa-bullhorn"></i>
          决策建议
        </div>
        <i class="fa-solid fa-chevron-down toggle-icon"></i>
      </div>
      <div class="panel-content">
        <!-- 应急响应状态（弱化显示） -->
        <div class="response-status" :class="responseLevel.class">
          <div class="response-info">
            <span class="response-label">当前响应等级</span>
            <span class="response-value">{{ responseLevel.text }}</span>
          </div>
          <div class="response-desc">{{ responseLevel.desc }}</div>
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
import RiskDecisionPanel from '../decision/RiskDecisionPanel.vue'

const store = useAppStore()

// 面板折叠状态
const riskCollapsed = ref(false)
const decisionCollapsed = ref(false)

// 显示的预警（默认显示所有，通过滚动查看）
const displayAlerts = computed(() => store.alerts)

// 检测是否有高风险
const hasHighRisk = computed(() =>
  store.riskDecisions?.risks?.some(r => r.level === 'high') || false
)

// 应急响应等级（弱化显示）
const responseLevel = computed(() => {
  const level = store.riskDecisions?.recommendations?.responseLevel || 'IV'
  const levels = {
    'I': { text: 'I级（一级响应）', class: 'level-1', desc: '特别重大灾害，全省联动' },
    'II': { text: 'II级（二级响应）', class: 'level-2', desc: '重大灾害，省级协调' },
    'III': { text: 'III级（三级响应）', class: 'level-3', desc: '较大灾害，市级主导' },
    'IV': { text: 'IV级（四级响应）', class: 'level-4', desc: '一般灾害，县级处置' },
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

function handleRiskClick(risk) {
  emit('risk-click', risk)
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
</script>

<style scoped>
.right-sidebar {
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
}

/* 侧边栏滚动条 */
.right-sidebar::-webkit-scrollbar {
  width: 4px;
}

.right-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.right-sidebar::-webkit-scrollbar-thumb {
  background: var(--border-subtle);
  border-radius: 2px;
}

.right-sidebar::-webkit-scrollbar-thumb:hover {
  background: var(--accent-cyan);
}

/* 高风险模式 - 微红色边框呼吸 */
.right-sidebar.high-risk-mode {
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

/* ===== 面板通用样式 ===== */
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
  transition: all 0.2s;
  flex-shrink: 0;
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
  font-size: 12px;
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
  font-size: 9px;
  color: var(--text-muted);
}

.alert-valid {
  font-size: 9px;
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

/* 应急响应状态（弱化） */
.response-status {
  padding: 10px 12px;
  border-radius: 6px;
  margin-bottom: 12px;
}

.response-status.level-1 {
  background: rgba(239, 68, 68, 0.1);
  border-left: 3px solid #ef4444;
}

.response-status.level-2 {
  background: rgba(249, 115, 22, 0.1);
  border-left: 3px solid #f97316;
}

.response-status.level-3 {
  background: rgba(234, 179, 8, 0.1);
  border-left: 3px solid #eab308;
}

.response-status.level-4 {
  background: rgba(59, 130, 246, 0.1);
  border-left: 3px solid #3b82f6;
}

.response-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.response-label {
  font-size: 10px;
  color: var(--text-muted);
}

.response-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.response-status.level-1 .response-value { color: #ef4444; }
.response-status.level-2 .response-value { color: #f97316; }
.response-status.level-3 .response-value { color: #eab308; }
.response-status.level-4 .response-value { color: #3b82f6; }

.response-desc {
  font-size: 10px;
  color: var(--text-muted);
}

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
