<template>
  <section class="home-station-detail-dock">
    <div class="dock-head">
      <div class="head-copy">
        <div class="eyebrow">{{ labels.title }}</div>
        <div class="station-name">{{ station?.name || labels.emptyTitle }}</div>
        <div v-if="station" class="station-meta">{{ metaText }}</div>
      </div>
      <span v-if="station" class="status-pill" :class="station.status">{{ statusText }}</span>
    </div>

    <div v-if="station" class="metric-grid">
      <div class="metric-card">
        <span class="label">{{ labels.current }}</span>
        <span class="value">{{ currentText }}</span>
      </div>
      <div class="metric-card">
        <span class="label">{{ labels.threshold }}</span>
        <span class="value">{{ thresholdText }}</span>
      </div>
      <div class="metric-card metric-card--accent">
        <span class="label">{{ labels.assessment }}</span>
        <span class="value">{{ station.thresholdText || '--' }}</span>
      </div>
      <div class="metric-card">
        <span class="label">{{ labels.peak }}</span>
        <span class="value">{{ forecastPeakText }}</span>
      </div>
      <div class="metric-card">
        <span class="label">{{ labels.updatedAt }}</span>
        <span class="value">{{ observedAtText }}</span>
      </div>
    </div>

    <div v-else class="empty-state">
      {{ labels.emptyText }}
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { formatMetricValue } from '../../utils/homeMonitoring'

const props = defineProps({
  station: {
    type: Object,
    default: null,
  },
  updatedAt: {
    type: String,
    default: '',
  },
})

const labels = {
  title: '\u7ad9\u70b9\u8be6\u60c5',
  emptyTitle: '\u6682\u65e0\u7ad9\u70b9',
  emptyText: '\u5f53\u524d\u65e0\u53ef\u5c55\u793a\u7684\u9884\u8b66\u7ad9\u70b9',
  current: '\u89c2\u6d4b\u503c',
  threshold: '\u9608\u503c',
  assessment: '\u98ce\u9669\u5224\u65ad',
  peak: '\u9884\u6d4b\u5cf0\u503c',
  updatedAt: '\u66f4\u65b0\u65f6\u95f4',
}

const statusMap = {
  alarm: '\u544a\u8b66',
  warn: '\u9884\u8b66',
  online: '\u6b63\u5e38',
  offline: '\u79bb\u7ebf',
}

const statusText = computed(() => statusMap[props.station?.status] || '\u5173\u6ce8')
const currentText = computed(() => formatMetricValue(props.station?.currentValue, props.station?.unit))
const thresholdText = computed(() => formatMetricValue(props.station?.thresholdValue, props.station?.thresholdUnit))
const forecastPeakText = computed(() => formatMetricValue(props.station?.forecastPeakValue, props.station?.unit))
const observedAtText = computed(() => props.station?.observedAt || props.updatedAt || '--')

const metaText = computed(() => {
  if (!props.station) {
    return ''
  }

  return [
    props.station.stationTypeLabel,
    props.station.city,
    `${labels.updatedAt} ${observedAtText.value}`,
  ]
    .filter(Boolean)
    .join(' | ')
})
</script>

<style scoped>
.home-station-detail-dock {
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  background: rgba(255, 255, 255, 0.68);
  backdrop-filter: blur(18px) saturate(1.02);
  -webkit-backdrop-filter: blur(18px) saturate(1.02);
  box-shadow: var(--shadow-panel);
  padding: 12px;
}

.dock-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.head-copy {
  min-width: 0;
}

.eyebrow {
  font-size: 11px;
  color: var(--text-tertiary);
}

.station-name {
  margin-top: 2px;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.station-meta {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-pill {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.status-pill.alarm {
  color: #b91c1c;
  background: rgba(239, 68, 68, 0.14);
}

.status-pill.warn {
  color: #b45309;
  background: rgba(245, 158, 11, 0.16);
}

.status-pill.online {
  color: #15803d;
  background: rgba(34, 197, 94, 0.14);
}

.status-pill.offline {
  color: #64748b;
  background: rgba(148, 163, 184, 0.14);
}

.metric-grid {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.metric-card {
  border-radius: 10px;
  border: 1px solid var(--border-subtle);
  background: rgba(255, 255, 255, 0.82);
  padding: 8px 10px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-card--accent {
  background: rgba(245, 158, 11, 0.08);
  border-color: rgba(245, 158, 11, 0.2);
}

.label {
  font-size: 11px;
  color: var(--text-tertiary);
}

.value {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-state {
  margin-top: 10px;
  min-height: 76px;
  border-radius: 10px;
  border: 1px dashed var(--border-subtle);
  background: rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  font-size: 13px;
}

@media (max-width: 1480px) {
  .metric-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1120px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
