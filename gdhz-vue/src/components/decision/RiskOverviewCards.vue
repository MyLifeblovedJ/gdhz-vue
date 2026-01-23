<template>
  <div class="risk-overview-cards">
    <!-- 热力卡片统计 -->
    <div class="risk-stats-cards">
      <div 
        class="risk-card high" 
        :class="{ active: expandedLevel === 'high' }"
        @click="toggleLevel('high')"
      >
        <div class="risk-count">{{ highRiskCount }}</div>
        <div class="risk-label">高风险</div>
        <div class="risk-pulse" v-if="highRiskCount > 0"></div>
      </div>
      <div 
        class="risk-card medium"
        :class="{ active: expandedLevel === 'medium' }"
        @click="toggleLevel('medium')"
      >
        <div class="risk-count">{{ mediumRiskCount }}</div>
        <div class="risk-label">中风险</div>
      </div>
      <div 
        class="risk-card low"
        :class="{ active: expandedLevel === 'low' }"
        @click="toggleLevel('low')"
      >
        <div class="risk-count">{{ lowRiskCount }}</div>
        <div class="risk-label">低风险</div>
      </div>
    </div>

    <!-- 展开的风险详情（超过2个时可滑动） -->
    <Transition name="slide-down">
      <div v-if="expandedLevel && filteredRisks.length > 0" class="risk-details">
        <div class="detail-header">
          <span class="detail-title">{{ getLevelTitle(expandedLevel) }}</span>
          <button class="close-btn" @click="expandedLevel = null">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <div class="risk-list" :class="{ scrollable: filteredRisks.length > 2 }">
          <div 
            v-for="risk in filteredRisks" 
            :key="risk.id" 
            class="risk-item"
            :class="risk.level"
            @click="showRiskDetail(risk)"
          >
            <div class="risk-item-header">
              <span class="risk-title">{{ risk.title }}</span>
              <i class="fa-solid fa-chevron-right"></i>
            </div>
            <div class="risk-location">
              <i class="fa-solid fa-location-dot"></i>
              {{ risk.location }}
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 风险详情弹窗 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="selectedRisk" class="risk-modal-overlay" @click.self="closeRiskDetail">
          <div class="risk-modal" :class="selectedRisk.level">
            <div class="modal-header">
              <div class="modal-title-wrap">
                <div class="level-badge" :class="selectedRisk.level">
                  {{ getLevelText(selectedRisk.level) }}
                </div>
                <h3 class="modal-title">{{ selectedRisk.title }}</h3>
              </div>
              <button class="modal-close" @click="closeRiskDetail">
                <i class="fa-solid fa-times"></i>
              </button>
            </div>
            <div class="modal-body">
              <div class="detail-row">
                <i class="fa-solid fa-location-dot"></i>
                <span class="detail-label">位置</span>
                <span class="detail-value">{{ selectedRisk.location }}</span>
              </div>
              <div class="detail-row">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <span class="detail-label">风险描述</span>
                <span class="detail-value">{{ selectedRisk.reason || selectedRisk.title }}</span>
              </div>
              <div class="detail-row">
                <i class="fa-solid fa-clock"></i>
                <span class="detail-label">更新时间</span>
                <span class="detail-value">{{ selectedRisk.updateTime || '10:30' }}</span>
              </div>
              <div v-if="selectedRisk.measures" class="measures-section">
                <div class="measures-title">建议措施</div>
                <ul class="measures-list">
                  <li v-for="(measure, idx) in selectedRisk.measures" :key="idx">{{ measure }}</li>
                </ul>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" @click="closeRiskDetail">关闭</button>
              <button class="btn-primary" @click="handleLocate(selectedRisk)">
                <i class="fa-solid fa-crosshairs"></i>
                定位到地图
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '../../stores/app'

const store = useAppStore()
const expandedLevel = ref(null)
const selectedRisk = ref(null)

// 获取风险数据
const riskDecisions = computed(() => store.riskDecisions)

// 风险统计
const highRiskCount = computed(() =>
  riskDecisions.value?.risks?.filter(r => r.level === 'high').length || 0
)
const mediumRiskCount = computed(() =>
  riskDecisions.value?.risks?.filter(r => r.level === 'medium').length || 0
)
const lowRiskCount = computed(() =>
  riskDecisions.value?.risks?.filter(r => r.level === 'low').length || 0
)

// 过滤后的风险列表
const filteredRisks = computed(() => {
  if (!expandedLevel.value || !riskDecisions.value?.risks) return []
  return riskDecisions.value.risks.filter(r => r.level === expandedLevel.value)
})

// 切换展开
function toggleLevel(level) {
  if (expandedLevel.value === level) {
    expandedLevel.value = null
  } else {
    expandedLevel.value = level
  }
}

function getLevelTitle(level) {
  const titles = {
    high: '高风险区域',
    medium: '中风险区域', 
    low: '低风险区域'
  }
  return titles[level] || ''
}

function getLevelText(level) {
  const texts = { high: '高风险', medium: '中风险', low: '低风险' }
  return texts[level] || ''
}

// 显示风险详情弹窗
function showRiskDetail(risk) {
  selectedRisk.value = risk
}

// 关闭弹窗
function closeRiskDetail() {
  selectedRisk.value = null
}

