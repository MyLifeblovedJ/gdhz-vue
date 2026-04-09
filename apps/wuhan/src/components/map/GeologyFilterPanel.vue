<template>
  <div class="geology-filter-panel">
    <!-- 顶部筛选器 -->
    <div class="top-filters">
      <div class="filter-grid">
        <div class="filter-cell">
          <span class="filter-label">MGGID</span>
          <select v-model="filters.mggid" class="filter-select" @change="onFilterChange">
            <option value="">全部</option>
            <option v-for="opt in mggidOptions" :key="opt.value" :value="opt.value">
              {{ opt.value }}（{{ opt.count }}）
            </option>
          </select>
        </div>
        <div class="filter-cell">
          <span class="filter-label">数据集</span>
          <select v-model="filters.title" class="filter-select" @change="onFilterChange">
            <option value="">全部</option>
            <option v-for="opt in titleOptions" :key="opt.value" :value="opt.value">
              {{ opt.value }}（{{ opt.count }}）
            </option>
          </select>
        </div>
        <div class="filter-cell">
          <span class="filter-label">机构</span>
          <select v-model="filters.institution" class="filter-select" @change="onFilterChange">
            <option value="">全部</option>
            <option v-for="opt in institutionOptions" :key="opt.value" :value="opt.value">
              {{ opt.value }}（{{ opt.count }}）
            </option>
          </select>
        </div>
        <div class="filter-cell">
          <span class="filter-label">调查船</span>
          <select v-model="filters.ship" class="filter-select" @change="onFilterChange">
            <option value="">全部</option>
            <option v-for="opt in shipOptions" :key="opt.value" :value="opt.value">
              {{ opt.value }}（{{ opt.count }}）
            </option>
          </select>
        </div>
        <div class="filter-cell">
          <span class="filter-label">设备</span>
          <select v-model="filters.device" class="filter-select" @change="onFilterChange">
            <option value="">全部</option>
            <option v-for="opt in deviceOptions" :key="opt.value" :value="opt.value">
              {{ opt.value }}（{{ opt.count }}）
            </option>
          </select>
        </div>
        <div class="filter-cell">
          <span class="filter-label">起始日期</span>
          <input
            type="date"
            v-model="filters.dateStart"
            class="filter-input"
            :min="dateRange.min"
            :max="filters.dateEnd || dateRange.max"
            @change="onFilterChange"
          >
        </div>
        <div class="filter-cell">
          <span class="filter-label">结束日期</span>
          <input
            type="date"
            v-model="filters.dateEnd"
            class="filter-input"
            :min="filters.dateStart || dateRange.min"
            :max="dateRange.max"
            @change="onFilterChange"
          >
        </div>
      </div>
      <div class="filter-summary">
        <span class="summary-text">
          共 <strong>{{ filteredTotal }}</strong> 条采样记录
        </span>
        <div class="summary-actions">
          <button v-if="store.geology.focusFilter" class="reset-focus-btn" @click="resetFocus">
            <i class="fa-solid fa-eye"></i> 查看全部
          </button>
          <button v-if="hasActiveFilter" class="clear-btn" @click="clearFilters">
            <i class="fa-solid fa-xmark"></i> 清空筛选
          </button>
        </div>
      </div>
      <!-- 只看提示条 -->
      <div v-if="store.geology.focusFilter" class="focus-indicator">
        <i class="fa-solid fa-eye"></i>
        <span>只看{{ focusTypeLabel }}：<strong>{{ store.geology.focusFilter.label }}</strong></span>
        <button class="focus-close" @click="resetFocus">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>

    <!-- 树形结果区 -->
    <div class="tree-area">
      <TreeLevel
        :nodes="treeData"
        :level="0"
        :default-show-count="5"
        :expanded-map="expandedMap"
        @toggle="toggleNode"
        @sample-click="handleSampleClick"
        @focus-node="handleFocusNode"
      />
      <div v-if="!treeData.length" class="tree-empty">
        <i class="fa-solid fa-filter-circle-xmark"></i>
        <span>未找到匹配的采样记录</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useAppStore } from '../../stores/app'
