<template>
  <div class="device-explorer">
    <!-- 搜索框 -->
    <div class="search-bar">
      <i class="fa-solid fa-magnifying-glass"></i>
      <input 
        type="text" 
        v-model="searchKeyword"
        placeholder="搜索设备名称或ID..."
        class="search-input"
      >
      <button 
        v-if="searchKeyword || selectedCategory || selectedStatus"
        class="reset-btn"
        @click="resetFilters"
        title="重置筛选"
      >
        <i class="fa-solid fa-rotate-left"></i>
      </button>
    </div>
    
    <!-- 分类标签（彩色图标，整齐排列） -->
    <div class="category-grid">
      <button 
        class="category-btn"
        :class="{ active: selectedCategory === '' }"
        @click="selectedCategory = ''"
      >
        <i class="fa-solid fa-border-all"></i>
        <span>全部</span>
      </button>
      <button 
        v-for="category in deviceCategories" 
        :key="category.id"
        class="category-btn"
        :class="{ active: selectedCategory === category.id }"
        :style="{ '--cat-color': category.color }"
        @click="selectedCategory = category.id"
      >
        <i :class="'fa-solid ' + category.icon" :style="{ color: category.color }"></i>
        <span>{{ category.shortName }}</span>
      </button>
    </div>
    
    <!-- 状态筛选 -->
    <div class="status-filter-row">
      <button 
        class="status-btn"
        :class="{ active: selectedStatus === '' }"
        @click="selectedStatus = ''"
      >
        全部
      </button>
      <button 
        class="status-btn online"
        :class="{ active: selectedStatus === 'online' }"
        @click="selectedStatus = 'online'"
      >
        <span class="status-dot online"></span>
        在线
      </button>
      <button 
        class="status-btn warn"
        :class="{ active: selectedStatus === 'warn' }"
        @click="selectedStatus = 'warn'"
      >
        <span class="status-dot warn"></span>
        预警
      </button>
      <button 
        class="status-btn alarm"
        :class="{ active: selectedStatus === 'alarm' }"
        @click="selectedStatus = 'alarm'"
      >
        <span class="status-dot alarm"></span>
        告警
      </button>
      <button 
        class="status-btn offline"
        :class="{ active: selectedStatus === 'offline' }"
        @click="selectedStatus = 'offline'"
      >
        <span class="status-dot offline"></span>
        离线
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
          <div class="device-name">
            <span class="status-dot" :class="device.status"></span>
            {{ device.name }}
          </div>
          <div class="device-type">
            {{ device.typeName }} | {{ device.lat.toFixed(2) }}, {{ device.lng.toFixed(2) }}
          </div>
        </div>
        <div class="device-value" :style="{ color: getValueColor(device.status) }">
          {{ device.val || '--' }}
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
import { ref, computed } from 'vue'
import { useAppStore } from '../../stores/app'
import { deviceTypeTree } from '../../data/deviceConfig'

const emit = defineEmits(['device-click'])

const store = useAppStore()

// 状态
const searchKeyword = ref('')
const selectedCategory = ref('')
const selectedStatus = ref('')
const selectedDevice = ref(null)

// 设备分类
const deviceCategories = computed(() => {
  return deviceTypeTree.map(category => {
    let total = 0
    if (category.children && category.children.length > 0) {
      total = category.children.reduce((sum, child) => sum + child.count, 0)
    } else if (category.count) {
      total = category.count
    }
    return {
      ...category,
      total,
      shortName: getShortName(category.name)
    }
  })
})

// 筛选后的设备
const filteredDevices = computed(() => {
  let result = store.devices
  
  // 按分类筛选
  if (selectedCategory.value) {
    const category = deviceTypeTree.find(c => c.id === selectedCategory.value)
    if (category && category.children && category.children.length > 0) {
      const childTypes = category.children.map(c => c.id)
      result = result.filter(d => childTypes.includes(d.type) || d.type === selectedCategory.value)
    } else {
      result = result.filter(d => d.type === selectedCategory.value)
    }
  }
  
  // 按状态筛选
  if (selectedStatus.value) {
    result = result.filter(d => d.status === selectedStatus.value)
  }
  
  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(d => 
      d.name.toLowerCase().includes(keyword) || 
      d.id.toLowerCase().includes(keyword)
    )
  }
  
  // 按状态排序（预警/告警优先）
  return result
    .sort((a, b) => {
      const priority = { alarm: 0, warn: 1, online: 2, offline: 3 }
      return (priority[a.status] || 4) - (priority[b.status] || 4)
    })
    .slice(0, 50)
})