// 定位到地图
function handleLocate(risk) {
  console.log('定位到:', risk.location)
  closeRiskDetail()
}
</script>

<style scoped>
.risk-overview-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 热力卡片 */
.risk-stats-cards {
  display: flex;
  gap: 8px;
}

.risk-card {
  flex: 1;
  position: relative;
  padding: 14px 8px;
  border-radius: 10px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.risk-card.high {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.08));
  border: 1px solid rgba(239, 68, 68, 0.4);
}

.risk-card.medium {
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(249, 115, 22, 0.08));
  border: 1px solid rgba(249, 115, 22, 0.4);
}

.risk-card.low {
  background: linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(234, 179, 8, 0.08));
  border: 1px solid rgba(234, 179, 8, 0.4);
}

.risk-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.risk-card.active {
  transform: scale(1.02);
}

.risk-card.high.active {
  border-color: #ef4444;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
}

.risk-card.medium.active {
  border-color: #f97316;
  box-shadow: 0 0 20px rgba(249, 115, 22, 0.3);
}

.risk-card.low.active {
  border-color: #eab308;
  box-shadow: 0 0 20px rgba(234, 179, 8, 0.3);
}

.risk-count {
  font-size: 28px;
  font-weight: 800;
  font-family: var(--font-display);
  line-height: 1;
}

.risk-card.high .risk-count { color: #ef4444; }
.risk-card.medium .risk-count { color: #f97316; }
.risk-card.low .risk-count { color: #eab308; }

.risk-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* 高风险脉冲动画 */
.risk-pulse {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 10px;
  animation: pulse-border 2s ease-in-out infinite;
  pointer-events: none;
}

@keyframes pulse-border {
  0%, 100% {
    box-shadow: inset 0 0 0 0 rgba(239, 68, 68, 0);
  }
  50% {
    box-shadow: inset 0 0 0 2px rgba(239, 68, 68, 0.5);
  }
}

/* 展开详情 */
.risk-details {
  background: var(--bg-card);
  border: 1px solid var(--border-normal);
  border-radius: 8px;
  overflow: hidden;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid var(--border-subtle);
}

.detail-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.close-btn {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.risk-list {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.risk-item {
  padding: 10px 12px;
  border-radius: 6px;
  background: rgba(30, 40, 60, 0.4);
  border-left: 3px solid;
  cursor: pointer;
  transition: all 0.2s;
}

.risk-item.high { border-left-color: #ef4444; }
.risk-item.medium { border-left-color: #f97316; }
.risk-item.low { border-left-color: #eab308; }

.risk-item:hover {
  background: rgba(40, 50, 70, 0.6);
  transform: translateX(2px);
}

.risk-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.risk-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.risk-item-header i {
  font-size: 10px;
  color: var(--text-muted);
}

.risk-location {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
}

.risk-location i {
  margin-right: 4px;
}

.more-hint {
  text-align: center;
  font-size: 11px;
  color: var(--text-muted);
  padding: 6px;
  border-top: 1px solid var(--border-subtle);
}

/* 滑动动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}

.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  max-height: 300px;
}

/* 滑动容器 */
.risk-list.scrollable {
  max-height: 180px;
  overflow-y: auto;
}

.risk-list.scrollable::-webkit-scrollbar {
  width: 3px;
}

.risk-list.scrollable::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

.risk-list.scrollable::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

/* 弹窗遮罩 */
.risk-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 20, 35, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(8px) saturate(1.2);
  animation: overlay-fade-in 0.3s ease;
}

@keyframes overlay-fade-in {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(8px) saturate(1.2);
  }
}

/* 弹窗主体 */
.risk-modal {
  width: 420px;
  max-width: 90vw;
  background: var(--bg-panel);
  border-radius: 12px;
  border: 1px solid var(--border-normal);
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.risk-modal.high {
  border-top: 3px solid #ef4444;
}

.risk-modal.medium {
  border-top: 3px solid #f97316;
}

.risk-modal.low {
  border-top: 3px solid #eab308;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid var(--border-subtle);
}

.modal-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.level-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 12px;
  width: fit-content;
}

.level-badge.high {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.level-badge.medium {
  background: rgba(249, 115, 22, 0.2);
  color: #f97316;
}

.level-badge.low {
  background: rgba(234, 179, 8, 0.2);
  color: #eab308;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.detail-row > i {
  width: 20px;
  text-align: center;
  color: var(--text-muted);
  margin-top: 2px;
}

.detail-label {
  font-size: 12px;
  color: var(--text-muted);
  min-width: 60px;
}

.detail-value {
  font-size: 13px;
  color: var(--text-primary);
  flex: 1;
  line-height: 1.5;
}

.measures-section {
  margin-top: 10px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.measures-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.measures-list {
  margin: 0;
  padding-left: 20px;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.8;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.15);
  border-top: 1px solid var(--border-subtle);
}

.btn-secondary,
.btn-primary {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-secondary {
  background: transparent;
  border: 1px solid var(--border-normal);
  color: var(--text-secondary);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.05);
}

.btn-primary {
  background: var(--accent-cyan);
  border: none;
  color: #000;
}

.btn-primary:hover {
  opacity: 0.9;
}

/* 弹窗动画 */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-from .risk-modal,
.fade-leave-to .risk-modal {
  transform: scale(0.95) translateY(-20px);
}
</style>
