<template>
  <div class="storm-wave-sidebar">
    <!-- 1. 联合预警概览 (核心内容，原悬浮面板) -->
    <div class="panel alert-overview-panel">
      <div class="panel-header">
        <div class="panel-title">
          <i class="fa-solid fa-house-tsunami"></i>
          联合预警概览
        </div>
        <div class="risk-badge level-red">I级红色预警</div>
      </div>
      <div class="panel-content">
        <!-- 核心指标 -->
        <div class="core-metric">
          <div class="metric-label">预计总潮位 (Total Level)</div>
          <div class="metric-value-row">
            <span class="value">4.25</span>
            <span class="unit">m</span>
            <span class="tag alarm">超警戒 0.6m</span>
          </div>
          <div class="metric-sub">≈ 天文潮 2.45m + 增水 1.80m</div>
        </div>

        <!-- 分项指标 -->
        <div class="sub-metrics">
          <div class="metric-row">
            <span class="m-label">最大风暴增水</span>
            <span class="m-value">180 <span class="unit">cm</span></span>
          </div>
          <div class="metric-row">
            <span class="m-label">天文大潮高潮位</span>
            <span class="m-value">245 <span class="unit">cm</span></span>
          </div>
          <div class="metric-row">
            <span class="m-label">有效波高</span>
            <span class="m-value red">6.5 <span class="unit">m</span></span>
          </div>
        </div>

        <!-- 风险描述 -->
        <div class="risk-description">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span>预计珠江口沿岸即使在<strong>天文低潮</strong>期，叠加<strong>风暴增水</strong>后水位仍将超过警戒线，且伴有<strong>巨浪</strong>拍岸，漫堤风险极高。</span>
        </div>
      </div>
    </div>

    <!-- 2. 重点防御区域 -->
    <div class="panel defense-panel">
      <div class="panel-header" @click="defenseCollapsed = !defenseCollapsed">
        <div class="panel-title">
          <i class="fa-solid fa-shield-halved"></i>
          重点防御区域
        </div>
        <i class="fa-solid fa-chevron-down toggle-icon" :class="{ rotated: !defenseCollapsed }"></i>
      </div>
      <div class="panel-content" v-show="!defenseCollapsed">
        <div class="area-grid">
          <div v-for="area in defenseAreas" :key="area.name" class="area-card" :class="area.level">
            <div class="area-name">{{ area.name }}</div>
            <div class="area-risk">{{ area.risk }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. 预测趋势 -->
    <div class="panel prediction-panel">
      <div class="panel-header" @click="predictionCollapsed = !predictionCollapsed">
        <div class="panel-title">
          <i class="fa-solid fa-chart-line"></i>
          预测趋势
        </div>
        <i class="fa-solid fa-chevron-down toggle-icon" :class="{ rotated: !predictionCollapsed }"></i>
      </div>
      <div class="panel-content" v-show="!predictionCollapsed">
        <div class="prediction-summary">{{ predictions.summary }}</div>
        <div class="prediction-timeline">
          <div
            v-for="(item, idx) in predictions.items.slice(0, 3)"
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

    <!-- 4. 决策建议 -->
    <div class="panel decision-panel">
      <div class="panel-header" @click="decisionCollapsed = !decisionCollapsed">
        <div class="panel-title">
          <i class="fa-solid fa-bullhorn"></i>
          决策建议
        </div>
        <i class="fa-solid fa-chevron-down toggle-icon" :class="{ rotated: !decisionCollapsed }"></i>
      </div>
      <div class="panel-content" v-show="!decisionCollapsed">
        <!-- 应急响应状态（亮色卡片） -->
        <div class="response-card" :class="responseLevel.class">
          <div class="response-glow"></div>
          <div class="response-icon-wrap">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <div class="pulse-ring"></div>
          </div>
          <div class="response-main">
            <div class="response-level">
              <span class="level-text">{{ responseLevel.text }}</span>
              <span class="level-indicator">
                <span class="dot active"></span>
                <span class="dot" :class="{ active: ['I', 'II', 'III'].includes(responseLevel.levelKey) }"></span>
                <span class="dot" :class="{ active: ['I', 'II'].includes(responseLevel.levelKey) }"></span>
                <span class="dot" :class="{ active: responseLevel.levelKey === 'I' }"></span>
              </span>
            </div>
            <div class="response-desc">{{ responseLevel.desc }}</div>
          </div>
          <div class="response-action">
            <span class="action-label">建议响应</span>
          </div>
        </div>

        <!-- 决策要点 -->
        <div class="decision-points">
          <div v-for="(action, idx) in keyActions" :key="idx" class="point-item">
            <span class="point-number">{{ idx + 1 }}</span>
            <span class="point-text">{{ action }}</span>
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

    <!-- 更新时间 -->
    <div class="update-footer">
      数据更新: {{ updateTime }} (每小时更新)
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { mockPredictions } from '../../data/mockData'

// 折叠状态
const defenseCollapsed = ref(false)
const predictionCollapsed = ref(true)
const decisionCollapsed = ref(false)

// 更新时间 (仅在组件挂载时设置，避免无限重渲染)
const updateTime = ref('--:--:--')

// 预测趋势
const predictions = computed(() => mockPredictions)

// 应急响应等级
const responseLevel = computed(() => {
  // 这里可以根据实际数据动态获取
  const level = 'II'
  const levels = {
    'I': { text: 'I级响应', class: 'level-1', desc: '特别重大灾害，全省联动', levelKey: 'I' },
    'II': { text: 'II级响应', class: 'level-2', desc: '重大灾害，省级协调', levelKey: 'II' },
    'III': { text: 'III级响应', class: 'level-3', desc: '较大灾害，市级主导', levelKey: 'III' },
    'IV': { text: 'IV级响应', class: 'level-4', desc: '一般灾害，县级处置', levelKey: 'IV' },
  }
  return levels[level] || levels['III']
})

// 重点防御区域
const defenseAreas = [
  { name: '珠海情侣路', risk: '漫堤风险', level: 'high' },
  { name: '深圳湾公园', risk: '海水倒灌', level: 'high' },
  { name: '大万山岛', risk: '设施损毁', level: 'medium' },
  { name: '中山沿海', risk: '农田盐碱化', level: 'medium' },
]

// 决策建议
const keyActions = [
  '组织沿海低洼地区人员转移',
  '通知在海渔船回港避风',
  '加强海堤巡查和应急值守',
  '做好排涝泵站准备工作',
  '关闭沿海景区和浴场',
]

function handleStartMeeting() {
  alert('视频会商系统启动中...')
}

function handleViewPlan() {
  alert('正在加载应急预案...')
}

onMounted(() => {
  updateTime.value = new Date().toLocaleTimeString()
})
</script>

<style scoped>
.storm-wave-sidebar {
  width: 360px;
  flex-shrink: 0;
  background: var(--bg-deepest);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  padding: 8px 10px;
  gap: 10px;
  overflow-y: auto;
  z-index: 50;
}

.storm-wave-sidebar::-webkit-scrollbar {
  width: 4px;
}

.storm-wave-sidebar::-webkit-scrollbar-thumb {
  background: var(--border-subtle);
  border-radius: 2px;
}

/* 面板通用 */
.panel {
  background: var(--bg-panel);
  border: 1px solid var(--border-normal);
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.panel-header:hover {
  background: var(--bg-hover);
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-cyan);
  display: flex;
  align-items: center;
  gap: 6px;
}

.toggle-icon {
  color: var(--text-muted);
  font-size: 10px;
  transition: transform 0.2s;
}

.toggle-icon.rotated {
  transform: rotate(180deg);
}

.panel-content {
  padding: 0 12px 12px;
}

/* 联合预警面板 */
.alert-overview-panel {
  border-left: 4px solid var(--alert-red);
}

.alert-overview-panel .panel-header {
  cursor: default;
}

.alert-overview-panel .panel-title {
  color: #ff3b30;
}

.risk-badge {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
}

.risk-badge.level-red {
  background: rgba(255, 59, 48, 0.2);
  color: #ff3b30;
  border: 1px solid rgba(255, 59, 48, 0.4);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.4); }
  50% { box-shadow: 0 0 0 4px rgba(255, 59, 48, 0); }
}

