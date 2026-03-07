<template>
  <div class="device-explorer">
    <div class="search-bar">
      <i class="fa-solid fa-magnifying-glass"></i>
      <input
        v-model="searchKeyword"
        type="text"
        class="search-input"
        :placeholder="labels.searchPlaceholder"
      >
      <button
        v-if="searchKeyword || selectedCategory || selectedStatus !== null"
        class="reset-btn"
        @click="resetFilters"
        :title="labels.reset"
      >
        <i class="fa-solid fa-rotate-left"></i>
      </button>
    </div>

    <div class="category-grid">
      <button
        class="category-btn"
        :class="{ active: selectedCategory === '' }"
        @click="selectedCategory = ''"
      >
        <i class="fa-solid fa-border-all"></i>
        <span>{{ labels.all }}</span>
      </button>
      <button
        v-for="category in deviceCategories"
        :key="category.id"
        class="category-btn"
        :class="{ active: selectedCategory === category.id }"
        :style="{ '--cat-color': category.color }"
        @click="selectedCategory = category.id"
      >
        <i :class="`fa-solid ${category.icon}`" :style="{ color: category.color }"></i>
        <span>{{ category.shortName }}</span>
      </button>
    </div>

    <div class="status-filter-row">
      <button
        class="status-btn"
        :class="{ active: effectiveStatus === '' }"
        @click="selectedStatus = ''"
      >
        {{ labels.all }}
      </button>
      <button
        v-for="item in statusOptions"
        :key="item.value"
        class="status-btn"
        :class="[item.value, { active: effectiveStatus === item.value }]"
        @click="selectedStatus = item.value"
      >
        <span class="status-dot" :class="item.value"></span>
        {{ item.label }}
      </button>
    </div>

    <div class="device-list">
      <div
        v-for="device in filteredDevices"
        :key="device.id"
        class="device-item"
        :class="{ selected: selectedDevice?.id === device.id }"
        @click="handleDeviceClick(device)"
      >
          <div class="device-main">
            <div class="device-name-row">
              <div class="device-name">
                <span class="status-dot" :class="device.status"></span>
                <span class="device-name-text">{{ device.name }}</span>
              </div>
              <span class="device-type-chip">{{ device.typeName }}</span>
            </div>
            <div class="device-metric-line" :class="device.status">
              <span
                v-for="(segment, index) in getDeviceMetricSegments(device)"
                :key="`${device.id}-${index}`"
                class="metric-chip"
                :class="[getMetricChipTone(device, index, segment), { accent: index === 2 }]"
              >
                <span class="metric-label">{{ segment.label }}</span>
                <span class="metric-value">{{ segment.value }}</span>
              </span>
            </div>
          </div>
      </div>

      <div v-if="filteredDevices.length === 0" class="empty-state">
        <i class="fa-solid fa-inbox"></i>
        <span>{{ labels.empty }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { deviceTypeConfig, deviceTypeTree } from '../../data/deviceConfig'
import { useAppStore } from '../../stores/app'
import { formatDeviceMetricLine } from '../../utils/homeMonitoring'

const emit = defineEmits(['device-click'])

const labels = {
  all: '\u5168\u90e8',
  online: '\u5728\u7ebf',
  warn: '\u9884\u8b66',
  alarm: '\u544a\u8b66',
  offline: '\u79bb\u7ebf',
  empty: '\u6682\u65e0\u5339\u914d\u8bbe\u5907',
  reset: '\u91cd\u7f6e\u7b5b\u9009',
  searchPlaceholder: '\u641c\u7d22\u8bbe\u5907\u540d\u79f0\u6216 ID...',
}

const statusOptions = [
  { value: 'online', label: labels.online },
  { value: 'warn', label: labels.warn },
  { value: 'alarm', label: labels.alarm },
  { value: 'offline', label: labels.offline },
]
const thresholdLevelLabels = {
  blue: '蓝色',
  yellow: '黄色',
  orange: '橙色',
  red: '红色',
}

const store = useAppStore()
const searchKeyword = ref('')
const selectedCategory = ref('')
const selectedStatus = ref(null)
const selectedDevice = ref(null)

const defaultStatus = computed(() => {
  const devices = store.devices
  if (devices.some(d => d.status === 'alarm')) return 'alarm'
  if (devices.some(d => d.status === 'warn')) return 'warn'
  if (devices.some(d => d.status === 'online')) return 'online'
  return ''
})

const effectiveStatus = computed(() => (
  selectedStatus.value === null ? defaultStatus.value : selectedStatus.value
))

const deviceCategories = computed(() => (
  deviceTypeTree.map((category) => {
    const total = Array.isArray(category.children) && category.children.length > 0
      ? category.children.reduce((sum, child) => sum + child.count, 0)
      : (category.count || 0)

    return {
      ...category,
      total,
      shortName: getShortName(category.name),
    }
  })
))

const filteredDevices = computed(() => {
  let result = store.devices

  if (selectedCategory.value) {
    const category = deviceTypeTree.find(c => c.id === selectedCategory.value)
    if (category?.children?.length) {
      const childTypes = category.children.map(item => item.id)
      result = result.filter(device => childTypes.includes(device.type) || device.type === selectedCategory.value)
    } else {
      result = result.filter(device => device.type === selectedCategory.value)
    }
  }

  if (effectiveStatus.value) {
    result = result.filter(device => device.status === effectiveStatus.value)
  }

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(device =>
      device.name.toLowerCase().includes(keyword) || device.id.toLowerCase().includes(keyword)
    )
  }

  return [...result]
    .sort((a, b) => {
      const priority = { alarm: 0, warn: 1, online: 2, offline: 3 }
      return (priority[a.status] ?? 4) - (priority[b.status] ?? 4)
    })
    .slice(0, 50)
})

