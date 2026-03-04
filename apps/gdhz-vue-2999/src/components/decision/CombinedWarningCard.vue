<template>
  <div class="warning-card-panel">
    <div class="warning-grid">
      <!-- 风暴潮预警 -->
      <div class="warning-item" :class="surgeWarning.level">
        <div class="warning-icon">
          <i class="fa-solid fa-water"></i>
        </div>
        <div class="warning-info">
          <div class="warning-type">风暴潮</div>
          <div class="warning-level">{{ surgeWarning.text }}</div>
        </div>
      </div>

      <!-- 海浪预警 -->
      <div class="warning-item" :class="waveWarning.level">
        <div class="warning-icon">
          <i class="fa-solid fa-wind"></i>
        </div>
        <div class="warning-info">
          <div class="warning-type">海浪</div>
          <div class="warning-level">{{ waveWarning.text }}</div>
        </div>
      </div>

      <!-- 天文潮状态 -->
      <div class="warning-item tide" :class="tideStatus.level">
        <div class="warning-icon">
          <i class="fa-solid fa-moon"></i>
        </div>
        <div class="warning-info">
          <div class="warning-type">天文潮</div>
          <div class="warning-level">{{ tideStatus.text }}</div>
        </div>
      </div>

      <!-- 综合风险 -->
      <div class="warning-item combined" :class="combinedRisk.level">
        <div class="warning-icon">
          <i class="fa-solid fa-gauge-high"></i>
        </div>
        <div class="warning-info">
          <div class="warning-type">综合风险</div>
          <div class="warning-level">{{ combinedRisk.text }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { mockAstronomicalTide } from '../../data/seaConditionData'

// 模拟预警等级数据
const surgeWarning = computed(() => ({
  level: 'red',
  text: 'I级（红色）',
}))

const waveWarning = computed(() => ({
  level: 'orange',
  text: 'II级（橙色）',
}))

const tideStatus = computed(() => ({
  level: mockAstronomicalTide.currentType === '大潮期' ? 'high' : 
         mockAstronomicalTide.currentType === '中潮期' ? 'medium' : 'low',
  text: mockAstronomicalTide.currentType,
}))

// 综合风险根据三者计算
const combinedRisk = computed(() => {
  // 简化逻辑：有红色预警则高风险
  return {
    level: 'high',
    text: '高风险',
  }
})
</script>

<style scoped>
.warning-card-panel {
  background: var(--bg-panel);
  border: 1px solid var(--border-normal);
  border-radius: var(--border-radius);
  padding: 12px;
  position: relative;
  flex-shrink: 0;
}

.warning-card-panel::before {
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

.warning-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.warning-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-subtle);
  transition: all 0.2s;
}

.warning-item:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* 预警等级颜色 */
.warning-item.red {
  border-color: rgba(239, 68, 68, 0.4);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05));
}

.warning-item.red .warning-icon {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.warning-item.red .warning-level {
  color: #ef4444;
}

.warning-item.orange {
  border-color: rgba(249, 115, 22, 0.4);
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(249, 115, 22, 0.05));
}

.warning-item.orange .warning-icon {
  background: rgba(249, 115, 22, 0.2);
  color: #f97316;
}

.warning-item.orange .warning-level {
  color: #f97316;
}

.warning-item.yellow {
  border-color: rgba(234, 179, 8, 0.4);
  background: linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(234, 179, 8, 0.05));
}

.warning-item.yellow .warning-icon {
  background: rgba(234, 179, 8, 0.2);
  color: #eab308;
}

.warning-item.yellow .warning-level {
  color: #eab308;
}

.warning-item.blue {
  border-color: rgba(59, 130, 246, 0.4);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05));
}

/* 天文潮状态 */
.warning-item.tide.high {
  border-color: rgba(245, 158, 11, 0.4);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05));
}

.warning-item.tide.high .warning-icon {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.warning-item.tide.high .warning-level {
  color: #f59e0b;
}

.warning-item.tide.medium .warning-icon {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.warning-item.tide.low .warning-icon {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

/* 综合风险 */
.warning-item.combined.high {
  border-color: rgba(239, 68, 68, 0.5);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.08));
}

.warning-item.combined.high .warning-icon {
  background: rgba(239, 68, 68, 0.25);
  color: #ef4444;
  animation: pulse-icon 2s ease-in-out infinite;
}

.warning-item.combined.high .warning-level {
  color: #ef4444;
  font-weight: 700;
}

@keyframes pulse-icon {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.warning-item.combined.medium {
  border-color: rgba(245, 158, 11, 0.5);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05));
}

.warning-item.combined.medium .warning-icon {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.warning-item.combined.low {
  border-color: rgba(16, 185, 129, 0.4);
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05));
}

.warning-item.combined.low .warning-icon {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.warning-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.warning-info {
  flex: 1;
  min-width: 0;
}

.warning-type {
  font-size: 10px;
  color: var(--text-muted);
  margin-bottom: 2px;
}

.warning-level {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}
</style>
