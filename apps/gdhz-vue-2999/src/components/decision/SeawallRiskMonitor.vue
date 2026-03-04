<template>
  <div class="panel seawall-panel" :class="{ collapsed: isCollapsed }">
    <div class="panel-header" @click="isCollapsed = !isCollapsed">
      <div class="panel-title">
        <i class="fa-solid fa-shield-halved"></i>
        海堤风险监测
        <span v-if="highRiskCount > 0" class="risk-count">{{ highRiskCount }}处高风险</span>
      </div>
      <i class="fa-solid fa-chevron-down toggle-icon"></i>
    </div>

    <div class="panel-content">
      <!-- 总体统计 -->
      <div class="seawall-stats">
        <div class="stat-item">
          <span class="stat-value">{{ seawallData.totalLength }}</span>
          <span class="stat-label">km 沿海海堤总长</span>
        </div>
        <div class="stat-item danger">
          <span class="stat-value">{{ seawallData.highRiskCount }}</span>
          <span class="stat-label">处 当前高风险段</span>
        </div>
      </div>

      <!-- 风险海堤列表 -->
      <div class="seawall-list">
        <div class="list-title">
          <i class="fa-solid fa-triangle-exclamation"></i>
          风险海堤段
        </div>
        <div class="seawalls">
          <div
            v-for="seawall in riskSeawalls"
            :key="seawall.id"
            class="seawall-item"
            :class="seawall.riskLevel"
            @click="handleSeawallClick(seawall)"
          >
            <div class="seawall-header">
              <span class="risk-indicator"></span>
              <span class="seawall-name">{{ seawall.name }}</span>
              <span class="seawall-length">({{ seawall.length }}km)</span>
            </div>
            <div class="seawall-details">
              <div class="detail-row">
                <span class="detail-label">设防标准:</span>
                <span class="detail-value">{{ seawall.designStandard }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">预测潮位:</span>
                <span class="detail-value" :class="{ over: seawall.overtopping > 0 }">
                  {{ seawall.overtopping > 0 ? '超堤顶' : '距堤顶' }}
                  {{ Math.abs(seawall.overtopping).toFixed(1) }}m
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">风险类型:</span>
                <span class="detail-value risk-type">{{ seawall.riskType }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 查看全部按钮 -->
      <button class="view-all-btn" @click="handleViewAll">
        <i class="fa-solid fa-list"></i>
        查看全部海堤
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { mockSeawallData } from '../../data/seaConditionData'

const isCollapsed = ref(true)

const emit = defineEmits(['seawall-click'])

const seawallData = computed(() => mockSeawallData)

// 高风险海堤
const riskSeawalls = computed(() => 
  mockSeawallData.seawalls.filter(s => s.riskLevel === 'high' || s.riskLevel === 'medium')
)

const highRiskCount = computed(() => 
  mockSeawallData.seawalls.filter(s => s.riskLevel === 'high').length
)

function handleSeawallClick(seawall) {
  emit('seawall-click', seawall)
}

function handleViewAll() {
  console.log('View all seawalls')
}
</script>

<style scoped>
.seawall-panel {
  background: var(--bg-panel);
  border: 1px solid var(--border-normal);
  border-radius: var(--border-radius);
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
}

.seawall-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 15%;
  right: 15%;
  height: 1px;
  background: linear-gradient(90deg, transparent, #06b6d4 30%, #06b6d4 70%, transparent);
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
  color: #06b6d4;
  display: flex;
  align-items: center;
  gap: 8px;
}

.risk-count {
  font-size: 9px;
  padding: 2px 6px;
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border-radius: 4px;
  font-weight: 600;
}

.toggle-icon {
  color: var(--text-muted);
  font-size: 10px;
  transition: transform 0.2s;
}

.seawall-panel.collapsed .toggle-icon {
  transform: rotate(-90deg);
}

.panel-content {
  padding: 0 12px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 500px;
  overflow: hidden;
  transition: max-height 0.3s, padding 0.3s;
}

.seawall-panel.collapsed .panel-content {
  max-height: 0;
  padding: 0 12px;
}

/* 总体统计 */
.seawall-stats {
  display: flex;
  gap: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 10px;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-mono);
}

.stat-item.danger .stat-value {
  color: #ef4444;
}

.stat-label {
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 2px;
}

/* 海堤列表 */
.seawall-list {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  padding: 10px;
}

.list-title {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.list-title i {
  color: #f59e0b;
}

.seawalls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 240px;
  overflow-y: auto;
  padding-right: 4px;
}

.seawalls::-webkit-scrollbar {
  width: 3px;
}

.seawalls::-webkit-scrollbar-thumb {
  background: var(--border-subtle);
  border-radius: 2px;
}

.seawall-item {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.seawall-item:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: translateX(4px);
}

.seawall-item.high {
  border-left-color: #ef4444;
}

.seawall-item.medium {
  border-left-color: #f59e0b;
}

.seawall-item.low {
  border-left-color: #10b981;
}

.seawall-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.risk-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.seawall-item.high .risk-indicator {
  background: #ef4444;
  box-shadow: 0 0 6px rgba(239, 68, 68, 0.5);
}

.seawall-item.medium .risk-indicator {
  background: #f59e0b;
}

.seawall-item.low .risk-indicator {
  background: #10b981;
}

.seawall-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.seawall-length {
  font-size: 10px;
  color: var(--text-muted);
}

.seawall-details {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-left: 14px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
}

.detail-label {
  color: var(--text-muted);
}

.detail-value {
  color: var(--text-secondary);
}

.detail-value.over {
  color: #ef4444;
  font-weight: 600;
}

.detail-value.risk-type {
  color: #f59e0b;
}

/* 查看全部按钮 */
.view-all-btn {
  width: 100%;
  padding: 8px 12px;
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
  color: var(--text-muted);
}

.view-all-btn:hover {
  background: rgba(6, 182, 212, 0.1);
  border-color: rgba(6, 182, 212, 0.4);
  color: #06b6d4;
}
</style>
