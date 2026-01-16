<template>
  <Transition name="popup">
    <div v-if="device" class="detail-popup" :class="{ show: device }">
      <div class="panel">
        <!-- 关闭按钮 -->
        <button class="close-btn" @click="handleClose">
          <i class="fas fa-times"></i>
        </button>
        
        <!-- 设备信息头部 -->
        <div class="detail-header">
          <div class="device-icon" :style="{ borderColor: deviceColor }">
            <i :class="'fa-solid ' + deviceIcon"></i>
          </div>
          <div class="device-info">
            <div class="device-name">{{ device.name }}</div>
            <div class="device-meta">
              <span class="device-type-badge" :style="{ background: deviceColor }">
                {{ device.typeName }}
              </span>
              <span class="device-id">{{ device.id }}</span>
            </div>
          </div>
          <div class="device-status" :class="device.status">
            <span class="status-dot"></span>
            {{ getStatusText(device.status) }}
          </div>
        </div>
        
        <!-- 设备详细信息 -->
        <div class="detail-info">
          <div class="info-item">
            <i class="fa-solid fa-location-dot"></i>
            <span>{{ device.lat.toFixed(4) }}, {{ device.lng.toFixed(4) }}</span>
          </div>
          <div class="info-item">
            <i class="fa-solid fa-clock"></i>
            <span>最后更新: {{ formatTime(device.lastUpdate) }}</span>
          </div>
          <div class="info-item current-value" :class="device.status">
            <i class="fa-solid fa-gauge-high"></i>
            <span>当前值: <strong>{{ device.val }}</strong></span>
          </div>
        </div>
        
        <!-- 数据类型切换 -->
        <div class="data-tabs">
          <button 
            :class="{ active: dataMode === 'realtime' }"
            @click="dataMode = 'realtime'"
          >
            <i class="fa-solid fa-bolt"></i>
            实时数据
          </button>
          <button 
            :class="{ active: dataMode === 'history' }"
            @click="dataMode = 'history'"
          >
            <i class="fa-solid fa-clock-rotate-left"></i>
            历史数据
          </button>
        </div>
        
        <!-- 时间范围选择器（仅历史模式） -->
        <TimeRangeSelector 
          v-if="dataMode === 'history'"
          v-model="timeRange"
          @change="handleTimeRangeChange"
        />
        
        <!-- 观测要素选择 -->
        <div class="element-selector" v-if="deviceElements.length > 1">
          <span class="selector-label">观测要素：</span>
          <div class="element-buttons">
            <button 
              v-for="el in deviceElements" 
              :key="el.key"
              :class="{ active: selectedElement === el.key }"
              @click="selectedElement = el.key"
            >
              {{ el.name }}
            </button>
          </div>
        </div>
        
        <!-- 阈值图例（如果有） -->
        <div class="threshold-legend" v-if="hasThresholds">
          <span class="legend-title">预警阈值：</span>
          <div class="legend-items">
            <span 
              v-for="(value, level) in currentThresholds" 
              :key="level"
              class="legend-item"
              :style="{ color: getLevelColor(level) }"
            >
              <span class="legend-dot" :style="{ background: getLevelColor(level) }"></span>
              {{ getLevelText(level) }}: {{ value }}{{ selectedElementConfig?.unit }}
            </span>
          </div>
        </div>
        
        <!-- 数据图表 -->
        <div class="chart-area">
          <DeviceChart 
            :device-type="device.type"
            :element-key="selectedElement"
            :data="chartData"
            :show-thresholds="true"
          />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAppStore } from '../../stores/app'
import { deviceTypeConfig, ALERT_LEVEL_COLORS } from '../../data/deviceConfig'
import { generateHistoryData } from '../../data/mockData'
import TimeRangeSelector from './TimeRangeSelector.vue'
import DeviceChart from './DeviceChart.vue'