/* 核心指标 */
.core-metric {
  background: linear-gradient(135deg, rgba(0, 229, 255, 0.1), transparent);
  border: 1px solid rgba(0, 229, 255, 0.3);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
}

.metric-label {
  font-size: 11px;
  color: var(--accent-cyan);
  font-weight: 600;
  margin-bottom: 4px;
}

.metric-value-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.metric-value-row .value {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
}

.metric-value-row .unit {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.tag.alarm {
  background: #ff3b30;
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: auto;
  font-weight: 600;
}

.metric-sub {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
  border-top: 1px dashed rgba(255, 255, 255, 0.1);
  padding-top: 4px;
}

/* 分项指标 */
.sub-metrics {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 12px;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.metric-row:last-child {
  border-bottom: none;
}

.m-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.m-value {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}

.m-value.red {
  color: #ff3b30;
}

.m-value .unit {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
}

/* 风险描述 */
.risk-description {
  display: flex;
  gap: 8px;
  background: rgba(255, 59, 48, 0.1);
  border: 1px solid rgba(255, 59, 48, 0.2);
  border-radius: 6px;
  padding: 10px;
  font-size: 12px;
  line-height: 1.5;
  color: #ffcccc;
}

.risk-description i {
  color: #ff3b30;
  margin-top: 2px;
}

.risk-description strong {
  color: #fff;
}

/* 防御区域 */
.defense-panel .panel-title {
  color: #f97316;
}

.area-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.area-card {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
  padding: 8px;
  border-left: 3px solid;
}

.area-card.high {
  border-left-color: #ef4444;
  background: rgba(239, 68, 68, 0.05);
}

.area-card.medium {
  border-left-color: #f97316;
  background: rgba(249, 115, 22, 0.05);
}

.area-name {
  font-size: 12px;
  font-weight: 600;
  color: #fff;
}

.area-risk {
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 2px;
}

/* 预测趋势 */
.prediction-panel .panel-title {
  color: #8b5cf6;
}

.prediction-summary {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
  padding: 8px;
  background: rgba(139, 92, 246, 0.05);
  border-radius: 6px;
  margin-bottom: 10px;
}

.prediction-timeline {
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
}

.timeline-event {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.timeline-detail {
  font-size: 10px;
  color: var(--text-muted);
}

/* 决策建议 */
.decision-panel .panel-title {
  color: #10b981;
}

/* 应急响应卡片（亮色设计） */
.response-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s;
  margin-bottom: 12px;
}

.response-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.15;
  pointer-events: none;
}

/* 各等级颜色 */
.response-card.level-1 {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(239, 68, 68, 0.08));
  border: 2px solid rgba(239, 68, 68, 0.6);
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
.response-card.level-1 .response-glow {
  background: radial-gradient(ellipse at top left, rgba(239, 68, 68, 0.4), transparent 70%);
}

.response-card.level-2 {
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.25), rgba(249, 115, 22, 0.08));
  border: 2px solid rgba(249, 115, 22, 0.6);
  box-shadow: 0 0 20px rgba(249, 115, 22, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
.response-card.level-2 .response-glow {
  background: radial-gradient(ellipse at top left, rgba(249, 115, 22, 0.4), transparent 70%);
}

.response-card.level-3 {
  background: linear-gradient(135deg, rgba(234, 179, 8, 0.25), rgba(234, 179, 8, 0.08));
  border: 2px solid rgba(234, 179, 8, 0.6);
  box-shadow: 0 0 20px rgba(234, 179, 8, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
.response-card.level-3 .response-glow {
  background: radial-gradient(ellipse at top left, rgba(234, 179, 8, 0.4), transparent 70%);
}

.response-card.level-4 {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.05));
  border: 2px solid rgba(59, 130, 246, 0.5);
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
.response-card.level-4 .response-glow {
  background: radial-gradient(ellipse at top left, rgba(59, 130, 246, 0.3), transparent 70%);
}

/* 图标区域 */
.response-icon-wrap {
  position: relative;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  flex-shrink: 0;
}

.level-1 .response-icon-wrap { background: rgba(239, 68, 68, 0.3); }
.level-2 .response-icon-wrap { background: rgba(249, 115, 22, 0.3); }
.level-3 .response-icon-wrap { background: rgba(234, 179, 8, 0.3); }
.level-4 .response-icon-wrap { background: rgba(59, 130, 246, 0.3); }

.response-icon-wrap i {
  font-size: 20px;
  z-index: 1;
}

.level-1 .response-icon-wrap i { color: #ef4444; }
.level-2 .response-icon-wrap i { color: #f97316; }
.level-3 .response-icon-wrap i { color: #eab308; }
.level-4 .response-icon-wrap i { color: #3b82f6; }

/* 脉冲动画 */
.pulse-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  transform: translate(-50%, -50%);
  animation: pulse-ring 2s ease-out infinite;
}

.level-1 .pulse-ring { border: 2px solid rgba(239, 68, 68, 0.6); }
.level-2 .pulse-ring { border: 2px solid rgba(249, 115, 22, 0.6); }
.level-3 .pulse-ring { border: 2px solid rgba(234, 179, 8, 0.6); }
.level-4 .pulse-ring { border: 2px solid rgba(59, 130, 246, 0.4); }

@keyframes pulse-ring {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
}

/* 主要内容 */
.response-main {
  flex: 1;
  min-width: 0;
}

.response-level {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.level-text {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.level-1 .level-text { color: #ef4444; }
.level-2 .level-text { color: #f97316; }
.level-3 .level-text { color: #eab308; }
.level-4 .level-text { color: #60a5fa; }

/* 等级指示灯 */
.level-indicator {
  display: flex;
  gap: 4px;
}

.level-indicator .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  transition: all 0.3s;
}

.level-indicator .dot.active {
  background: currentColor;
  box-shadow: 0 0 6px currentColor;
}

.level-1 .level-indicator { color: #ef4444; }
.level-2 .level-indicator { color: #f97316; }
.level-3 .level-indicator { color: #eab308; }
.level-4 .level-indicator { color: #60a5fa; }

.response-desc {
  font-size: 11px;
  color: var(--text-muted);
}

/* 右侧标签 */
.response-action {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.action-label {
  font-size: 9px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.decision-points {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.point-item {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}

.point-number {
  width: 18px;
  height: 18px;
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  flex-shrink: 0;
}

.quick-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  padding: 8px;
  border: 1px solid var(--border-normal);
  background: transparent;
  color: var(--text-secondary);
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--bg-hover);
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
}

/* 更新时间 */
.update-footer {
  text-align: center;
  font-size: 10px;
  color: var(--text-muted);
  padding: 8px;
  border-top: 1px solid var(--border-subtle);
}
</style>
