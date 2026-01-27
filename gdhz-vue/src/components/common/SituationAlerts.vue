<template>
  <div class="panel alert-panel">
    <div class="panel-header">
      <div class="panel-title">
        <i class="fa-solid fa-triangle-exclamation"></i>
        当前预警
        <span class="badge">{{ alerts.length }}</span>
      </div>
    </div>
    <div class="panel-content">
      <div class="alerts-scroll-container">
        <div
          v-for="alert in alerts"
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
        <!-- 历史预警入口 -->
        <div class="history-entry" @click="handleViewHistory">
          <i class="fa-solid fa-clock-rotate-left"></i>
          <span>查看历史预警记录</span>
          <i class="fa-solid fa-chevron-right"></i>
        </div>
      </div>
      <div v-if="alerts.length > 3" class="alerts-more">
        共 {{ alerts.length }} 条预警，滚动查看更多
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  alerts: {
    type: Array,
    default: () => []
  }
})

function handleAlertClick(alert) {
  console.log('Alert clicked:', alert)
}

function handleImageError(e) {
  e.target.style.display = 'none'
}

function handleViewHistory() {
  alert('历史预警查询功能开发中...')
}
</script>

<style scoped>
/* ===== 预警面板样式 (完全复用 RightSidebar.vue) ===== */
/* ===== 面板通用样式 (复用自 RightSidebar) ===== */
.panel {
  background: var(--bg-panel);
  border: 1px solid var(--border-normal);
  border-radius: var(--border-radius);
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
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
  cursor: default;
}

.panel-title {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 600;
  color: var(--accent-cyan);
  letter-spacing: 0.5px;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 8px;
}





.panel-content {
  padding: 0 12px 12px 12px;
}

.alerts-scroll-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;  /* 约3条预警的高度 */
  overflow-y: auto;
  padding-right: 4px;
  /* 启用 GPU 加速，优化滚动性能 */
  transform: translateZ(0);
  contain: layout style paint;
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

/* ===== 预警卡片样式 (复用自 RightSidebar) ===== */
.alert-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  flex-shrink: 0;
  contain: layout style;
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

.alert-card.blue {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05));
  border: 1px solid rgba(59, 130, 246, 0.3);
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
  font-size: 14px;
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
  font-size: 10px;
  color: var(--text-muted);
}

.alert-valid {
  font-size: 10px;
  color: var(--accent-cyan);
}

.alerts-more {
  text-align: center;
  font-size: 10px;
  color: var(--text-muted);
  padding: 6px 0;
  border-top: 1px dashed var(--border-subtle);
  margin-top: 6px;
}

/* 历史预警入口 */
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
