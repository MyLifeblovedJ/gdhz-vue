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
      <!-- 应急响应状态 -->
      <div class="response-status" :class="responseLevel.class">
        <div class="response-info">
          <span class="response-label">建议响应等级</span>
          <span class="response-value">{{ responseLevel.text }}</span>
        </div>
        <div class="response-desc">{{ responseLevel.desc }}</div>
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
    'I': { text: 'I级（一级响应）', class: 'level-1', desc: '特别重大灾害，全省联动' },
    'II': { text: 'II级（二级响应）', class: 'level-2', desc: '重大灾害，省级协调' },
    'III': { text: 'III级（三级响应）', class: 'level-3', desc: '较大灾害，市级主导' },
    'IV': { text: 'IV级（四级响应）', class: 'level-4', desc: '一般灾害，县级处置' },
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

/* 应急响应状态 */
.response-status {
  border-radius: 8px;
  padding: 10px 12px;
}

.response-status.level-1 {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.05));
  border: 1px solid rgba(239, 68, 68, 0.4);
}

.response-status.level-2 {
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(249, 115, 22, 0.05));
  border: 1px solid rgba(249, 115, 22, 0.4);
}

.response-status.level-3 {
  background: linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(234, 179, 8, 0.05));
  border: 1px solid rgba(234, 179, 8, 0.4);
}

.response-status.level-4 {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05));
  border: 1px solid rgba(59, 130, 246, 0.3);
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
  font-size: 13px;
  font-weight: 700;
}

.level-1 .response-value { color: #ef4444; }
.level-2 .response-value { color: #f97316; }
.level-3 .response-value { color: #eab308; }
.level-4 .response-value { color: #3b82f6; }

.response-desc {
  font-size: 10px;
  color: var(--text-muted);
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
