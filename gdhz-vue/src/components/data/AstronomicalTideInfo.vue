<template>
  <div class="panel tide-info-panel" :class="{ collapsed: isCollapsed }">
    <div class="panel-header" @click="isCollapsed = !isCollapsed">
      <div class="panel-title">
        <i class="fa-solid fa-moon"></i>
        天文潮信息
        <span class="tide-type-badge" :class="tideTypeClass">{{ tideData.currentType }}</span>
      </div>
      <i class="fa-solid fa-chevron-down toggle-icon"></i>
    </div>

    <div class="panel-content">
      <!-- 潮差信息 -->
      <div class="tide-range-info">
        <div class="range-item">
          <span class="range-label">当前潮差</span>
          <span class="range-value">{{ tideData.tidalRange }}m</span>
        </div>
        <div class="range-indicator" :class="tideTypeClass">
          <div class="indicator-bar" :style="{ height: rangePercentage + '%' }"></div>
        </div>
      </div>

      <!-- 高低潮时间表 -->
      <div class="tide-table">
        <div class="table-title">今明高低潮时间</div>
        <div class="tide-rows">
          <div
            v-for="(item, idx) in tideData.tideTable"
            :key="idx"
            class="tide-row"
            :class="[item.type, item.date === '今日' ? 'today' : 'tomorrow']"
          >
            <span class="tide-date">{{ item.date }}</span>
            <span class="tide-type-text">{{ item.type === 'high' ? '高潮' : '低潮' }}</span>
            <span class="tide-time">{{ item.time }}</span>
            <span class="tide-level">{{ item.level }}m</span>
          </div>
        </div>
      </div>

      <!-- 叠加风险提示 -->
      <div v-if="tideData.superimpositionRisk.level !== 'low'" class="superimposition-risk" :class="tideData.superimpositionRisk.level">
        <i class="fa-solid fa-warning"></i>
        <div class="risk-content">
          <div class="risk-title">天文潮叠加风险</div>
          <div class="risk-desc">{{ tideData.superimpositionRisk.description }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { mockAstronomicalTide } from '../../data/seaConditionData'

const isCollapsed = ref(false)

const tideData = computed(() => mockAstronomicalTide)

const tideTypeClass = computed(() => {
  switch (tideData.value.currentType) {
    case '大潮期': return 'spring'
    case '中潮期': return 'moderate'
    case '小潮期': return 'neap'
    default: return 'moderate'
  }
})

// 潮差百分比（用于指示器）
const rangePercentage = computed(() => {
  // 假设最大潮差为4m
  return Math.min(100, (tideData.value.tidalRange / 4) * 100)
})
</script>

<style scoped>
.tide-info-panel {
  background: var(--bg-panel);
  border: 1px solid var(--border-normal);
  border-radius: var(--border-radius);
  overflow: hidden;
  position: relative;
}

.tide-info-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 15%;
  right: 15%;
  height: 1px;
  background: linear-gradient(90deg, transparent, #8b5cf6 30%, #8b5cf6 70%, transparent);
  opacity: 0.6;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
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
  color: #8b5cf6;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tide-type-badge {
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.tide-type-badge.spring {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.tide-type-badge.moderate {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.tide-type-badge.neap {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.toggle-icon {
  color: var(--text-muted);
  font-size: 10px;
  transition: transform 0.2s;
}

.tide-info-panel.collapsed .toggle-icon {
  transform: rotate(-90deg);
}

.panel-content {
  padding: 0 12px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: visible;
  transition: max-height 0.3s, padding 0.3s;
}

.tide-info-panel.collapsed .panel-content {
  max-height: 0;
  padding: 0 12px;
  overflow: hidden;
}

/* 潮差信息 */
.tide-range-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: rgba(139, 92, 246, 0.08);
  border-radius: 8px;
}

.range-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.range-label {
  font-size: 10px;
  color: var(--text-muted);
}

.range-value {
  font-size: 20px;
  font-weight: 700;
  color: #a78bfa;
  font-family: var(--font-mono);
}

.range-indicator {
  width: 8px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.indicator-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  border-radius: 4px;
  transition: height 0.5s;
}

.range-indicator.spring .indicator-bar {
  background: linear-gradient(to top, #f59e0b, #fbbf24);
}

.range-indicator.moderate .indicator-bar {
  background: linear-gradient(to top, #3b82f6, #60a5fa);
}

.range-indicator.neap .indicator-bar {
  background: linear-gradient(to top, #10b981, #34d399);
}

/* 高低潮时间表 */
.tide-table {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  padding: 10px;
}

.table-title {
  font-size: 10px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.tide-rows {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tide-row {
  display: grid;
  grid-template-columns: 40px 40px 50px 1fr;
  gap: 8px;
  font-size: 11px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
  align-items: center;
}

.tide-row.high {
  border-left: 2px solid #ef4444;
}

.tide-row.low {
  border-left: 2px solid #3b82f6;
}

/* 今日样式 */
.tide-row.today {
  background: rgba(16, 185, 129, 0.08);
}

/* 明日样式 */
.tide-row.tomorrow {
  background: rgba(59, 130, 246, 0.08);
}

.tide-date {
  color: var(--text-muted);
}

.tide-row.today .tide-date {
  color: #10b981;
  font-weight: 600;
}

.tide-row.tomorrow .tide-date {
  color: #3b82f6;
}

.tide-type-text {
  font-weight: 600;
}

.tide-row.high .tide-type-text {
  color: #ef4444;
}

.tide-row.low .tide-type-text {
  color: #3b82f6;
}

.tide-time {
  color: var(--text-secondary);
  font-family: var(--font-mono);
}

.tide-level {
  text-align: right;
  color: var(--text-primary);
  font-weight: 600;
  font-family: var(--font-mono);
}

/* 叠加风险提示 */
.superimposition-risk {
  display: flex;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  align-items: flex-start;
}

.superimposition-risk.high {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05));
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.superimposition-risk.high i {
  color: #ef4444;
}

.superimposition-risk.medium {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05));
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.superimposition-risk.medium i {
  color: #f59e0b;
}

.superimposition-risk i {
  font-size: 14px;
  margin-top: 2px;
}

.risk-content {
  flex: 1;
}

.risk-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.risk-desc {
  font-size: 10px;
  color: var(--text-secondary);
  line-height: 1.4;
}
</style>