// 获取缩短的分类名
function getShortName(name) {
  const shortNames = {
    '岸基观测站': '岸基',
    '浮标': '浮标',
    '海岸侵蚀': '侵蚀',
    '智能标识物': '标识',
    '无人机': '无人机',
    '无人艇': '无人艇'
  }
  return shortNames[name] || name
}

// 重置筛选
function resetFilters() {
  searchKeyword.value = ''
  selectedCategory.value = ''
  selectedStatus.value = ''
}

// 点击设备
function handleDeviceClick(device) {
  selectedDevice.value = device
  emit('device-click', device)
}

// 获取值颜色
function getValueColor(status) {
  switch (status) {
    case 'alarm': return 'var(--alert-red)'
    case 'warn': return 'var(--status-warn)'
    default: return 'var(--text-secondary)'
  }
}
</script>

<style scoped>
.device-explorer {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 420px;
}

/* 搜索框 */
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  margin-bottom: 10px;
}

.search-bar i {
  color: var(--text-muted);
  font-size: 12px;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 12px;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.reset-btn {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: none;
  background: rgba(0, 180, 230, 0.2);
  color: var(--accent-cyan);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  transition: all 0.2s;
}

.reset-btn:hover {
  background: var(--accent-cyan);
  color: var(--bg-deepest);
}

/* 分类标签网格（整齐排列，彩色图标） */
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
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  background: rgba(0, 0, 0, 0.2);
  color: var(--text-secondary);
  font-size: 10px;
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
  background: rgba(0, 180, 230, 0.1);
}

.category-btn.active {
  border-color: var(--cat-color, var(--accent-cyan));
  background: linear-gradient(135deg, 
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

/* 状态筛选行 */
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
  border-radius: 6px;
  border: 1px solid var(--border-subtle);
  background: rgba(0, 0, 0, 0.2);
  color: var(--text-muted);
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.status-btn:hover {
  border-color: var(--accent-cyan);
}

.status-btn.active {
  border-color: var(--accent-cyan);
  background: rgba(0, 180, 230, 0.15);
  color: var(--text-primary);
}

.status-btn.online.active { border-color: var(--status-online); background: rgba(16, 185, 129, 0.15); }
.status-btn.warn.active { border-color: var(--status-warn); background: rgba(245, 158, 11, 0.15); }
.status-btn.alarm.active { border-color: var(--alert-red); background: rgba(239, 68, 68, 0.15); }
.status-btn.offline.active { border-color: var(--status-offline); background: rgba(107, 114, 128, 0.15); }

/* 设备列表 */
.device-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden; /* 禁止横向滚动 */
  display: flex;
  flex-direction: column;
  padding-right: 4px;
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
  justify-content: space-between;
  align-items: center;
  padding: 10px 4px; /* 增加做左侧padding */
  border-bottom: 1px solid var(--border-subtle);
  cursor: pointer;
  font-size: 12px;
  transition: all var(--transition-fast);
}

.device-item:hover {
  background: var(--bg-hover);
  margin: 0 -8px; /* 减小负边距 */
  padding: 10px 12px;
}

.device-item.selected {
  background: rgba(0, 180, 230, 0.1);
  margin: 0 -8px;
  padding: 10px 12px;
}

.device-main {
  display: flex;
  flex-direction: column;
  min-width: 0; /* 允许文本截断 */
  flex: 1;
  margin-right: 8px; /* 减少与数值的间距 */
}

.device-name {
  color: var(--text-secondary);
  font-size: 13px;
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.device-type {
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.device-value {
  font-family: var(--font-display);
  font-weight: 600;
  flex-shrink: 0; /* 防止数值被压缩 */
  text-align: right;
}

/* 状态点 */
.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 6px;
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

/* 空状态 */
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
