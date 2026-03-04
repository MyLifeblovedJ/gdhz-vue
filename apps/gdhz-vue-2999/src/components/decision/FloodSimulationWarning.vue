<template>
  <div class="panel flood-sim-panel" :class="{ collapsed: isCollapsed, 'has-data': hasSimulationData }">
    <div class="panel-header" @click="isCollapsed = !isCollapsed">
      <div class="panel-title">
        <i class="fa-solid fa-water"></i>
        漫滩模拟预警
        <span v-if="hasSimulationData" class="new-badge">最新</span>
      </div>
      <i class="fa-solid fa-chevron-down toggle-icon"></i>
    </div>

    <div class="panel-content">
      <template v-if="hasSimulationData">
        <!-- 模拟信息头部 -->
        <div class="sim-header">
          <div class="sim-meta">
            <div class="meta-item">
              <span class="meta-label">模拟时间:</span>
              <span class="meta-value">{{ simulation.metadata.simulationPeriod.start.split(' ')[1] }} - {{ simulation.metadata.simulationPeriod.end.split(' ')[1] }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">数据来源:</span>
              <span class="meta-value">{{ simulation.metadata.source }}</span>
            </div>
          </div>
        </div>

        <!-- 关键风险提示 -->
        <div class="risk-alert">
          <div class="alert-icon">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div class="alert-title">关键风险提示</div>
        </div>

        <div class="key-metrics">
          <div class="metric-item">
            <span class="metric-label">最大淹没范围</span>
            <span class="metric-value">{{ simulation.summary.maxFloodArea }} km²</span>
          </div>
          <div class="metric-item highlight">
            <span class="metric-label">最大水深</span>
            <span class="metric-value">{{ simulation.summary.maxWaterDepth }}m</span>
            <span class="metric-location">@ {{ simulation.summary.maxDepthLocation }}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">峰值时间</span>
            <span class="metric-value time">{{ formatTime(simulation.summary.peakTime) }}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">持续时长</span>
            <span class="metric-value">约 {{ simulation.summary.duration }} 小时</span>
          </div>
        </div>

        <!-- 并发风险 -->
        <div class="concurrent-risks">
          <div class="risks-title">
            <i class="fa-solid fa-fire"></i>
            并发风险（与承灾体叠加）
          </div>
          <div class="risks-list">
            <div
              v-for="risk in simulation.concurrentRisks"
              :key="risk.id"
              class="risk-item"
              :class="risk.riskLevel"
              @click="handleRiskClick(risk)"
            >
              <div class="risk-header">
                <span class="risk-name">{{ risk.name }}</span>
                <span class="risk-depth">淹没{{ risk.predictedDepth }}m</span>
              </div>
              <div class="risk-suggestion">{{ risk.suggestion }}</div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="sim-actions">
          <button class="action-btn primary" @click="handlePlayAnimation">
            <i class="fa-solid fa-play"></i>
            播放动画
          </button>
          <button class="action-btn" @click="handleViewDetail">
            <i class="fa-solid fa-chart-area"></i>
            查看详情
          </button>
        </div>
      </template>

      <template v-else>
        <div class="no-data">
          <i class="fa-solid fa-circle-info"></i>
          <span>暂无漫滩模拟数据</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { mockFloodSimulation } from '../../data/seaConditionData'

const isCollapsed = ref(true)
const hasSimulationData = ref(true)  // 是否有模拟数据

const emit = defineEmits(['play-animation', 'risk-click'])

const simulation = computed(() => mockFloodSimulation)

function formatTime(datetime) {
  const time = datetime.split(' ')[1]
  return `今日 ${time}`
}

function handlePlayAnimation() {
  emit('play-animation')
}

function handleViewDetail() {
  console.log('View flood simulation detail')
}

function handleRiskClick(risk) {
  emit('risk-click', risk)
}
</script>

<style scoped>
.flood-sim-panel {
  background: var(--bg-panel);
  border: 1px solid var(--border-normal);
  border-radius: var(--border-radius);
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
}

.flood-sim-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 15%;
  right: 15%;
  height: 1px;
  background: linear-gradient(90deg, transparent, #ef4444 30%, #ef4444 70%, transparent);
  opacity: 0.6;
}

.flood-sim-panel.has-data {
  border-color: rgba(239, 68, 68, 0.4);
  animation: panel-pulse 3s ease-in-out infinite;
}

@keyframes panel-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
  50% { box-shadow: 0 0 12px 2px rgba(239, 68, 68, 0.15); }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.panel-header:hover {
  background: var(--bg-hover);
}

.panel-title {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 600;
  color: #ef4444;
  display: flex;
  align-items: center;
  gap: 8px;
}

.new-badge {
  font-size: 9px;
  padding: 2px 6px;
  background: #ef4444;
  color: white;
  border-radius: 4px;
  font-weight: 600;
  animation: badge-blink 1.5s ease-in-out infinite;
}

@keyframes badge-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.toggle-icon {
  color: var(--text-muted);
  font-size: 10px;
  transition: transform 0.2s;
}

.flood-sim-panel.collapsed .toggle-icon {
  transform: rotate(-90deg);
}

.panel-content {
  padding: 0 12px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 600px;
  overflow: hidden;
  transition: max-height 0.3s, padding 0.3s;
}

.flood-sim-panel.collapsed .panel-content {
  max-height: 0;
  padding: 0 12px;
}

/* 模拟信息头部 */
.sim-header {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  padding: 8px 10px;
}

.sim-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
}

.meta-label {
  color: var(--text-muted);
}

.meta-value {
  color: var(--text-secondary);
}

/* 风险提示 */
.risk-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.15), transparent);
  border-left: 3px solid #ef4444;
  border-radius: 4px;
}

.alert-icon {
  color: #ef4444;
  font-size: 14px;
  animation: alert-pulse 1.5s ease-in-out infinite;
}

@keyframes alert-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

.alert-title {
  font-size: 12px;
  font-weight: 600;
  color: #f87171;
}

/* 关键指标 */
.key-metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.metric-item {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-item.highlight {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.metric-label {
  font-size: 10px;
  color: var(--text-muted);
}

.metric-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-mono);
}

.metric-item.highlight .metric-value {
  color: #ef4444;
}

.metric-value.time {
  color: #fbbf24;
}

.metric-location {
  font-size: 10px;
  color: var(--text-muted);
}

/* 并发风险 */
.concurrent-risks {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  padding: 10px;
}

.risks-title {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.risks-title i {
  color: #f59e0b;
}

.risks-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.risk-item {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  padding: 8px 10px;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.risk-item:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: translateX(4px);
}

.risk-item.high {
  border-left-color: #ef4444;
}

.risk-item.medium {
  border-left-color: #f59e0b;
}

.risk-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.risk-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.risk-depth {
  font-size: 11px;
  color: #f87171;
  font-weight: 600;
  font-family: var(--font-mono);
}

.risk-suggestion {
  font-size: 10px;
  color: var(--text-muted);
  line-height: 1.4;
}

/* 操作按钮 */
.sim-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
  border: 1px solid var(--border-subtle);
  background: rgba(0, 0, 0, 0.2);
  color: var(--text-secondary);
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.3);
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
}

.action-btn.primary {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
  color: #f87171;
}

.action-btn.primary:hover {
  background: rgba(239, 68, 68, 0.25);
  border-color: #ef4444;
  color: #ef4444;
}

/* 无数据状态 */
.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  color: var(--text-muted);
  font-size: 12px;
}
</style>