import {
  buildGeologyHierarchicalTree,
  extractYearFromYearmoda,
  getUniqueFieldValues,
  filterByTopFilters,
} from '../../utils/geologySampling'
import TreeLevel from './GeologyFilterTreeLevel.vue'

const store = useAppStore()

const emit = defineEmits(['sample-click'])

const filters = reactive({
  mggid: '',
  title: '',
  institution: '',
  ship: '',
  device: '',
  dateStart: '',
  dateEnd: '',
})

const expandedMap = ref({})

// 所有可见记录（原始 + 处理后，已受图层开关控制）
const baseRecords = computed(() => {
  const records = []
  if (store.geology.layers.rawVisible) {
    records.push(...store.geology.records.raw)
  }
  if (store.geology.layers.processedVisible) {
    records.push(...store.geology.records.processed)
  }
  return records
})

// 将日期筛选器的值转换为 filterByTopFilters 可用的格式
const effectiveFilters = computed(() => {
  const f = {
    mggid: filters.mggid,
    title: filters.title,
    institution: filters.institution,
    ship: filters.ship,
    device: filters.device,
  }
  if (filters.dateStart) {
    f.yearStart = filters.dateStart.replace(/-/g, '')
  }
  if (filters.dateEnd) {
    f.yearEnd = filters.dateEnd.replace(/-/g, '')
  }
  return f
})

// 当前筛选条件过滤后的记录
const filteredRecords = computed(() => filterByTopFilters(baseRecords.value, effectiveFilters.value))
const filteredTotal = computed(() => filteredRecords.value.length)

const hasActiveFilter = computed(() =>
  filters.mggid || filters.title || filters.institution || filters.ship || filters.device || filters.dateStart || filters.dateEnd,
)

// 下拉选项：每个下拉框基于"除自身外的所有筛选条件"过滤记录后计算，实现完全联动
function filtersExcept(...excludeKeys) {
  const base = effectiveFilters.value
  const result = {}
  if (!excludeKeys.includes('mggid') && base.mggid) result.mggid = base.mggid
  if (!excludeKeys.includes('title') && base.title) result.title = base.title
  if (!excludeKeys.includes('institution') && base.institution) result.institution = base.institution
  if (!excludeKeys.includes('ship') && base.ship) result.ship = base.ship
  if (!excludeKeys.includes('device') && base.device) result.device = base.device
  if (!excludeKeys.includes('date') && base.yearStart) result.yearStart = base.yearStart
  if (!excludeKeys.includes('date') && base.yearEnd) result.yearEnd = base.yearEnd
  return result
}

const mggidOptions = computed(() =>
  getUniqueFieldValues(filterByTopFilters(baseRecords.value, filtersExcept('mggid')), 'mggid'),
)
const titleOptions = computed(() =>
  getUniqueFieldValues(filterByTopFilters(baseRecords.value, filtersExcept('title')), 'title'),
)
const institutionOptions = computed(() =>
  getUniqueFieldValues(filterByTopFilters(baseRecords.value, filtersExcept('institution')), 'institution'),
)
const shipOptions = computed(() =>
  getUniqueFieldValues(filterByTopFilters(baseRecords.value, filtersExcept('ship')), 'ship'),
)
const deviceOptions = computed(() =>
  getUniqueFieldValues(filterByTopFilters(baseRecords.value, filtersExcept('device')), 'device'),
)

// 日期范围：基于除日期外的所有筛选条件过滤后计算
const dateRange = computed(() => {
  const source = filterByTopFilters(baseRecords.value, filtersExcept('date'))
  let min = ''
  let max = ''
  for (const record of source) {
    const raw = String(record?.yearmoda ?? '').trim()
    if (raw.length >= 8) {
      const iso = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
      if (!min || iso < min) min = iso
      if (!max || iso > max) max = iso
    }
  }
  return { min, max }
})

// 只看类型中文标签
const focusTypeLabel = computed(() => {
  const labels = { institution: '机构', ship: '调查船', cruise: '航次' }
  return labels[store.geology.focusFilter?.type] || ''
})

// 层级树
const treeData = computed(() => buildGeologyHierarchicalTree(baseRecords.value, effectiveFilters.value))

