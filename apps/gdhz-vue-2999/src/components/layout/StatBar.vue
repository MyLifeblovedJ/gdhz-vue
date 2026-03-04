<template>
  <div class="stat-bar">
    <div class="stat-card" style="--glow-color: var(--accent-cyan);">
      <div class="stat-icon">
        <i class="fa-solid fa-satellite-dish"></i>
      </div>
      <div class="stat-content">
        <div class="stat-value">{{ stats.totalDevices }}</div>
        <div class="stat-label">设备总数</div>
      </div>
    </div>
    
    <div class="stat-card" style="--glow-color: var(--status-online);">
      <div class="stat-icon online">
        <i class="fa-solid fa-circle-check"></i>
      </div>
      <div class="stat-content">
        <div class="stat-value">{{ stats.onlineDevices }}</div>
        <div class="stat-label">在线设备</div>
      </div>
    </div>
    
    <div class="stat-card" style="--glow-color: var(--alert-red);">
      <div class="stat-icon alert">
        <i class="fa-solid fa-triangle-exclamation"></i>
      </div>
      <div class="stat-content">
        <div class="stat-value">{{ alertDevicesCount }}</div>
        <div class="stat-label">预警设备</div>
      </div>
    </div>
    
    <div class="stat-divider"></div>
    
    <div class="stat-card" style="--glow-color: #6366f1;">
      <div class="stat-icon data">
        <i class="fa-solid fa-database"></i>
      </div>
      <div class="stat-content">
        <div class="stat-value">{{ databaseStats.totalData }}<span class="stat-unit">TB</span></div>
        <div class="stat-label">数据总量</div>
      </div>
    </div>
    
    <div class="stat-card" style="--glow-color: #6366f1;">
      <div class="stat-icon data">
        <i class="fa-solid fa-chart-line"></i>
      </div>
      <div class="stat-content">
        <div class="stat-value">{{ databaseStats.todayData }}<span class="stat-unit">万</span></div>
        <div class="stat-label">今日数据</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../../stores/app'

const store = useAppStore()

const stats = computed(() => store.stats)
const databaseStats = computed(() => store.databaseStats)

// 预警设备数量
const alertDevicesCount = computed(() => 
  store.devices.filter(d => d.status === 'alarm' || d.status === 'warn').length
)
</script>

<style scoped>

.stat-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  margin-top: 10px;
  background: linear-gradient(135deg, 
    rgba(0, 15, 30, 0.95) 0%,
    rgba(0, 30, 50, 0.85) 100%);
  border: 1px solid rgba(0, 180, 230, 0.2);
  border-top-color: rgba(0, 180, 230, 0.4);
  border-bottom-color: rgba(0, 20, 40, 0.5);
  border-radius: 12px;
  backdrop-filter: blur(20px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0) 100%);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-top-color: rgba(255, 255, 255, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex: 1;
  min-width: 0;
  position: relative;
  overflow: hidden;
}

.stat-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--glow-color), transparent);
  opacity: 0.5;
}

.stat-card:hover {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
  border-color: var(--glow-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px color-mix(in srgb, var(--glow-color) 20%, transparent);
}

.stat-icon {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--accent-cyan) 80%, white), var(--accent-cyan));
  color: rgba(0, 0, 0, 0.8);
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.4);
  position: relative;
}

/* 统一图标风格为拟物立体球体 */
.stat-icon::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  right: 2px;
  bottom: 2px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  pointer-events: none;
}

.stat-icon.online {
  background: radial-gradient(circle at 30% 30%, #4ade80, #16a34a);
}

.stat-icon.alert {
  background: radial-gradient(circle at 30% 30%, #f87171, #dc2626);
  animation: icon-pulse 2s infinite;
}

@keyframes icon-pulse {
  0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
  100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
}

.stat-icon.data {
  background: radial-gradient(circle at 30% 30%, #818cf8, #4f46e5);
}

.stat-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.stat-value {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  line-height: 1;
  background: linear-gradient(180deg, #fff 0%, #e0e0e0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stat-unit {
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  margin-left: 2px;
  -webkit-text-fill-color: initial;
}

.stat-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 4px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: linear-gradient(180deg, transparent, var(--border-subtle), transparent);
  margin: 0 8px;
}
</style>
