<template>
  <div class="seawall-risk-panel">
    <div class="risk-header">
      <div class="risk-stats">
        <div class="stat" v-for="stat in riskStats" :key="stat.label">
          <span class="stat-value" :class="stat.cls">{{ stat.value }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
      </div>
    </div>

    <div class="breakpoint-list">
      <div
        v-for="bp in sortedBreakpoints"
        :key="bp.id"
        class="bp-row"
        :class="{ overflow: bp.isOverflow }"
      >
        <div class="bp-main">
          <span class="bp-name">
            <span class="bp-title">{{ bp.seawallName }} · {{ bp.name }}</span>
            <span class="bp-city">
              <i class="fa-solid fa-location-dot"></i>
              {{ bp.city }}
            </span>
          </span>
          <span class="bp-risk-tag" :class="bp.riskCls">{{ bp.riskText }}</span>
        </div>
        <div class="bp-metrics">
          <div class="metric">
            <span class="metric-label">堤顶高程</span>
            <span class="metric-value">{{ bp.crestElevation }}m</span>
          </div>
          <div class="metric">
            <span class="metric-label">预测潮位</span>
            <span class="metric-value" :class="{ danger: bp.isOverflow }">{{ bp.forecastTideLevel }}m</span>
          </div>
          <div class="metric">
            <span class="metric-label">关联站点</span>
            <span class="metric-value station">{{ bp.stationName }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { homeMonitoringMockData } from '../../data/homeMonitoringData'
import { buildSeawallRiskItems, buildSeawallRiskStats } from '../../utils/seawallRisk'

const sortedBreakpoints = computed(() => buildSeawallRiskItems(homeMonitoringMockData))
const riskStats = computed(() => buildSeawallRiskStats(sortedBreakpoints.value))
</script>

<style scoped>
.seawall-risk-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  min-height: 0;
}

.risk-header {
  flex-shrink: 0;
}

.risk-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 4px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  background: rgba(255, 255, 255, 0.72);
}

.stat-value {
  font-size: 18px;
  font-weight: 800;
  font-family: var(--font-display, 'DIN Alternate', sans-serif);
  color: var(--text-primary);
}

.stat-value.danger { color: #b91c1c; }
.stat-value.warn { color: #b45309; }

.stat-label {
  font-size: 11px;
  color: var(--text-tertiary);
}

.breakpoint-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.breakpoint-list::-webkit-scrollbar {
  width: 3px;
}

.breakpoint-list::-webkit-scrollbar-track {
  background: transparent;
}

.breakpoint-list::-webkit-scrollbar-thumb {
  background: rgba(15, 23, 42, 0.12);
  border-radius: 2px;
}

.bp-row {
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.78);
  padding: 9px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.bp-row.overflow {
  border-color: rgba(239, 68, 68, 0.24);
  background: linear-gradient(135deg, rgba(254, 242, 242, 0.7), rgba(255, 255, 255, 0.78));
}

.bp-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.bp-name {
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
  color: var(--text-primary);
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 8px;
}

.bp-title {
  color: var(--text-primary);
}

.bp-city {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary);
}

.bp-city i {
  font-size: 10px;
  color: var(--text-tertiary);
}

.bp-risk-tag {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.bp-risk-tag.danger {
  color: #b91c1c;
  background: rgba(239, 68, 68, 0.14);
}

.bp-risk-tag.warn {
  color: #b45309;
  background: rgba(245, 158, 11, 0.15);
}

.bp-risk-tag.safe {
  color: #0369a1;
  background: rgba(14, 165, 233, 0.12);
}

.bp-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.metric-label {
  font-size: 11px;
  color: var(--text-tertiary);
}

.metric-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  font-family: var(--font-display, 'DIN Alternate', sans-serif);
}

.metric-value.danger {
  color: #b91c1c;
  font-weight: 700;
}

.metric-value.station {
  font-family: var(--font-sans);
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
