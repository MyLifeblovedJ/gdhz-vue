<template>
  <div class="map-legend-wrapper" v-if="visibleLegends.length > 0">
    <div class="legend-container">
      <!-- 标题栏 -->
      <div class="legend-title-bar">
        <i class="fa-solid fa-palette"></i>
        <span>图例</span>
      </div>
      <!-- 图例内容区 -->
      <div class="legend-scroll">
        <div 
          v-for="legend in visibleLegends" 
          :key="legend.id"
          class="legend-panel"
          :class="{ collapsed: collapsedLegends[legend.id] }"
        >
          <!-- 图例标题栏 -->
          <div class="legend-header" @click="toggleLegend(legend.id)">
            <span class="legend-name">{{ legend.title }}</span>
            <i :class="collapsedLegends[legend.id] ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-up'"></i>
          </div>
          
          <!-- 图例内容 -->
          <div class="legend-content" v-show="!collapsedLegends[legend.id]">
            <div 
              v-for="(item, index) in legend.items" 
              :key="index"
              class="legend-item"
            >
              <!-- 图例符号 -->
              <span class="legend-symbol" :class="[item.type, { animate: item.animate }]">
                <template v-if="item.type === 'dot'">
                  <span class="symbol-dot" :style="{ background: item.color }"></span>
                </template>
                <template v-else-if="item.type === 'line'">
                  <span class="symbol-line" :style="{ background: item.color }"></span>
                </template>
                <template v-else-if="item.type === 'dashed'">
                  <span class="symbol-dashed" :style="{ borderColor: item.color }"></span>
                </template>
                <template v-else-if="item.type === 'circle'">
                  <span class="symbol-circle" :style="{ borderColor: item.color }"></span>
                </template>
                <template v-else-if="item.type === 'gradient'">
                  <span class="symbol-gradient" :style="{ background: item.color }"></span>
                </template>
              </span>
              <span class="legend-label">{{ item.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAppStore } from '../../stores/app'
import { legendConfig } from '../../data/deviceConfig'

const store = useAppStore()

// 跟踪已折叠的图例
const collapsedLegends = ref({})

// 跟踪图例添加顺序（后添加的在上面）
const legendOrder = ref([])

// 根据图层可见性获取需要显示的图例
const visibleLegends = computed(() => {
  const legends = []
  const visibility = store.layerVisibility
  
  // 观测站点（总是显示，如果有任何站点图层开启）
  if (visibility.surge_stations || visibility.buoys || 
      visibility.coastal_stations || visibility.tide_stations || 
      visibility.coastal_base || visibility.wave_buoy ||
      visibility.erosion_monitor || visibility.smart_marker ||
      visibility.uav || visibility.usv) {
    legends.push(legendConfig.stations)
  }
  
  // 台风
  if (visibility.typhoon) {
    legends.push(legendConfig.typhoon)
  }
  
  // 船舶
  if (visibility.vessels) {
    legends.push(legendConfig.vessels)
  }
  
  // 风粒子
  if (visibility.wind_particle) {
    legends.push(legendConfig.wind_particle)
  }
  
  // 海浪热力图
  if (visibility.wave_heatmap) {
    legends.push(legendConfig.wave_heatmap)
  }
  
  // 按添加顺序排序（后添加的在前面），未在顺序列表中的放最后
  return legends.sort((a, b) => {
    const aIndex = legendOrder.value.indexOf(a.id)
    const bIndex = legendOrder.value.indexOf(b.id)
    if (aIndex === -1 && bIndex === -1) return 0
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return bIndex - aIndex // 后添加的排在前面
  })
})

// 切换图例展开/折叠
function toggleLegend(legendId) {
  collapsedLegends.value[legendId] = !collapsedLegends.value[legendId]
}

// 监听图层可见性变化，更新图例顺序
watch(() => store.layerVisibility, (newVal, oldVal) => {
  // 检测新开启的图层
  Object.keys(newVal).forEach(key => {
    if (newVal[key] && !oldVal?.[key]) {
      // 新开启的图层，添加到顺序列表末尾（显示在最上面）
      const legendId = getLegendIdForLayer(key)
      if (legendId && !legendOrder.value.includes(legendId)) {
        legendOrder.value.push(legendId)
        
        // 折叠其他图例，展开新图例
        Object.keys(collapsedLegends.value).forEach(id => {
          if (id !== legendId) {
            collapsedLegends.value[id] = true
          }
        })
        collapsedLegends.value[legendId] = false
      }
    }
  })
}, { deep: true })

// 根据图层ID获取对应的图例ID
function getLegendIdForLayer(layerId) {
  const mapping = {
    surge_stations: 'stations',
    buoys: 'stations',
    coastal_stations: 'stations',
    coastal_base: 'stations',
    tide_stations: 'stations',
    wave_buoy: 'stations',
    anchor_buoy: 'stations',
    disposable_buoy: 'stations',
    argo_buoy: 'stations',
    erosion_monitor: 'stations',
    smart_marker: 'stations',
    uav: 'stations',
    usv: 'stations',
    typhoon: 'typhoon',
    vessels: 'vessels',
    wind_particle: 'wind_particle',
    wave_heatmap: 'wave_heatmap',
  }
  return mapping[layerId]
}
</script>

<style scoped>
.map-legend-wrapper {
  position: absolute;
  left: 10px;
  bottom: 70px;
  z-index: 1000;
  pointer-events: auto;
}

.legend-container {
  width: 150px;
  max-height: 300px;
  background: var(--bg-panel);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-normal);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 标题栏（与左侧边栏组件一致） */
.legend-title-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid var(--border-subtle);
  font-size: 12px;
  font-weight: 600;
  color: var(--accent-cyan);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.legend-title-bar i {
  font-size: 12px;
}

.legend-scroll {
  max-height: 250px;
  overflow-y: auto;
  flex: 1;
}

.legend-scroll::-webkit-scrollbar {
  width: 4px;
}

.legend-scroll::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.legend-scroll::-webkit-scrollbar-thumb {
  background: var(--accent-cyan);
  border-radius: 2px;
}

.legend-panel {
  border-bottom: 1px solid var(--border-subtle);
}

.legend-panel:last-child {
  border-bottom: none;
}

.legend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  cursor: pointer;
  transition: background 0.2s;
}

.legend-header:hover {
  background: rgba(0, 180, 230, 0.1);
}

.legend-name {
  font-size: 10px;
  font-weight: 500;
  color: var(--text-secondary);
}

.legend-header i {
  font-size: 8px;
  color: var(--text-muted);
  transition: transform 0.2s;
}

.legend-panel.collapsed .legend-header i {
  transform: rotate(0);
}

.legend-content {
  padding: 6px 10px 10px;
  border-top: 1px solid var(--border-subtle);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 0;
  font-size: 10px;
  color: var(--text-secondary);
}

.legend-symbol {
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 圆点符号 */
.symbol-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-symbol.animate .symbol-dot {
  animation: legend-pulse 1.5s infinite;
}

@keyframes legend-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

/* 线条符号 */
.symbol-line {
  width: 16px;
  height: 2px;
  border-radius: 1px;
}

/* 虚线符号 */
.symbol-dashed {
  width: 16px;
  height: 0;
  border-top: 2px dashed;
}

/* 圆圈符号 */
.symbol-circle {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid;
  background: transparent;
}

/* 渐变符号 */
.symbol-gradient {
  width: 16px;
  height: 8px;
  border-radius: 2px;
  opacity: 0.8;
}

.legend-label {
  flex: 1;
}
</style>
