<template>
  <div class="panel alert-panel">
    <div class="panel-header">
      <div class="panel-title">
        <i class="fa-solid fa-triangle-exclamation"></i>
        当前预警
        <span class="badge">{{ filteredAlerts.length }}</span>
      </div>
    </div>
    <div class="panel-content">
      <div class="alerts-scroll-container">
        <div
          v-for="alert in filteredAlerts"
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
        <!-- 无预警时 -->
        <div v-if="filteredAlerts.length === 0" class="no-alerts">
          <i class="fa-solid fa-check-circle"></i>
          暂无风暴潮、海浪相关预警
        </div>
        <!-- 历史预警入口 - 放在滚动区域末尾 -->
        <div class="history-entry" @click="handleViewHistory">
          <i class="fa-solid fa-clock-rotate-left"></i>
          <span>查看历史预警记录</span>
          <i class="fa-solid fa-chevron-right"></i>
        </div>
      </div>
      <div v-if="filteredAlerts.length > 3" class="alerts-more">
        共 {{ filteredAlerts.length }} 条预警，滚动查看更多
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../../stores/app'

const store = useAppStore()

// 只过滤与风暴潮、海浪、天文潮相关的预警
const filteredAlerts = computed(() => {
  // 定义相关关键词
  const relatedKeywords = ['风暴潮', '海浪', '潮位', '台风', '天文潮', '潮汐', '增水', '浪高']
  
  return store.alerts.filter(alert => {
    const title = alert.title || ''
    return relatedKeywords.some(keyword => title.includes(keyword))
  })
})

function handleAlertClick(alert) {
  console.log('Alert clicked:', alert)
}

function handleImageError(e) {
  e.target.src = '/icons/alert-default.svg'
}

function handleViewHistory() {
  alert('历史预警查询功能开发中...')
}
</script>

<style scoped>
.alert-panel {
  background: var(--bg-panel);
  border: 1px solid var(--border-normal);
  border-radius: var(--border-radius);
  overflow: hidden;
  flex-shrink: 0;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-subtle);
}

.panel-title {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 600;
  color: var(--alert-red);
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge {
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(239, 68, 68, 0.2);
  color: var(--alert-red);
  border-radius: 10px;
  font-weight: 600;
}

.panel-content {
  padding: 8px 10px;
}

.alerts-scroll-container {
  max-height: 180px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-right: 4px;
}

.alerts-scroll-container::-webkit-scrollbar {
  width: 3px;
}

.alerts-scroll-container::-webkit-scrollbar-thumb {
  background: var(--border-subtle);
  border-radius: 2px;
}

.alert-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border-left: 3px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.alert-card:hover {
  background: rgba(255, 255, 255, 0.05);
  transform: translateX(2px);
}

.alert-card.red {
  border-left-color: var(--alert-red);
}

.alert-card.orange {
  border-left-color: var(--alert-orange);
}

.alert-card.yellow {
  border-left-color: var(--alert-yellow);
}

.alert-card.blue {
  border-left-color: var(--alert-blue);
}

.alert-icon {
  width: 36px;
  height: 36px;
  object-fit: contain;
  flex-shrink: 0;
}

.alert-info {
  flex: 1;
  min-width: 0;
}

.alert-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.alert-time-row {
  display: flex;
  gap: 8px;
  font-size: 10px;
}

.alert-time {
  color: var(--text-muted);
}

.alert-valid {
  color: var(--text-muted);
}

.alerts-more {
  text-align: center;
  font-size: 10px;
  color: var(--text-muted);
  padding: 6px 0;
  border-top: 1px dashed var(--border-subtle);
  margin-top: 6px;
}

.no-alerts {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  color: var(--text-muted);
  font-size: 12px;
}

.no-alerts i {
  color: #10b981;
}

/* 历史预警入口 - 在滚动区域末尾 */
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
</style>