function getShortName(name) {
  return String(name || '').replace(/\s+/g, '').slice(0, 4) || '--'
}

function resetFilters() {
  searchKeyword.value = ''
  selectedCategory.value = ''
  selectedStatus.value = null
}

function handleDeviceClick(device) {
  selectedDevice.value = device
  emit('device-click', device)
}

function getDeviceMetricLine(device) {
  return formatDeviceMetricLine(device)
}

function getDeviceMetricSegments(device) {
  const segments = getDeviceMetricLine(device)
    .split('|')
    .map(segment => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      const separatorIndex = segment.indexOf(' ')
      if (separatorIndex === -1) {
        return { label: segment, value: '' }
      }
      return {
        label: segment.slice(0, separatorIndex),
        value: segment.slice(separatorIndex + 1),
      }
    })

  if (segments[1]) {
    const thresholdMeta = getThresholdLevelMeta(device)
    if (thresholdMeta) {
      segments[1] = {
        ...segments[1],
        value: `${thresholdMeta.label} ${segments[1].value}`,
        thresholdLevel: thresholdMeta.level,
      }
    }
  }

  return segments
}

function getThresholdLevelMeta(device) {
  const config = deviceTypeConfig[device?.type]
  const thresholdValue = Number(device?.thresholdValue)
  if (!config || !config.thresholds || !Number.isFinite(thresholdValue)) return null

  const [firstThresholdKey] = Object.keys(config.thresholds)
  const thresholds = config.thresholds[firstThresholdKey]
  if (!thresholds) return null

  const exactMatch = Object.entries(thresholds).find(([, value]) => Number(value) === thresholdValue)
  if (exactMatch) {
    const [level] = exactMatch
    return { level, label: thresholdLevelLabels[level] || level }
  }

  const closest = Object.entries(thresholds)
    .map(([level, value]) => ({ level, value: Number(value), delta: Math.abs(Number(value) - thresholdValue) }))
    .filter(item => Number.isFinite(item.value))
    .sort((a, b) => a.delta - b.delta)[0]

  if (!closest) return null
  return { level: closest.level, label: thresholdLevelLabels[closest.level] || closest.level }
}

