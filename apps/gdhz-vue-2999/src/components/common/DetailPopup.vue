<template>
  <Transition name="popup">
    <div v-if="device" class="detail-popup" :class="{ show: device }">
      <div class="panel">
        <button class="close-btn" type="button" @click="handleClose">
          <i class="fas fa-times"></i>
        </button>

        <div class="panel-grid">
          <section class="col col-left">
            <div class="device-header">
              <div class="device-icon" :style="{ borderColor: deviceColor }">
                <i :class="'fa-solid ' + deviceIcon"></i>
              </div>
              <div class="device-name">{{ device.name }}</div>
            </div>

            <div class="info-card">
              <div class="info-row">
                <span class="info-label">状态</span>
                <span class="device-status-text" :class="device.status">
                  <span class="status-dot"></span>
                  {{ getStatusText(device.status) }}
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">类型</span>
                <span class="info-text">{{ device.typeName }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">编号</span>
                <span class="info-text">{{ device.id }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">坐标</span>
                <span class="info-text">{{ device.lat.toFixed(4) }}, {{ device.lng.toFixed(4) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">更新</span>
                <span class="info-text">{{ formatTime(device.lastUpdate) }}</span>
              </div>
            </div>
          </section>

          <section class="col col-center">
            <div class="center-toolbar">
              <div class="element-tabs" v-if="deviceElements.length > 1">
                <button
                  v-for="el in deviceElements"
                  :key="el.key"
                  :class="{ active: selectedElement === el.key }"
                  @click="selectedElement = el.key"
                >
                  {{ el.name }}
                </button>
              </div>

              <!-- 时间范围选择器 -->
              <TimeRangeSelector
                v-model="timeRange"
                @change="handleTimeRangeChange"
              />
            </div>

            <!-- 图表区域（内含阈值图例） -->
            <div class="chart-wrapper">
              <div class="chart-legend-bar" v-if="hasThresholds">
                <span
                  v-for="item in sortedThresholdEntries"
                  :key="item.level"
                  class="threshold-chip"
                  :style="{ '--tc': getLevelColor(item.level) }"
                >
                  <span class="tc-dot"></span>
                  {{ getLevelShortText(item.level) }} {{ item.value }}{{ selectedElementConfig?.unit || '' }}
                </span>
              </div>
              <div class="chart-area">
                <DeviceChart
                  :device-type="device.type"
                  :element-key="selectedElement"
                  :data="chartData"
                  :show-thresholds="true"
                />
              </div>
            </div>
          </section>

          <section class="col col-right">
            <div class="device-header">
              <div class="device-name">实时观测</div>
            </div>
            <div class="info-card">
              <div
                v-for="card in readingCards"
                :key="card.key"
                class="info-row"
                :class="{ active: selectedElement === card.key }"
              >
                <span class="info-label">{{ card.name }}</span>
                <span class="info-text">{{ card.value }} {{ card.unit }}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { deviceTypeConfig, ALERT_LEVEL_COLORS } from '../../data/deviceConfig'
import { generateHistoryData } from '../../data/mockData'
import DeviceChart from './DeviceChart.vue'
import TimeRangeSelector from './TimeRangeSelector.vue'

const props = defineProps({
  device: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const selectedElement = ref('')
const timeRange = ref({
  start: new Date(Date.now() - 2 * 3600000),
  end: new Date(),
})
const chartData = ref([])

const thresholdOrder = ['blue', 'yellow', 'orange', 'red']

const deviceConfig = computed(() => (props.device ? deviceTypeConfig[props.device.type] || {} : {}))
const deviceElements = computed(() => deviceConfig.value.elements || [])
const deviceIcon = computed(() => deviceConfig.value.icon || 'fa-circle')
const deviceColor = computed(() => deviceConfig.value.color || '#0ea5e9')
const selectedElementConfig = computed(() => deviceElements.value.find((e) => e.key === selectedElement.value))
const currentThresholds = computed(() => deviceConfig.value.thresholds?.[selectedElement.value] || {})
const hasThresholds = computed(() => Object.keys(currentThresholds.value).length > 0)
const sortedThresholdEntries = computed(() =>
  thresholdOrder
    .filter((level) => currentThresholds.value[level] !== undefined)
    .map((level) => ({ level, value: currentThresholds.value[level] })),
)

const elementReadingMap = ref({})

const readingCards = computed(() =>
  deviceElements.value.map((element) => {
    const reading = elementReadingMap.value[element.key]
    return {
      key: element.key,
      name: element.name,
      value: reading?.value ?? '--',
      unit: element.unit || '',
    }
  }),
)

function handleClose() {
  emit('close')
}

function getStatusText(status) {
  return { online: '在线', warn: '预警', alarm: '告警', offline: '离线' }[status] || status
}

function formatTime(time) {
  if (!time) return '--'
  const date = new Date(time)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleString('zh-CN', { hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function getLevelColor(level) {
  return ALERT_LEVEL_COLORS[level]?.color || '#64748b'
}

function getLevelShortText(level) {
  return { blue: '蓝色', yellow: '黄色', orange: '橙色', red: '红色' }[level] || getLevelText(level)
}

function getLevelText(level) {
  return ALERT_LEVEL_COLORS[level]?.name || level
}

function handleTimeRangeChange() {
  loadData()
}

function buildRealtimeReadings() {
  if (!props.device || !deviceElements.value.length) {
    elementReadingMap.value = {}
    return
  }

  const now = new Date()
  const nextMap = {}

  deviceElements.value.forEach((element, index) => {
    if (index === 0 && props.device?.val) {
      const match = String(props.device.val).match(/-?\d+(\.\d+)?/)
      nextMap[element.key] = {
        value: match ? match[0] : String(props.device.val),
      }
      return
    }

    const series = generateHistoryData(
      props.device.id,
      element.key,
      new Date(now.getTime() - 2 * 3600000),
      now,
    )
    const lastPoint = series.at(-1)
    nextMap[element.key] = {
      value: lastPoint ? Number(lastPoint.value).toFixed(2) : '--',
    }
  })

  elementReadingMap.value = nextMap
}

function loadData() {
  if (!props.device || !selectedElement.value) return
  chartData.value = generateHistoryData(
    props.device.id,
    selectedElement.value,
    timeRange.value.start,
    timeRange.value.end,
  )
}

watch(
  () => props.device,
  (device) => {
    if (!device) return
    const elements = deviceTypeConfig[device.type]?.elements || []
    selectedElement.value = elements[0]?.key || ''
    timeRange.value = {
      start: new Date(Date.now() - 2 * 3600000),
      end: new Date(),
    }
    buildRealtimeReadings()
    loadData()
  },
  { immediate: true },
)

watch(selectedElement, () => {
  loadData()
})
</script>

<style scoped>
.detail-popup {
  position: fixed;
  bottom: 26px;
  left: var(--toolbar-safe-left, 460px);
  right: var(--tool-rail-safe-right, 460px);
  z-index: 1500;
  pointer-events: auto;
}

.panel {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.93), rgba(246, 248, 252, 0.9));
  backdrop-filter: blur(22px) saturate(1.08);
  -webkit-backdrop-filter: blur(22px) saturate(1.08);
  box-shadow: 0 18px 46px rgba(15, 23, 42, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 18%;
  right: 18%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(14, 165, 233, 0.55), transparent);
  z-index: 1;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 28px;
  height: 28px;
  border-radius: 9px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.72);
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.18s ease;
}

.close-btn:hover {
  background: rgba(254, 242, 242, 0.92);
  color: #dc2626;
  border-color: rgba(239, 68, 68, 0.18);
}

.panel-grid {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr) 170px;
  height: 340px;
}

.col {
  min-width: 0;
  padding: 12px 14px;
}

.col-left,
.col-right {
  background: linear-gradient(180deg, rgba(248, 250, 253, 0.9), rgba(242, 245, 249, 0.82));
}

.col-left {
  border-right: 1px solid rgba(148, 163, 184, 0.16);
}

.col-center {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(248, 250, 252, 0.9));
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: hidden;
}

.col-right {
  border-left: 1px solid rgba(148, 163, 184, 0.16);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.col-right .device-header {
  justify-content: center;
}

.side-section-title {
  color: #334155;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.device-header {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 38px;
}

.device-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 2px solid;
  background: rgba(255, 255, 255, 0.82);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0f172a;
  font-size: 14px;
  flex-shrink: 0;
}

.device-name {
  color: #0f172a;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
}

.device-type-badge {
  display: inline-flex;
  align-items: center;
  min-height: 20px;
  padding: 0 7px;
  border-radius: 999px;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  margin-top: 3px;
}

.info-card {
  display: grid;
  gap: 8px;
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.info-row {
  display: grid;
  gap: 4px;
}

.info-label {
  color: #64748b;
  font-size: 11px;
}

.info-text,
.device-status-text {
  color: #0f172a;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
}

.device-status-text {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.device-status-text.online { color: #15803d; }
.device-status-text.warn { color: #b45309; }
.device-status-text.alarm { color: #b91c1c; }
.device-status-text.offline { color: #64748b; }

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: currentColor;
}

.col-center {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.col-center .center-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.element-tabs {
  display: inline-flex;
  gap: 4px;
  padding: 3px;
  border-radius: 12px;
  background: rgba(226, 232, 240, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.element-tabs button {
  min-height: 28px;
  padding: 0 14px;
  border-radius: 10px;
  background: transparent;
  border: 1px solid transparent;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;
}

.element-tabs button:hover {
  color: #0f172a;
  background: rgba(255, 255, 255, 0.6);
}

.element-tabs button.active {
  background: #0284c7;
  color: #fff;
  box-shadow: 0 2px 8px rgba(2, 132, 199, 0.25);
}

.chart-wrapper {
  flex: 1;
  min-height: 0;
  position: relative;
  border-radius: 10px;
  background: rgba(248, 250, 252, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.12);
  overflow: hidden;
}

.chart-legend-bar {
  position: absolute;
  top: 4px;
  right: 8px;
  z-index: 5;
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.chart-area {
  width: 100%;
  height: 100%;
}

/* Threshold chips */

.threshold-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--tc) 10%, white);
  color: color-mix(in srgb, var(--tc) 80%, #334155);
  font-size: 10px;
  font-weight: 700;
}

.tc-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--tc);
}

.obs-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.obs-item {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.12);
  transition: background 0.18s;
}

.obs-item.active {
  background: rgba(240, 249, 255, 0.95);
  border-color: rgba(14, 165, 233, 0.22);
}

.obs-label {
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
}

.obs-value {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  margin-left: auto;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.03em;
}

.obs-unit {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
}

.popup-enter-active,
.popup-leave-active {
  transition: all 0.28s ease;
}

.popup-enter-from,
.popup-leave-to {
  opacity: 0;
  transform: translateY(16px);
}
</style>
