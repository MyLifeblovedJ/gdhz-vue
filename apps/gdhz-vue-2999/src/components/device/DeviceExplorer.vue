<template>
  <div class="device-explorer">
    <!-- 图标网格（多选） -->
    <div class="category-grid">
      <div
        v-for="category in treeData"
        :key="category.id"
        class="category-cell"
        :class="{ active: isCategoryActive(category), partial: isCategoryPartial(category) }"
        :style="{ '--cat-color': category.color }"
      >
        <button
          class="category-btn"
          @click="handleCategoryClick(category, $event)"
        >
          <i :class="`fa-solid ${category.icon}`" :style="{ color: category.color }"></i>
          <span class="cat-name">{{ getShortName(category.name) }}</span>
        </button>
        <!-- 子菜单指示器 -->
        <span v-if="category.children.length > 0" class="sub-indicator" @click.stop="openSubmenu(category, $event)">
          <i class="fa-solid fa-caret-down"></i>
        </span>
      </div>
    </div>

    <!-- 子菜单浮层 -->
    <Teleport to="body">
      <div
        v-if="submenu.visible"
        class="submenu-backdrop"
        @click="closeSubmenu"
      ></div>
      <div
        v-if="submenu.visible"
        class="submenu-popover"
        :style="submenuStyle"
      >
        <div class="submenu-header">
          <i :class="`fa-solid ${submenu.category.icon}`" :style="{ color: submenu.category.color }"></i>
          <span>{{ submenu.category.name }}</span>
          <label class="submenu-toggle-all" @click.stop>
            <input
              type="checkbox"
              :checked="isParentChecked(submenu.category)"
              :indeterminate="isParentIndeterminate(submenu.category)"
              @change="toggleParent(submenu.category, $event.target.checked)"
            >
            全选
          </label>
        </div>
        <div class="submenu-items">
          <label
            v-for="child in submenu.category.children"
            :key="child.id"
            class="submenu-item"
            :class="{ checked: isChildChecked(child) }"
          >
            <input
              type="checkbox"
              :checked="isChildChecked(child)"
              @change="toggleChild(child, $event.target.checked)"
            >
            <i :class="`fa-solid ${child.icon}`" class="sub-icon" :style="{ color: child.color }"></i>
            <span class="sub-name">{{ child.name }}</span>
            <span class="sub-count">{{ child.count }}</span>
          </label>
        </div>
      </div>
    </Teleport>

    <!-- 状态筛选 -->
    <div class="status-filter-row">
      <button
        class="status-btn"
        :class="{ active: selectedStatus === '' }"
        @click="selectedStatus = ''"
      >全部</button>
      <button
        v-for="item in statusOptions"
        :key="item.value"
        class="status-btn"
        :class="[item.value, { active: selectedStatus === item.value }]"
        @click="selectedStatus = item.value"
      >
        <span class="status-dot" :class="item.value"></span>
        {{ item.label }}
      </button>
    </div>

    <!-- 设备列表 -->
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
        <span>暂无匹配设备</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, reactive, nextTick } from 'vue'
import { deviceTypeConfig, deviceTypeTree } from '../../data/deviceConfig'
import { useAppStore } from '../../stores/app'
import { formatDeviceMetricLine } from '../../utils/homeMonitoring'

const emit = defineEmits(['device-click'])

const store = useAppStore()
const selectedStatus = ref('')
const selectedDevice = ref(null)

// deviceTypeTree ID → layerVisibility key
const typeToLayerKey = {
  coastal_station: 'coastal_stations',
  surge_station: 'surge_stations',
  coastal_base: 'coastal_base',
  tide_station: 'tide_stations',
  buoy: 'buoys',
  wave_buoy: 'wave_buoy',
  disposable_buoy: 'disposable_buoy',
  argo_buoy: 'argo_buoy',
  erosion_monitor: 'erosion_monitor',
  smart_marker: 'smart_marker',
  uav: 'uav',
  usv: 'usv',
}

function getLayerKey(typeId) {
  return typeToLayerKey[typeId] || typeId
}

// 树数据
const treeData = computed(() =>
  deviceTypeTree.map((category) => {
    const total = category.children?.length > 0
      ? category.children.reduce((sum, child) => sum + child.count, 0)
      : (category.count || 0)
    return { ...category, children: category.children || [], total }
  })
)

// checkbox 逻辑
function isChildChecked(child) {
  return !!store.layerVisibility[getLayerKey(child.id)]
}