function getMetricChipTone(device, index, segment) {
  if (index === 0) return 'observed'
  if (index === 1) return segment?.thresholdLevel ? `threshold-${segment.thresholdLevel}` : 'threshold'
  if (device?.status === 'alarm') return 'alarm'
  if (device?.status === 'warn') return 'warn'
  return 'normal'
}
</script>

<style scoped>
.device-explorer {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  margin-bottom: 10px;
}

.search-bar i {
  color: var(--text-tertiary);
  font-size: 13px;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 13px;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.reset-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid var(--border-subtle);
  background: rgba(255, 255, 255, 0.72);
  color: var(--accent-cyan);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  transition: all 0.2s;
}

.reset-btn:hover {
  border-color: rgba(13, 116, 144, 0.22);
  background: rgba(13, 116, 144, 0.08);
  color: var(--accent-blue);
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-bottom: 10px;
}

.category-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 8px 4px;
  border-radius: 10px;
  border: 1px solid var(--border-subtle);
  background: rgba(255, 255, 255, 0.62);
  color: var(--text-secondary);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.category-btn i {
  font-size: 16px;
  transition: all 0.2s;
}

.category-btn:first-child i {
  color: var(--accent-cyan);
}

.category-btn:hover {
  border-color: var(--cat-color, var(--accent-cyan));
  background: rgba(255, 255, 255, 0.82);
}

.category-btn.active {
  border-color: var(--cat-color, var(--accent-cyan));
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--cat-color, var(--accent-cyan)) 20%, transparent),
    color-mix(in srgb, var(--cat-color, var(--accent-cyan)) 5%, transparent)
  );
}

.category-btn.active i {
  transform: scale(1.1);
}

.category-btn span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.status-filter-row {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}

.status-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 5px 0;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  background: rgba(255, 255, 255, 0.6);
  color: var(--text-tertiary);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.status-btn:hover {
  border-color: var(--accent-cyan);
}

.status-btn.active {
  border-color: var(--accent-cyan);
  background: rgba(13, 116, 144, 0.1);
  color: var(--text-primary);
}

.status-btn.online.active {
  border-color: var(--status-online);
  background: rgba(16, 185, 129, 0.15);
}

.status-btn.warn.active {
  border-color: var(--status-warn);
  background: rgba(245, 158, 11, 0.15);
}

.status-btn.alarm.active {
  border-color: var(--alert-red);
  background: rgba(239, 68, 68, 0.15);
}

.status-btn.offline.active {
  border-color: var(--status-offline);
  background: rgba(107, 114, 128, 0.15);
}

.device-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  padding-right: 2px;
  transform: translateZ(0);
  will-change: scroll-position;
  -webkit-overflow-scrolling: touch;
  contain: layout style paint;
}

.device-list::-webkit-scrollbar {
  width: 4px;
}

.device-list::-webkit-scrollbar-thumb {
  background: var(--accent-cyan);
  border-radius: 2px;
}

.device-item {
  display: flex;
  align-items: flex-start;
  padding: 10px 10px 10px 12px;
  margin-bottom: 6px;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.58);
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.device-item:hover {
  background: rgba(255, 255, 255, 0.88);
  border-color: rgba(13, 116, 144, 0.24);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
}

.device-item.selected {
  background: rgba(13, 116, 144, 0.1);
  border-color: rgba(13, 116, 144, 0.28);
  box-shadow: 0 0 0 1px rgba(13, 116, 144, 0.08), 0 8px 18px rgba(13, 116, 144, 0.08);
}

.device-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.device-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.device-name {
  display: flex;
  align-items: center;
  min-width: 0;
  color: #0f172a;
  font-size: 13px;
}

.device-name-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.device-type-chip {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  color: #334155;
  background: rgba(15, 23, 42, 0.07);
}

.device-metric-line {
  margin-top: 7px;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 2px;
  scrollbar-width: none;
}

