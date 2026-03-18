<template>
  <div class="seawall-risk-panel">
    <!-- 统计概览 -->
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
      <select v-model="selectedForecast" class="filter-select forecast-select">
        <option v-for="src in forecastSources" :key="src.id" :value="src.id">
          {{ src.name }}
        </option>
      </select>
      <div class="filter-pills">
        <button
          v-for="opt in assetTypeOptions"
          :key="opt.value"
          class="pill"
          :class="{ active: selectedAssetType === opt.value, [opt.cls]: true }"
          @click="selectedAssetType = opt.value"
        >{{ opt.label }}</button>
      </div>
    </div>

    <!-- 风险列表 -->
    <div class="breakpoint-list">
      <div v-for="item in filteredItems" :key="item.assetId" class="bp-row">
        <div class="bp-main">
          <span class="bp-name">
            <span class="bp-title">
              <i :class="item.typeIcon" :style="{ color: item.typeColor }"></i>
              {{ item.name }}
            </span>
            <span class="bp-city">
              <i class="fa-solid fa-tag"></i>
              {{ item.typeLabel }}
            </span>
          </span>
          <span class="bp-risk-tag" :class="item.riskCls">{{ item.riskLabel }}</span>
        </div>
        <div class="bp-metrics">
          <div class="metric">
            <span class="metric-label">面临浪高</span>
            <span class="metric-value" :class="item.riskCls">{{ item.waveHeight.toFixed(1) }}m</span>
          </div>
          <div class="metric">
            <span class="metric-label">经度</span>
            <span class="metric-value">{{ item.lng.toFixed(2) }}°E</span>
          </div>
          <div class="metric">
            <span class="metric-label">纬度</span>
            <span class="metric-value">{{ item.lat.toFixed(2) }}°N</span>
          </div>
        </div>
      </div>
      <div v-if="filteredItems.length === 0 && !loading" class="empty-hint">
        <i class="fa-solid fa-circle-check"></i>
        当前筛选条件下无风险记录
      </div>
      <div v-if="loading" class="empty-hint">
        <i class="fa-solid fa-spinner fa-spin"></i>
        加载中...
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import {
  fetchWaveForecastSources,
  fetchSeaRiskAssessment,
  ASSET_TYPES,
} from '../../data/seaRiskData'

const emit = defineEmits(['forecast-change', 'asset-filter-change'])

const forecastSources = ref([])
const allItems = ref([])
const selectedForecast = ref('')
const selectedAssetType = ref('')
const loading = ref(false)

const assetTypeOptions = [
  { value: '', label: '全部', cls: '' },
  { value: 'vessel', label: '船舶', cls: '' },
  { value: 'wind_farm', label: '海上风电', cls: '' },
  { value: 'marine_ranch', label: '海洋牧场', cls: '' },
]

// 统计
const riskStats = computed(() => {
  const items = allItems.value
  return [
    { label: '高风险', value: items.filter(i => i.riskLevel === 'high').length, cls: 'danger' },
    { label: '中风险', value: items.filter(i => i.riskLevel === 'medium').length, cls: 'warn' },
    { label: '承灾体总数', value: items.length, cls: '' },
  ]
})

// 筛选
const filteredItems = computed(() => {
  let items = allItems.value
  if (selectedAssetType.value) {
    items = items.filter(i => i.type === selectedAssetType.value)
  }
  return items
})

// 加载预报源
onMounted(async () => {
  forecastSources.value = await fetchWaveForecastSources()
  if (forecastSources.value.length > 0) {
    selectedForecast.value = forecastSources.value[0].id
  }
})

// 切换预报源时重新加载数据
watch(selectedForecast, async (id) => {
  if (!id) return
  loading.value = true
  try {
    allItems.value = await fetchSeaRiskAssessment(id)
  } finally {
    loading.value = false
  }
  emit('forecast-change', id)
}, { immediate: false })

// 初始加载
watch(forecastSources, async (sources) => {
  if (sources.length > 0 && selectedForecast.value) {
    loading.value = true
    try {
      allItems.value = await fetchSeaRiskAssessment(selectedForecast.value)
    } finally {
      loading.value = false
    }
  }
})

watch(selectedAssetType, (type) => {
  emit('asset-filter-change', type)
})
</script>

<style scoped>
.seawall-risk-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
}

.risk-header {
  flex-shrink: 0;
}

.risk-stats {
  display: flex;
  gap: 6px;
}

.stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 0;
  border-radius: 8px;
  background: rgba(248, 250, 252, 0.8);
  border: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.15));
}

.stat-value {
  font-size: 18px;
  font-weight: 800;
  line-height: 1.2;
  color: var(--text-primary, #0f172a);
}

.stat-value.danger { color: #dc2626; }
.stat-value.warn { color: #d97706; }
.stat-value.safe { color: #059669; }

.stat-label {
  font-size: 10px;
  color: var(--text-tertiary, #94a3b8);
  margin-top: 2px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.filter-select {
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.2));
  background: rgba(255, 255, 255, 0.9);
  font-size: 11px;
  color: var(--text-primary, #0f172a);
  cursor: pointer;
  flex-shrink: 0;
}

.forecast-select {
  max-width: 140px;
}

.filter-pills {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.pill {
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.2));
  background: rgba(255, 255, 255, 0.7);
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary, #475569);
  cursor: pointer;
  transition: all 0.15s ease;
}

.pill:hover {
  border-color: rgba(14, 165, 233, 0.3);
  background: rgba(14, 165, 233, 0.06);
}

.pill.active {
  border-color: #0ea5e9;
  background: rgba(14, 165, 233, 0.1);
  color: #0369a1;
}

.breakpoint-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bp-row {
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.12));
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: border-color 0.15s ease;
}

.bp-row:hover {
  border-color: rgba(14, 165, 233, 0.25);
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
  color: var(--text-primary, #0f172a);
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 8px;
}

.bp-title {
  color: var(--text-primary, #0f172a);
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.bp-title i {
  font-size: 11px;
}

.bp-city {
  font-size: 10px;
  color: var(--text-tertiary, #94a3b8);
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.bp-city i {
  font-size: 10px;
  color: var(--text-tertiary, #94a3b8);
}

.bp-risk-tag {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}

.bp-risk-tag.danger {
  color: #991b1b;
  background: rgba(220, 38, 38, 0.1);
}

.bp-risk-tag.warn {
  color: #92400e;
  background: rgba(217, 119, 6, 0.1);
}

.bp-risk-tag.safe {
  color: #065f46;
  background: rgba(5, 150, 105, 0.1);
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
}

.metric-label {
  font-size: 10px;
  color: var(--text-tertiary, #94a3b8);
}

.metric-value {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
}

.metric-value.danger { color: #dc2626; }
.metric-value.warn { color: #d97706; }
.metric-value.safe { color: #059669; }

.empty-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 0;
  color: var(--text-tertiary, #94a3b8);
  font-size: 13px;
}

.empty-hint i {
  font-size: 20px;
  opacity: 0.5;
}
</style>
