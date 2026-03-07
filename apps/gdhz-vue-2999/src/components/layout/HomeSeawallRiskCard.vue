<template>
  <section class="risk-card">
    <div class="section-head">
      <div>
        <div class="eyebrow">海堤值守</div>
        <div class="title">岸段与断点风险</div>
      </div>
      <div class="summary">{{ overview.seawallCount || 0 }} 条海堤</div>
    </div>

    <div class="top-stats">
      <div class="stat-item">
        <span class="label">高风险</span>
        <span class="value danger">{{ overview.highRiskCount || 0 }}</span>
      </div>
      <div class="stat-item">
        <span class="label">中风险</span>
        <span class="value warn">{{ overview.mediumRiskCount || 0 }}</span>
      </div>
      <div class="stat-item">
        <span class="label">岸段数</span>
        <span class="value">{{ overview.segmentCount || 0 }}</span>
      </div>
    </div>

    <div v-if="primarySegment" class="segment-card">
      <div class="segment-head">
        <div>
          <div class="segment-name">{{ primarySegment.name }}</div>
          <div class="segment-city">{{ primarySegment.city }}</div>
        </div>
        <span class="segment-count">{{ primarySegment.seawalls.length }} 条海堤</span>
      </div>

      <div
        v-for="seawall in primarySegment.seawalls.slice(0, 2)"
        :key="seawall.id"
        class="seawall-item"
      >
        <div class="seawall-name-row">
          <span class="seawall-name">{{ seawall.name }}</span>
          <span class="risk-pill" :class="seawall.riskLevel">{{ riskTextMap[seawall.riskLevel] || '关注' }}</span>
        </div>
        <div class="seawall-meta">
          <span>{{ seawall.designStandard }}</span>
          <span>{{ seawall.length }}km</span>
        </div>
        <div
          v-for="breakpoint in seawall.breakpoints.slice(0, 2)"
          :key="breakpoint.id"
          class="breakpoint-item"
        >
          <span class="breakpoint-name">{{ breakpoint.name }}</span>
          <span class="breakpoint-metric">堤顶 {{ breakpoint.crestElevation }}m</span>
          <span class="breakpoint-metric">预测潮位 {{ breakpoint.forecastTideLevel }}m</span>
          <span class="breakpoint-status" :class="{ danger: breakpoint.statusText.includes('漫堤') }">
            {{ breakpoint.statusText }}
          </span>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <span>当前站点暂无关联岸段，已回退到全省最高风险海堤。</span>
    </div>

    <div class="province-top">
      <div class="list-title">全省高风险海堤</div>
      <div
        v-for="seawall in provinceTopSeawalls"
        :key="seawall.id"
        class="province-item"
      >
        <span>{{ seawall.name }}</span>
        <span>{{ seawall.riskLevel === 'high' ? '高风险' : seawall.riskLevel === 'medium' ? '中风险' : '一般' }}</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  station: {
    type: Object,
    default: null,
  },
  overview: {
    type: Object,
    default: () => ({}),
  },
  seawalls: {
    type: Array,
    default: () => [],
  },
})

const riskTextMap = {
  high: '高风险',
  medium: '中风险',
  low: '一般',
}

const primarySegment = computed(() => props.station?.segmentSummaries?.[0] || null)

const provinceTopSeawalls = computed(() =>
  [...props.seawalls]
    .sort((a, b) => {
      const weight = { high: 0, medium: 1, low: 2 }
      return (weight[a.riskLevel] ?? 99) - (weight[b.riskLevel] ?? 99)
    })
    .slice(0, 3)
)
</script>

<style scoped>
.risk-card {
  height: 100%;
  border-radius: 12px;
  border: 1px solid rgba(14, 116, 144, 0.12);
  background: rgba(255, 255, 255, 0.78);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.eyebrow {
  font-size: 11px;
  color: var(--text-tertiary);
}

.title {
  margin-top: 2px;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.summary {
  font-size: 12px;
  color: var(--text-secondary);
}

.top-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.stat-item {
  border-radius: 10px;
  border: 1px solid var(--border-subtle);
  background: rgba(255, 255, 255, 0.78);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-item .label {
  font-size: 11px;
  color: var(--text-tertiary);
}

.stat-item .value {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-item .value.danger {
  color: #b91c1c;
}

.stat-item .value.warn {
  color: #b45309;
}

.segment-card {
  border-radius: 12px;
  border: 1px solid rgba(14, 116, 144, 0.1);
  background: rgba(248, 250, 252, 0.72);
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: auto;
}

.segment-head,
.seawall-name-row,
.province-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.segment-name,
.seawall-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.segment-city,
.seawall-meta,
.segment-count {
  font-size: 12px;
  color: var(--text-secondary);
}

.seawall-item {
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.84);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.seawall-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.risk-pill {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.risk-pill.high {
  color: #b91c1c;
  background: rgba(239, 68, 68, 0.14);
}

.risk-pill.medium {
  color: #b45309;
  background: rgba(245, 158, 11, 0.15);
}

.risk-pill.low {
  color: #0369a1;
  background: rgba(14, 165, 233, 0.12);
}

.breakpoint-item {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: 8px;
  font-size: 12px;
  align-items: center;
}

.breakpoint-name {
  font-weight: 600;
  color: var(--text-primary);
}

.breakpoint-metric {
  color: var(--text-secondary);
}

.breakpoint-status {
  color: #0369a1;
  font-weight: 700;
}

.breakpoint-status.danger {
  color: #b91c1c;
}

.province-top {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
}

.province-item {
  padding: 6px 8px;
  border-radius: 8px;
  background: rgba(248, 250, 252, 0.8);
  font-size: 12px;
  color: var(--text-primary);
}

.empty-state {
  padding: 12px;
  border-radius: 10px;
  background: rgba(248, 250, 252, 0.8);
  color: var(--text-secondary);
  font-size: 12px;
}
</style>