function isParentChecked(category) {
  if (category.children.length === 0) {
    return !!store.layerVisibility[getLayerKey(category.id)]
  }
  return category.children.every(child => isChildChecked(child))
}

function isParentIndeterminate(category) {
  if (category.children.length === 0) return false
  const checkedCount = category.children.filter(child => isChildChecked(child)).length
  return checkedCount > 0 && checkedCount < category.children.length
}

function isCategoryActive(category) {
  return isParentChecked(category)
}

function isCategoryPartial(category) {
  return isParentIndeterminate(category)
}

function toggleParent(category, checked) {
  store.setLayerVisibility(getLayerKey(category.id), checked)
  for (const child of category.children) {
    store.setLayerVisibility(getLayerKey(child.id), checked)
  }
}

function toggleChild(child, checked) {
  store.setLayerVisibility(getLayerKey(child.id), checked)
  const parent = treeData.value.find(cat => cat.children.some(c => c.id === child.id))
  if (parent) {
    const allChecked = parent.children.every(c => {
      if (c.id === child.id) return checked
      return isChildChecked(c)
    })
    store.setLayerVisibility(getLayerKey(parent.id), allChecked)
  }
}

function handleCategoryClick(category, event) {
  if (category.children.length === 0) {
    // 无子分类，直接切换
    const currentState = isParentChecked(category)
    toggleParent(category, !currentState)
  } else {
    // 有子分类，打开子菜单
    openSubmenu(category, event)
  }
}

// 子菜单浮层
const submenu = reactive({
  visible: false,
  category: null,
  x: 0,
  y: 0,
})

const submenuStyle = computed(() => ({
  position: 'fixed',
  left: `${submenu.x}px`,
  top: `${submenu.y}px`,
  zIndex: 99999,
}))

function openSubmenu(category, event) {
  const rect = event.currentTarget.getBoundingClientRect()
  // 弹出在按钮下方
  submenu.x = Math.max(8, rect.left - 40)
  submenu.y = rect.bottom + 6
  submenu.category = category
  submenu.visible = true

  // 确保不超出屏幕
  nextTick(() => {
    const popover = document.querySelector('.submenu-popover')
    if (popover) {
      const popoverRect = popover.getBoundingClientRect()
      if (popoverRect.right > window.innerWidth - 8) {
        submenu.x = window.innerWidth - popoverRect.width - 8
      }
      if (popoverRect.bottom > window.innerHeight - 8) {
        submenu.y = rect.top - popoverRect.height - 6
      }
    }
  })
}

function closeSubmenu() {
  submenu.visible = false
}

function getShortName(name) {
  return String(name || '').replace(/\s+/g, '').slice(0, 4) || '--'
}

// 获取所有已选中的设备类型 ID
const selectedTypeIds = computed(() => {
  const ids = new Set()
  for (const category of treeData.value) {
    if (category.children.length === 0) {
      if (store.layerVisibility[getLayerKey(category.id)]) ids.add(category.id)
    } else {
      for (const child of category.children) {
        if (store.layerVisibility[getLayerKey(child.id)]) ids.add(child.id)
      }
    }
  }
  return ids
})

const statusOptions = [
  { value: 'online', label: '在线' },
  { value: 'warn', label: '预警' },
  { value: 'alarm', label: '告警' },
  { value: 'offline', label: '离线' },
]

const thresholdLevelLabels = { blue: '蓝色', yellow: '黄色', orange: '橙色', red: '红色' }

const filteredDevices = computed(() => {
  let result = store.devices.filter(device => selectedTypeIds.value.has(device.type))
  if (selectedStatus.value) result = result.filter(device => device.status === selectedStatus.value)
  return [...result]
    .sort((a, b) => {
      const priority = { alarm: 0, warn: 1, online: 2, offline: 3 }
      return (priority[a.status] ?? 4) - (priority[b.status] ?? 4)
    })
    .slice(0, 50)
})

function handleDeviceClick(device) {
  selectedDevice.value = device
  emit('device-click', device)
}

function getDeviceMetricSegments(device) {
  const segments = formatDeviceMetricLine(device)
    .split('|').map(s => s.trim()).filter(Boolean)
    .map((seg) => {
      const i = seg.indexOf(' ')
      return i === -1 ? { label: seg, value: '' } : { label: seg.slice(0, i), value: seg.slice(i + 1) }
    })
  if (segments[1]) {
    const meta = getThresholdLevelMeta(device)
    if (meta) segments[1] = { ...segments[1], value: `${meta.label} ${segments[1].value}`, thresholdLevel: meta.level }
  }
  return segments
}

