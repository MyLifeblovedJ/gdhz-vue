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

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <select v-model="selectedCity" class="filter-select city-select">
        <option value="">全部城市</option>
        <option v-for="city in cities" :key="city" :value="city">{{ city }}</option>
      </select>
      <div class="filter-pills">
        <button
          v-for="opt in riskOptions"
          :key="opt.value"
          class="pill"
          :class="{ active: selectedRisk === opt.value, [opt.cls]: true }"
          @click="selectedRisk = opt.value"
        >{{ opt.label }}</button>
      </div>
    </div>

    <!-- 列表 -->
    <div class="breakpoint-list">
      <div
        v-for="bp in filteredItems"
        :key="bp.id"
        class="bp-row"
        :class="{ overflow: bp.isOverflow }"
      >
        <div class="bp-main">
          <span class="bp-name">
            <span class="bp-title">{{ bp.seawallName }} · {{ bp.name }}</span>
            <button
              v-if="bp.stationId"
              class="bp-station-btn"
              type="button"
              @click.stop="handleStationClick(bp)"
            >
              <i class="fa-solid fa-tower-observation"></i>
              {{ bp.stationName }}
            </button>
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
            <span class="metric-label">峰值时间</span>
            <span class="metric-value">{{ bp.peakTime }}</span>
          </div>
          <div class="metric">
            <span class="metric-label">差值</span>
            <span class="metric-value diff-value" :class="bp.riskCls">
              {{ bp.diff > 0 ? '+' : '' }}{{ bp.diff.toFixed(2) }}m
            </span>
          </div>
        </div>
      </div>
      <div v-if="filteredItems.length === 0" class="empty-hint">
        <i class="fa-solid fa-circle-check"></i>
        当前筛选条件下无记录
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { homeMonitoringMockData } from '../../data/homeMonitoringData'
import { buildSeawallRiskItems, buildSeawallRiskStats } from '../../utils/seawallRisk'
import { mockDevices } from '../../data/mockData'

const emit = defineEmits(['station-click'])

const allItems = computed(() => buildSeawallRiskItems(homeMonitoringMockData))
const riskStats = computed(() => buildSeawallRiskStats(allItems.value))

// 筛选状态
const selectedCity = ref('')
const selectedRisk = ref('')

// 城市列表
const cities = computed(() => {
  const set = new Set(allItems.value.map(item => item.city).filter(Boolean))
  return [...set].sort()
})

// 是否有任何风险记录
const hasAnyRisk = computed(() => allItems.value.some(item => item.riskCls !== 'safe'))

// 有风险时默认只显示风险项
watch(hasAnyRisk, (v) => {
  selectedRisk.value = v ? 'risk' : ''
}, { immediate: true })

// 筛选选项
const riskOptions = [
  { label: '全部', value: '', cls: 'pill-all' },
  { label: '漫堤', value: 'danger', cls: 'pill-danger' },
  { label: '警戒', value: 'warn', cls: 'pill-warn' },
  { label: '安全', value: 'safe', cls: 'pill-safe' },
  { label: '风险', value: 'risk', cls: 'pill-risk' },
]

// 筛选 + 排序结果
const filteredItems = computed(() => {
  let items = allItems.value

  // 按城市筛选
  if (selectedCity.value) {
    items = items.filter(item => item.city === selectedCity.value)
  }

  // 按风险等级筛选
  if (selectedRisk.value === 'risk') {
    items = items.filter(item => item.riskCls !== 'safe')
  } else if (selectedRisk.value === 'danger') {
    items = items.filter(item => item.riskCls === 'danger')
  } else if (selectedRisk.value === 'warn') {
    items = items.filter(item => item.riskCls === 'warn')
  } else if (selectedRisk.value === 'safe') {
    items = items.filter(item => item.riskCls === 'safe')
  }

  // 无风险时：按 diff 倒序（最接近堤顶的排前面）
  if (!hasAnyRisk.value) {
    items = [...items].sort((a, b) => b.diff - a.diff)
  }

  return items
})

function findMatchingDevice(bp) {
  // 尝试通过城市名 + 类型匹配 surge_station 设备
  return mockDevices.find(d =>
    d.type === 'surge_station' &&
    d.name?.includes(bp.city?.replace('市', ''))
  ) || mockDevices.find(d => d.type === 'surge_station') || null
}

function handleStationClick(bp) {
  const device = findMatchingDevice(bp)
  if (device) {
    // 将海堤断面的预测信息挂载到设备上，供 DetailPopup 使用
    emit('station-click', {
      ...device,
      forecastPeakValue: bp.forecastPeakValue,
      forecastPeakUnit: bp.forecastPeakUnit,
      peakTime: bp.peakTime,
      tideType: bp.stationType === 'surge' ? 'storm' : 'astronomical',
    })
  }
}
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

/* ── 筛选栏 ── */
.filter-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-select {
  flex-shrink: 0;
  height: 26px;
  padding: 0 6px;
  border-radius: 7px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(255, 255, 255, 0.82);
  color: var(--text-primary, #0f172a);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  transition: border-color 0.18s ease;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 5 5-5' fill='none' stroke='%2394a3b8' stroke-width='1.3'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 6px center;
  padding-right: 18px;
}

.filter-select:focus {
  border-color: rgba(15, 23, 42, 0.28);
}

.filter-pills {
  display: flex;
  gap: 3px;
  flex-wrap: nowrap;
  overflow-x: auto;
}

.pill {
  flex-shrink: 0;
  height: 26px;
  padding: 0 8px;
  border-radius: 7px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.72);
  color: var(--text-secondary, #475569);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;
}

.pill:hover {
  border-color: rgba(15, 23, 42, 0.18);
  background: rgba(255, 255, 255, 0.92);
}

.pill.active.pill-all {
  border-color: rgba(15, 23, 42, 0.22);
  background: rgba(15, 23, 42, 0.06);
  color: var(--text-primary, #0f172a);
}

.pill.active.pill-danger {
  border-color: rgba(185, 28, 28, 0.22);
  background: rgba(239, 68, 68, 0.1);
  color: #b91c1c;
}

.pill.active.pill-warn {
  border-color: rgba(180, 83, 9, 0.22);
  background: rgba(245, 158, 11, 0.1);
  color: #b45309;
}

.pill.active.pill-safe {
  border-color: rgba(3, 105, 161, 0.22);
  background: rgba(14, 165, 233, 0.1);
  color: #0369a1;
}

.pill.active.pill-risk {
  border-color: rgba(185, 28, 28, 0.22);
  background: rgba(239, 68, 68, 0.08);
  color: #b91c1c;
}

/* ── 列表 ── */
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

.bp-station-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid rgba(14, 165, 233, 0.2);
  background: rgba(14, 165, 233, 0.06);
  color: #0369a1;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;
}

.bp-station-btn:hover {
  border-color: rgba(14, 165, 233, 0.35);
  background: rgba(14, 165, 233, 0.14);
  color: #0284c7;
}

.bp-station-btn i {
  font-size: 10px;
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
  grid-template-columns: repeat(4, minmax(0, 1fr));
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

.diff-value.danger {
  color: #b91c1c;
  font-weight: 700;
}

.diff-value.warn {
  color: #b45309;
  font-weight: 700;
}

.diff-value.safe {
  color: #0369a1;
}

/* 空状态 */
.empty-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 20px 0;
  font-size: 12px;
  color: var(--text-tertiary, #94a3b8);
}

.empty-hint i {
  color: #10b981;
}
</style>
