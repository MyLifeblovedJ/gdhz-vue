<template>
  <div class="right-sidebar" :class="{ 'high-risk-mode': hasHighRisk }">
    <!-- 灾害预警概览 -->
    <div class="panel disaster-panel">
      <div class="panel-title">
        <i class="fa-solid fa-triangle-exclamation"></i>
        当前灾害预警
      </div>
      <div class="current-alerts">
        <div 
          v-for="alert in currentAlerts" 
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
    </div>

    <!-- 风险决策面板 (核心) -->
    <div class="panel risk-panel">
      <div class="panel-title">
        <i class="fa-solid fa-gavel"></i>
        风险研判与决策
      </div>
      <div class="panel-scroll">
        <RiskDecisionPanel @risk-click="handleRiskClick"/>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../../stores/app'
import RiskDecisionPanel from '../decision/RiskDecisionPanel.vue'

const store = useAppStore()

const currentAlerts = computed(() => store.alerts.slice(0, 5))

// 检测是否有高风险
const hasHighRisk = computed(() => 
  store.riskDecisions?.risks?.some(r => r.level === 'high') || false
)

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

.panel {
  background: var(--bg-panel);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-normal);
  border-radius: var(--border-radius);
  padding: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: var(--shadow-panel);
}

/* 面板顶部光条 */
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

.panel-title {
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 600;
  color: var(--accent-cyan);
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin-bottom: 10px;
  padding-left: 8px;
  border-left: 2px solid var(--accent-cyan);
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 灾害预警面板 */
.disaster-panel {
  flex-shrink: 0;
  max-height: 330px; /* 增加面板最大高度 */
  display: flex;
  flex-direction: column;
}

.current-alerts {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  max-height: 232px; /* 精确显示3条：卡片72px*3 + 间距8px*2 = 232px */
  padding-right: 4px;
}

/* 预警列表滚动条美化 */
.current-alerts::-webkit-scrollbar {
  width: 4px;
}

.current-alerts::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.current-alerts::-webkit-scrollbar-thumb {
  background: rgba(239, 68, 68, 0.5);
  border-radius: 2px;
}

.alert-card {
  display: flex;
  align-items: center; /* 垂直居中对齐 */
  gap: 12px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
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
  width: 50px;
  height: 50px; /* 增大图标尺寸 */
  filter: drop-shadow(0 0 8px rgba(255, 100, 100, 0.6));
  animation: pulse-icon 2s ease-in-out infinite;
  flex-shrink: 0;
  object-fit: contain; /* 保持比例 */
}

@keyframes pulse-icon {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
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

.alert-meta {
  margin-top: 3px;
}

.alert-issuer {
  font-size: 10px;
  color: var(--text-muted);
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

/* 风险决策面板 */
.risk-panel {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.panel-scroll {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

.panel-scroll::-webkit-scrollbar {
  width: 4px;
}

.panel-scroll::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.panel-scroll::-webkit-scrollbar-thumb {
  background: var(--accent-cyan);
  border-radius: 2px;
}
</style>
