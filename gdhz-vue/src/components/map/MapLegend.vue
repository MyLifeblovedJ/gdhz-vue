<template>
  <div class="map-legend-wrapper" v-if="visibleLegends.length > 0">
    <div class="legend-container">
      <!-- 鏍囬鏍?-->
      <div class="legend-title-bar">
        <i class="fa-solid fa-palette"></i>
        <span>图例</span>
      </div>
      <!-- 鍥句緥鍐呭鍖?-->
      <div class="legend-scroll">
        <div 
          v-for="legend in visibleLegends" 
          :key="legend.id"
          class="legend-panel"
          :class="{ collapsed: collapsedLegends[legend.id] }"
        >
          <!-- 鍥句緥鏍囬鏍?-->
          <div class="legend-header" @click="toggleLegend(legend.id)">
            <span class="legend-name">{{ legend.title }}</span>
            <i :class="collapsedLegends[legend.id] ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-up'"></i>
          </div>
          
          <!-- 鍥句緥鍐呭 -->
          <div class="legend-content" v-show="!collapsedLegends[legend.id]">
            <div 
              v-for="(item, index) in legend.items" 
              :key="index"
              class="legend-item"
            >
              <!-- 鍥句緥绗﹀彿 -->
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

// 璺熻釜宸叉姌鍙犵殑鍥句緥
const collapsedLegends = ref({})

// 璺熻釜鍥句緥娣诲姞椤哄簭锛堝悗娣诲姞鐨勫湪涓婇潰锛?
const legendOrder = ref([])

// 鏍规嵁鍥惧眰鍙鎬ц幏鍙栭渶瑕佹樉绀虹殑鍥句緥
const visibleLegends = computed(() => {
  const legends = []
  const visibility = store.layerVisibility
  
  // 瑙傛祴绔欑偣锛堟€绘槸鏄剧ず锛屽鏋滄湁浠讳綍绔欑偣鍥惧眰寮€鍚級
  if (visibility.surge_stations || visibility.buoys || 
      visibility.coastal_stations || visibility.tide_stations || 
      visibility.coastal_base || visibility.wave_buoy ||
      visibility.erosion_monitor || visibility.smart_marker ||
      visibility.uav || visibility.usv) {
    legends.push(legendConfig.stations)
  }
  
  // 鍙伴
  if (visibility.typhoon) {
    legends.push(legendConfig.typhoon)
  }
  
  // 鑸硅埗
  if (visibility.vessels) {
    legends.push(legendConfig.vessels)
  }
  
  // 椋庣矑瀛?
  if (visibility.wind_particle) {
    legends.push(legendConfig.wind_particle)
  }
  
  // 娴锋氮鐑姏鍥?
  if (visibility.wave_heatmap) {
    legends.push(legendConfig.wave_heatmap)
  }
  
  // 鎸夋坊鍔犻『搴忔帓搴忥紙鍚庢坊鍔犵殑鍦ㄥ墠闈級锛屾湭鍦ㄩ『搴忓垪琛ㄤ腑鐨勬斁鏈€鍚?
  return legends.sort((a, b) => {
    const aIndex = legendOrder.value.indexOf(a.id)
    const bIndex = legendOrder.value.indexOf(b.id)
    if (aIndex === -1 && bIndex === -1) return 0
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return bIndex - aIndex // 鍚庢坊鍔犵殑鎺掑湪鍓嶉潰
  })
})

// 鍒囨崲鍥句緥灞曞紑/鎶樺彔
function toggleLegend(legendId) {
  collapsedLegends.value[legendId] = !collapsedLegends.value[legendId]
}

// 鐩戝惉鍥惧眰鍙鎬у彉鍖栵紝鏇存柊鍥句緥椤哄簭
watch(() => store.layerVisibility, (newVal, oldVal) => {
  // 妫€娴嬫柊寮€鍚殑鍥惧眰
  Object.keys(newVal).forEach(key => {
    if (newVal[key] && !oldVal?.[key]) {
      // 鏂板紑鍚殑鍥惧眰锛屾坊鍔犲埌椤哄簭鍒楄〃鏈熬锛堟樉绀哄湪鏈€涓婇潰锛?
      const legendId = getLegendIdForLayer(key)
      if (legendId && !legendOrder.value.includes(legendId)) {
        legendOrder.value.push(legendId)
        
        // 鎶樺彔鍏朵粬鍥句緥锛屽睍寮€鏂板浘渚?
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

// 鏍规嵁鍥惧眰ID鑾峰彇瀵瑰簲鐨勫浘渚婭D
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

/* 鏍囬鏍忥紙涓庡乏渚ц竟鏍忕粍浠朵竴鑷达級 */
.legend-title-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(5, 11, 18, 0.42);
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
  background: rgba(6, 12, 20, 0.35);
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
  background: var(--bg-hover);
}

.legend-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.legend-header i {
  font-size: 12px;
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
  font-size: 12px;
  color: var(--text-secondary);
}

.legend-symbol {
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 鍦嗙偣绗﹀彿 */
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

/* 绾挎潯绗﹀彿 */
.symbol-line {
  width: 16px;
  height: 2px;
  border-radius: 1px;
}

/* 铏氱嚎绗﹀彿 */
.symbol-dashed {
  width: 16px;
  height: 0;
  border-top: 2px dashed;
}

/* 鍦嗗湀绗﹀彿 */
.symbol-circle {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid;
  background: transparent;
}

/* 娓愬彉绗﹀彿 */
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