const props = defineProps({
  device: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

const store = useAppStore()

// 状态
const dataMode = ref('realtime')
const selectedElement = ref('')
const timeRange = ref({
  start: new Date(Date.now() - 24 * 3600000),
  end: new Date(),
})
const chartData = ref([])

// 设备配置
const deviceConfig = computed(() => 
  props.device ? deviceTypeConfig[props.device.type] || {} : {}
)

const deviceElements = computed(() => 
  deviceConfig.value.elements || []
)

const deviceIcon = computed(() => 
  deviceConfig.value.icon || 'fa-circle'
)

const deviceColor = computed(() => 
  deviceConfig.value.color || '#00b4e6'
)

const selectedElementConfig = computed(() => 
  deviceElements.value.find(e => e.key === selectedElement.value)
)

const currentThresholds = computed(() => 
  deviceConfig.value.thresholds?.[selectedElement.value] || {}
)

const hasThresholds = computed(() => 
  Object.keys(currentThresholds.value).length > 0
)

// 方法
function handleClose() {
  emit('close')
}

function getStatusText(status) {
  const texts = {
    online: '在线',
    warn: '预警',
    alarm: '告警',
    offline: '离线',
  }
  return texts[status] || status
}

function formatTime(time) {
  if (!time) return '--'
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

function getLevelColor(level) {
  return ALERT_LEVEL_COLORS[level]?.color || '#666'
}

function getLevelText(level) {
  return ALERT_LEVEL_COLORS[level]?.name || level
}

function handleTimeRangeChange(range) {
  loadHistoryData()
}

function loadHistoryData() {
  if (!props.device || !selectedElement.value) return
  
  chartData.value = generateHistoryData(
    props.device.id,
    selectedElement.value,
    timeRange.value.start,
    timeRange.value.end
  )
}

function loadRealtimeData() {
  if (!props.device || !selectedElement.value) return
  
  // 生成最近2小时的实时数据
  const now = new Date()
  chartData.value = generateHistoryData(
    props.device.id,
    selectedElement.value,
    new Date(now.getTime() - 2 * 3600000),
    now
  )
}

// 监听设备变化
watch(() => props.device, (newDevice) => {
  if (newDevice) {
    // 设置默认选中的观测要素
    const elements = deviceTypeConfig[newDevice.type]?.elements || []
    selectedElement.value = elements[0]?.key || ''
    
    // 加载数据
    dataMode.value = 'realtime'
    loadRealtimeData()
  }
}, { immediate: true })

// 监听数据模式变化
watch(dataMode, (mode) => {
  if (mode === 'realtime') {
    loadRealtimeData()
  } else {
    loadHistoryData()
  }
})

// 监听观测要素变化
watch(selectedElement, () => {
  if (dataMode.value === 'realtime') {
    loadRealtimeData()
  } else {
    loadHistoryData()
  }
})
</script>

<style scoped>
.detail-popup {
  position: absolute;
  bottom: 70px;
  left: 50%;
  transform: translateX(-50%);
  width: 720px;
  max-width: calc(100vw - 360px);
  z-index: 1500;
  pointer-events: auto;
}

.panel {
  background: var(--bg-panel);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-normal);
  border-radius: var(--border-radius);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  box-shadow: var(--shadow-panel);
}

/* 顶部光条 */
.panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 15%;
  right: 15%;
  height: 1px;
  background: linear-gradient(90deg,
    transparent,
    var(--accent-cyan) 30%,
    var(--accent-cyan) 70%,
    transparent);
  opacity: 0.8;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 16px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 10;
}

.close-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.1);
}

/* 设备头部 */
.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.device-icon {
  width: 48px;
  height: 48px;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: var(--text-primary);
}

.device-info {
  flex: 1;
}

.device-name {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.device-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.device-type-badge {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  color: #fff;
  font-weight: 600;
}

.device-id {
  font-size: 11px;
  color: var(--text-muted);
}

.device-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.device-status.online {
  background: rgba(16, 185, 129, 0.15);
  color: #10B981;
}

.device-status.warn {
  background: rgba(245, 158, 11, 0.15);
  color: #F59E0B;
}

.device-status.alarm {
  background: rgba(239, 68, 68, 0.15);
  color: #EF4444;
}

.device-status.offline {
  background: rgba(107, 114, 128, 0.15);
  color: #6B7280;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.device-status.warn .status-dot,
.device-status.alarm .status-dot {
  animation: pulse-dot 1.5s infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
}

/* 详细信息 */
.detail-info {
  display: flex;
  gap: 20px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-subtle);
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-secondary);
}

.info-item i {
  color: var(--text-muted);
  width: 14px;
}

.info-item.current-value strong {
  font-size: 14px;
  font-family: var(--font-display);
}

.info-item.current-value.warn strong { color: #F59E0B; }
.info-item.current-value.alarm strong { color: #EF4444; }

/* 数据切换标签 */
.data-tabs {
  display: flex;
  gap: 8px;
}

.data-tabs button {
  flex: 1;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
}

.data-tabs button:hover {
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
}

.data-tabs button.active {
  background: rgba(0, 180, 230, 0.15);
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
}

/* 观测要素选择 */
.element-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.selector-label {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
}

.element-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.element-buttons button {
  padding: 4px 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-subtle);
  border-radius: 15px;
  color: var(--text-secondary);
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.element-buttons button:hover {
  border-color: var(--accent-cyan);
}

.element-buttons button.active {
  background: var(--accent-cyan);
  border-color: var(--accent-cyan);
  color: var(--bg-deepest);
}

/* 阈值图例 */
.threshold-legend {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
}

.legend-title {
  font-size: 10px;
  color: var(--text-muted);
}

.legend-items {
  display: flex;
  gap: 15px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
}

.legend-dot {
  width: 10px;
  height: 3px;
  border-radius: 1px;
}

/* 图表区域 */
.chart-area {
  height: 180px;
}

/* 过渡动画 */
.popup-enter-active,
.popup-leave-active {
  transition: all 0.3s ease;
}

.popup-enter-from,
.popup-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>