function onFilterChange() {
  // 联动清理：当已选值不在当前可选范围内时自动重置
  const validMggids = new Set(mggidOptions.value.map(o => o.value))
  const validTitles = new Set(titleOptions.value.map(o => o.value))
  const validInstitutions = new Set(institutionOptions.value.map(o => o.value))
  const validShips = new Set(shipOptions.value.map(o => o.value))
  const validDevices = new Set(deviceOptions.value.map(o => o.value))

  if (filters.mggid && !validMggids.has(filters.mggid)) filters.mggid = ''
  if (filters.title && !validTitles.has(filters.title)) filters.title = ''
  if (filters.institution && !validInstitutions.has(filters.institution)) filters.institution = ''
  if (filters.ship && !validShips.has(filters.ship)) filters.ship = ''
  if (filters.device && !validDevices.has(filters.device)) filters.device = ''

  expandedMap.value = {}
}

function clearFilters() {
  filters.mggid = ''
  filters.title = ''
  filters.institution = ''
  filters.ship = ''
  filters.device = ''
  filters.dateStart = ''
  filters.dateEnd = ''
  expandedMap.value = {}
}

function toggleNode(nodeId) {
  const next = { ...expandedMap.value }
  if (next[nodeId]) {
    delete next[nodeId]
  } else {
    next[nodeId] = true
  }
  expandedMap.value = next
}

function handleSampleClick(record) {
  emit('sample-click', record)
}

function handleFocusNode(payload) {
  store.setGeologyFocusFilter({
    type: payload.type,
    label: payload.label,
    filters: payload.filters,
  })
}

function resetFocus() {
  store.clearGeologyFocusFilter()
}
</script>

<style scoped>
.geology-filter-panel {
  display: flex;
  flex-direction: column;
  gap: 0;
  height: 100%;
}

/* ─── 顶部筛选器 ─── */
.top-filters {
  padding: 10px 12px 8px;
  border-bottom: 1px solid #e2e8f0;
  background: #fafbfc;
  flex-shrink: 0;
}

.filter-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}

.filter-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.filter-label {
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
  letter-spacing: 0.03em;
  line-height: 1;
}

.filter-select,
.filter-input {
  height: 30px;
  border: 1px solid #d1d5db;
  border-radius: 5px;
  background: #fff;
  font-size: 12px;
  color: #334155;
  padding: 0 6px;
  cursor: pointer;
  transition: border-color 0.15s;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.filter-input {
  font-family: inherit;
}

.filter-select:focus,
.filter-input:focus {
  outline: none;
  border-color: #0ea5e9;
  box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.12);
}

.filter-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px solid #f1f5f9;
}

.summary-text {
  font-size: 12px;
  color: #64748b;
}

.summary-text strong {
  color: #0ea5e9;
  font-weight: 700;
}

.summary-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.clear-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: none;
  color: #ef4444;
  font-size: 11px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.15s;
}

.clear-btn:hover {
  background: rgba(239, 68, 68, 0.08);
}

.reset-focus-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: rgba(14, 165, 233, 0.08);
  color: #0ea5e9;
  font-size: 11px;
  cursor: pointer;
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 600;
  transition: background 0.15s;
}

.reset-focus-btn:hover {
  background: rgba(14, 165, 233, 0.15);
}

/* ─── 只看提示条 ─── */
.focus-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  padding: 5px 8px;
  background: rgba(14, 165, 233, 0.06);
  border: 1px solid rgba(14, 165, 233, 0.2);
  border-radius: 5px;
  font-size: 12px;
  color: #0369a1;
}

.focus-indicator > i {
  font-size: 11px;
  color: #0ea5e9;
  flex-shrink: 0;
}

.focus-indicator strong {
  color: #0c4a6e;
}

.focus-close {
  margin-left: auto;
  border: none;
  background: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0 2px;
  font-size: 11px;
  line-height: 1;
  transition: color 0.15s;
}

.focus-close:hover {
  color: #ef4444;
}

/* ─── 树形结果区 ─── */
.tree-area {
  flex: 1;
  overflow-y: auto;
  padding: 6px 0;
}

.tree-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 16px;
  color: #94a3b8;
  font-size: 13px;
}

.tree-empty i {
  font-size: 24px;
  opacity: 0.5;
}
</style>