function getThresholdLevelMeta(device) {
  const config = deviceTypeConfig[device?.type]
  const tv = Number(device?.thresholdValue)
  if (!config?.thresholds || !Number.isFinite(tv)) return null
  const [fk] = Object.keys(config.thresholds)
  const ts = config.thresholds[fk]
  if (!ts) return null
  const exact = Object.entries(ts).find(([, v]) => Number(v) === tv)
  if (exact) return { level: exact[0], label: thresholdLevelLabels[exact[0]] || exact[0] }
  const closest = Object.entries(ts).map(([l, v]) => ({ level: l, value: Number(v), delta: Math.abs(Number(v) - tv) })).filter(i => Number.isFinite(i.value)).sort((a, b) => a.delta - b.delta)[0]
  return closest ? { level: closest.level, label: thresholdLevelLabels[closest.level] || closest.level } : null
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

/* ── 图标网格 ── */
.category-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.category-cell {
  position: relative;
  border-radius: 10px;
  border: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.18));
  background: rgba(255, 255, 255, 0.62);
  transition: all 0.2s;
}

.category-cell:hover {
  border-color: var(--cat-color, #0d9488);
  background: rgba(255, 255, 255, 0.82);
}

.category-cell.active {
  border-color: var(--cat-color, #0d9488);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--cat-color, #0d9488) 20%, transparent),
    color-mix(in srgb, var(--cat-color, #0d9488) 5%, transparent)
  );
}

.category-cell.partial {
  border-color: var(--cat-color, #0d9488);
  border-style: dashed;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--cat-color, #0d9488) 10%, transparent),
    color-mix(in srgb, var(--cat-color, #0d9488) 3%, transparent)
  );
}

.category-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 8px 4px;
  width: 100%;
  border: none;
  background: transparent;
  color: var(--text-secondary, #475569);
  font-size: 11px;
  cursor: pointer;
}

.category-btn i {
  font-size: 16px;
  transition: transform 0.2s;
}

.category-cell.active .category-btn i {
  transform: scale(1.1);
}

.cat-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  font-weight: 500;
}

/* 子菜单指示器 */
.sub-indicator {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;
}

.sub-indicator:hover {
  background: rgba(0, 0, 0, 0.06);
}

.sub-indicator i {
  font-size: 8px;
  color: var(--text-tertiary, #94a3b8);
}

/* ── 子菜单浮层 ── */
.submenu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 99998;
}

.submenu-popover {
  min-width: 200px;
  max-width: 260px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(16px);
  box-shadow: 0 8px 32px rgba(15, 23, 42, 0.12), 0 2px 8px rgba(15, 23, 42, 0.06);
  padding: 8px;
  animation: submenu-in 0.15s ease-out;
}

@keyframes submenu-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.submenu-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px 6px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary, #0f172a);
}

.submenu-header i {
  font-size: 13px;
}

.submenu-toggle-all {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-tertiary, #94a3b8);
  cursor: pointer;
}

.submenu-toggle-all input {
  width: 13px;
  height: 13px;
  accent-color: #0d9488;
}

.submenu-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.submenu-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 6px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  color: var(--text-secondary, #475569);
  transition: background 0.12s;
}

.submenu-item:hover {
  background: rgba(15, 23, 42, 0.04);
}

.submenu-item.checked {
  color: var(--text-primary, #0f172a);
  font-weight: 500;
}

.submenu-item input {
  width: 14px;
  height: 14px;
  accent-color: #0d9488;
  cursor: pointer;
  flex-shrink: 0;
}

.sub-icon {
  font-size: 11px;
  flex-shrink: 0;
}

.sub-name {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sub-count {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-tertiary, #94a3b8);
  padding: 1px 5px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.05);
}

/* ── 状态筛选 ── */
.status-filter-row {
  flex-shrink: 0;
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
  border: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.18));
  background: rgba(255, 255, 255, 0.6);
  color: var(--text-tertiary, #94a3b8);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.status-btn:hover { border-color: #0d9488; }
.status-btn.active { border-color: #0d9488; background: rgba(13, 148, 136, 0.1); color: var(--text-primary, #0f172a); }
.status-btn.online.active { border-color: #10b981; background: rgba(16, 185, 129, 0.15); }
.status-btn.warn.active { border-color: #f59e0b; background: rgba(245, 158, 11, 0.15); }
.status-btn.alarm.active { border-color: #ef4444; background: rgba(239, 68, 68, 0.15); }
.status-btn.offline.active { border-color: #6b7280; background: rgba(107, 114, 128, 0.15); }

/* ── 设备列表 ── */
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

.device-list::-webkit-scrollbar { width: 4px; }
.device-list::-webkit-scrollbar-thumb { background: rgba(13, 148, 136, 0.4); border-radius: 2px; }

.device-item {
  display: flex;
  align-items: flex-start;
  padding: 10px 10px 10px 12px;
  margin-bottom: 6px;
  border: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.18));
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.58);
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.device-item:hover {
  background: rgba(255, 255, 255, 0.88);
  border-color: rgba(13, 148, 136, 0.24);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
}

.device-item.selected {
  background: rgba(13, 148, 136, 0.1);
  border-color: rgba(13, 148, 136, 0.28);
  box-shadow: 0 0 0 1px rgba(13, 148, 136, 0.08), 0 8px 18px rgba(13, 148, 136, 0.08);
}

.device-main { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.device-name-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-width: 0; }
.device-name { display: flex; align-items: center; min-width: 0; color: #0f172a; font-size: 13px; }
.device-name-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

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

.device-metric-line::-webkit-scrollbar { display: none; }

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

.metric-chip.observed { border-color: rgba(15, 23, 42, 0.08); background: rgba(15, 23, 42, 0.04); }
.metric-chip.threshold { border-color: rgba(37, 99, 235, 0.16); background: rgba(37, 99, 235, 0.08); }
.metric-chip.threshold-blue { border-color: rgba(37, 99, 235, 0.18); background: rgba(37, 99, 235, 0.08); }
.metric-chip.threshold-yellow { border-color: rgba(202, 138, 4, 0.18); background: rgba(250, 204, 21, 0.12); }
.metric-chip.threshold-orange { border-color: rgba(234, 88, 12, 0.18); background: rgba(249, 115, 22, 0.1); }
.metric-chip.threshold-red { border-color: rgba(220, 38, 38, 0.18); background: rgba(239, 68, 68, 0.1); }
.metric-chip.normal { border-color: rgba(71, 85, 105, 0.14); background: rgba(71, 85, 105, 0.08); }
.metric-chip.warn { border-color: rgba(245, 158, 11, 0.18); background: rgba(245, 158, 11, 0.08); }
.metric-chip.alarm { border-color: rgba(239, 68, 68, 0.18); background: rgba(239, 68, 68, 0.08); }
.metric-chip.accent.warn { background: linear-gradient(135deg, rgba(245, 158, 11, 0.16), rgba(245, 158, 11, 0.08)); }
.metric-chip.accent.alarm { background: linear-gradient(135deg, rgba(239, 68, 68, 0.16), rgba(239, 68, 68, 0.08)); }

.metric-label { font-size: 10px; color: #475569; }
.metric-chip.threshold .metric-label { color: #1d4ed8; }
.metric-chip.threshold-blue .metric-label { color: #1d4ed8; }
.metric-chip.threshold-yellow .metric-label { color: #a16207; }
.metric-chip.threshold-orange .metric-label { color: #c2410c; }
.metric-chip.threshold-red .metric-label { color: #b91c1c; }

.metric-value { font-size: 11px; font-weight: 700; color: var(--text-primary); }
.metric-chip.observed .metric-value { color: #0f172a; }
.metric-chip.threshold .metric-value { color: #1d4ed8; }
.metric-chip.threshold-blue .metric-value { color: #1d4ed8; }
.metric-chip.threshold-yellow .metric-value { color: #a16207; }
.metric-chip.threshold-orange .metric-value { color: #c2410c; }
.metric-chip.threshold-red .metric-value { color: #b91c1c; }
.metric-chip.normal .metric-value { color: #475569; }
.metric-chip.warn .metric-value { color: #b45309; }
.metric-chip.alarm .metric-value { color: #b91c1c; }

.status-dot {
  width: 7px; height: 7px; border-radius: 50%;
  display: inline-block; margin-right: 6px; flex-shrink: 0;
}

.status-dot.online { background: #10b981; box-shadow: 0 0 4px #10b981; }
.status-dot.warn { background: #f59e0b; box-shadow: 0 0 4px #f59e0b; animation: pulse-ring-yellow 1.5s ease-out infinite; }
.status-dot.alarm { background: #ef4444; box-shadow: 0 0 4px #ef4444; animation: pulse-ring-red 1.2s ease-out infinite; }
.status-dot.offline { background: #6b7280; }

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
  color: var(--text-muted, #94a3b8);
  font-size: 12px;
  gap: 8px;
}

.empty-state i { font-size: 24px; opacity: 0.5; }
</style>
