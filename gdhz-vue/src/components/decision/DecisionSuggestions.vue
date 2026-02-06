<template>
  <div class="panel decision-panel" :class="{ collapsed: isCollapsed }">
    <div class="panel-header" @click="isCollapsed = !isCollapsed">
      <div class="panel-title">
        <i class="fa-solid fa-bullhorn"></i>
        决策建议
      </div>
      <i class="fa-solid fa-chevron-down toggle-icon"></i>
    </div>

    <div class="panel-content">
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

      <!-- 决策要点列表 -->
      <div class="decision-points">
        <div class="points-title">关键措施清单</div>
        <div class="points-list">
          <div v-for="(action, idx) in keyActions" :key="idx" class="point-item">
            <span class="point-number">{{ idx + 1 }}</span>
            <span class="point-text">{{ action }}</span>
          </div>
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="quick-actions">
        <button class="action-btn primary" @click="handleStartMeeting">
          <i class="fa-solid fa-video"></i>
          启动会商
        </button>
        <button class="action-btn" @click="handleViewPlan">
          <i class="fa-solid fa-file-lines"></i>
          应急预案
        </button>
        <button class="action-btn" @click="handlePublishWarning">
          <i class="fa-solid fa-bullhorn"></i>
          发布预警
        </button>
        <button class="action-btn" @click="handleEvacuationNotice">
          <i class="fa-solid fa-route"></i>
          疏散通知
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '../../stores/app'

const store = useAppStore()
const isCollapsed = ref(false)

// 应急响应等级
const responseLevel = computed(() => {
  const level = store.riskDecisions?.recommendations?.responseLevel || 'III'
  const levels = {
    'I': { text: 'I级响应', class: 'level-1', desc: '特别重大灾害，全省联动', levelKey: 'I' },
    'II': { text: 'II级响应', class: 'level-2', desc: '重大灾害，省级协调', levelKey: 'II' },
    'III': { text: 'III级响应', class: 'level-3', desc: '较大灾害，市级主导', levelKey: 'III' },
    'IV': { text: 'IV级响应', class: 'level-4', desc: '一般灾害，县级处置', levelKey: 'IV' },
  }
  return levels[level] || levels['III']
})

// 关键决策行动（针对风浪潮场景）
const keyActions = computed(() => [
  '通知在海渔船回港避风',
  '组织低洼地区人员转移',
  '加强海堤巡查和应急值守',
  '临时关闭滨海旅游区',
  '做好排涝泵站准备工作',
  '启动防风防潮应急预案',
])

function handleStartMeeting() {
  alert('视频会商系统启动中...')
}

function handleViewPlan() {
  alert('正在加载应急预案...')
}

function handlePublishWarning() {
  alert('正在打开预警发布系统...')
}

function handleEvacuationNotice() {
  alert('正在生成疏散通知...')
}
</script>

<style scoped>
.decision-panel {
  background: var(--bg-panel);
  border: 1px solid var(--border-normal);
  border-radius: var(--border-radius);
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
}

.decision-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 15%;
  right: 15%;
  height: 1px;
  background: linear-gradient(90deg, transparent, #10b981 30%, #10b981 70%, transparent);
  opacity: 0.6;
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
  color: #10b981;
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-icon {
  color: var(--text-muted);
  font-size: 10px;
  transition: transform 0.2s;
}

.decision-panel.collapsed .toggle-icon {
  transform: rotate(-90deg);
}

.panel-content {
  padding: 0 12px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow: hidden;
  transition: max-height 0.3s, padding 0.3s;
}

.decision-panel.collapsed .panel-content {
  max-height: 0;
  padding: 0 12px;
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

.level-1 .response-icon-wrap {
  background: rgba(239, 68, 68, 0.3);
}
.level-2 .response-icon-wrap {
  background: rgba(249, 115, 22, 0.3);
}
.level-3 .response-icon-wrap {
  background: rgba(234, 179, 8, 0.3);
}
.level-4 .response-icon-wrap {
  background: rgba(59, 130, 246, 0.3);
}

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

/* 决策要点 */
.decision-points {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  padding: 10px;
}

.points-title {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.points-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
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
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 600;
  flex-shrink: 0;
}

/* 快捷操作 */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.action-btn {
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 11px;
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
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.4);
  color: #10b981;
}

.action-btn.primary:hover {
  background: rgba(16, 185, 129, 0.25);
  border-color: #10b981;
}
</style>