.device-metric-line::-webkit-scrollbar {
  display: none;
}

.metric-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex: 0 0 auto;
  min-width: 0;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(15, 23, 42, 0.04);
  color: var(--text-secondary);
  line-height: 1;
}

.metric-chip.observed {
  border-color: rgba(15, 23, 42, 0.08);
  background: rgba(15, 23, 42, 0.04);
}

.metric-chip.threshold {
  border-color: rgba(37, 99, 235, 0.16);
  background: rgba(37, 99, 235, 0.08);
}

.metric-chip.threshold-blue {
  border-color: rgba(37, 99, 235, 0.18);
  background: rgba(37, 99, 235, 0.08);
}

.metric-chip.threshold-yellow {
  border-color: rgba(202, 138, 4, 0.18);
  background: rgba(250, 204, 21, 0.12);
}

.metric-chip.threshold-orange {
  border-color: rgba(234, 88, 12, 0.18);
  background: rgba(249, 115, 22, 0.1);
}

.metric-chip.threshold-red {
  border-color: rgba(220, 38, 38, 0.18);
  background: rgba(239, 68, 68, 0.1);
}

.metric-chip.normal {
  border-color: rgba(71, 85, 105, 0.14);
  background: rgba(71, 85, 105, 0.08);
}

.metric-chip.warn {
  border-color: rgba(245, 158, 11, 0.18);
  background: rgba(245, 158, 11, 0.08);
}

.metric-chip.alarm {
  border-color: rgba(239, 68, 68, 0.18);
  background: rgba(239, 68, 68, 0.08);
}

.metric-chip.accent.warn {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.16), rgba(245, 158, 11, 0.08));
}

.metric-chip.accent.alarm {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.16), rgba(239, 68, 68, 0.08));
}

.metric-label {
  font-size: 10px;
  color: #475569;
}

.metric-chip.threshold .metric-label {
  color: #1d4ed8;
}

.metric-chip.threshold-blue .metric-label {
  color: #1d4ed8;
}

.metric-chip.threshold-yellow .metric-label {
  color: #a16207;
}

.metric-chip.threshold-orange .metric-label {
  color: #c2410c;
}

.metric-chip.threshold-red .metric-label {
  color: #b91c1c;
}

.metric-value {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-primary);
}

.metric-chip.observed .metric-value {
  color: #0f172a;
}

.metric-chip.threshold .metric-value {
  color: #1d4ed8;
}

.metric-chip.threshold-blue .metric-value {
  color: #1d4ed8;
}

.metric-chip.threshold-yellow .metric-value {
  color: #a16207;
}

.metric-chip.threshold-orange .metric-value {
  color: #c2410c;
}

.metric-chip.threshold-red .metric-value {
  color: #b91c1c;
}

.metric-chip.normal .metric-value {
  color: #475569;
}

.metric-chip.warn .metric-value {
  color: #b45309;
}

.metric-chip.alarm .metric-value {
  color: #b91c1c;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 6px;
  flex-shrink: 0;
}

.status-dot.online {
  background: var(--status-online);
  box-shadow: 0 0 4px var(--status-online);
}

.status-dot.warn {
  background: var(--status-warn);
  box-shadow: 0 0 4px var(--status-warn);
  animation: pulse-ring-yellow 1.5s ease-out infinite;
}

.status-dot.alarm {
  background: var(--alert-red);
  box-shadow: 0 0 4px var(--alert-red);
  animation: pulse-ring-red 1.2s ease-out infinite;
}

.status-dot.offline {
  background: var(--status-offline);
}

@keyframes pulse-ring-yellow {
  0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
  70% { box-shadow: 0 0 0 6px rgba(245, 158, 11, 0); }
  100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
}

@keyframes pulse-ring-red {
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
  color: var(--text-muted);
  font-size: 12px;
  gap: 8px;
}

.empty-state i {
  font-size: 24px;
  opacity: 0.5;
}
</style>
