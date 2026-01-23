<template>
  <aside class="left-toolbar">
    <!-- 图层控制 -->
    <CollapsiblePanel id="panel-layers" title="图层控制" icon="fa-layer-group">
      <div class="layer-tree-scroll">
        <!-- 基础图层 -->
        <div class="layer-group" :class="{ collapsed: collapsedGroups['base'] }">
          <div class="layer-group-header" @click="toggleLayerGroup('base')">
            <i class="fa-solid fa-chevron-down"></i>
            <span>基础图层</span>
          </div>
          <div class="layer-group-content">
            <label class="layer-item">
              <input type="checkbox" checked @change="toggleLayer('coastline', $event.target.checked)">
              海岸线
            </label>
            <label class="layer-item">
              <input type="checkbox" @change="toggleLayer('district', $event.target.checked)">
              行政区划
            </label>
          </div>
        </div>
        
        <!-- 观测网络（树形结构） -->
        <div class="layer-group" :class="{ collapsed: collapsedGroups['observe'] }">
          <div class="layer-group-header" @click="toggleLayerGroup('observe')">
            <i class="fa-solid fa-chevron-down"></i>
            <span>观测网络</span>
          </div>
          <div class="layer-group-content">
            <!-- 岸基观测站 -->
            <div class="layer-tree-node">
              <label class="layer-item parent">
                <input type="checkbox" :checked="layerVisibility.coastal_stations" @change="toggleLayer('coastal_stations', $event.target.checked)">
                岸基观测站
              </label>
              <div class="layer-children">
                <label class="layer-item child">
                  <input type="checkbox" :checked="layerVisibility.coastal_base" @change="toggleLayer('coastal_base', $event.target.checked)">
                  岸基观测站
                </label>
                <label class="layer-item child">
                  <input type="checkbox" :checked="layerVisibility.tide_stations" @change="toggleLayer('tide_stations', $event.target.checked)">
                  潮位站
                </label>
                <label class="layer-item child">
                  <input type="checkbox" :checked="layerVisibility.surge_stations" @change="toggleLayer('surge_stations', $event.target.checked)">
                  风暴潮核定站
                </label>
              </div>
            </div>
            <!-- 浮标 -->
            <div class="layer-tree-node">
              <label class="layer-item parent">
                <input type="checkbox" :checked="layerVisibility.buoys" @change="toggleLayer('buoys', $event.target.checked)">
                浮标
              </label>
              <div class="layer-children">
                <label class="layer-item child">
                  <input type="checkbox" :checked="layerVisibility.wave_buoy" @change="toggleLayer('wave_buoy', $event.target.checked)">
                  波浪谱浮标
                </label>
                <label class="layer-item child">
                  <input type="checkbox" :checked="layerVisibility.anchor_buoy" @change="toggleLayer('anchor_buoy', $event.target.checked)">
                  锚定浮标
                </label>
                <label class="layer-item child">
                  <input type="checkbox" :checked="layerVisibility.disposable_buoy" @change="toggleLayer('disposable_buoy', $event.target.checked)">
                  抛弃式浮标
                </label>
                <label class="layer-item child">
                  <input type="checkbox" :checked="layerVisibility.argo_buoy" @change="toggleLayer('argo_buoy', $event.target.checked)">
                  Argo浮标
                </label>
              </div>
            </div>
            <!-- 其他设备 -->
            <label class="layer-item">
              <input type="checkbox" :checked="layerVisibility.erosion_monitor" @change="toggleLayer('erosion_monitor', $event.target.checked)">
              海岸侵蚀
            </label>
            <label class="layer-item">
              <input type="checkbox" :checked="layerVisibility.smart_marker" @change="toggleLayer('smart_marker', $event.target.checked)">
              智能标识物
            </label>
            <label class="layer-item">
              <input type="checkbox" :checked="layerVisibility.uav" @change="toggleLayer('uav', $event.target.checked)">
              无人机
            </label>
            <label class="layer-item">
              <input type="checkbox" :checked="layerVisibility.usv" @change="toggleLayer('usv', $event.target.checked)">
              无人艇
            </label>
          </div>
        </div>
        
        <!-- 实时态势 -->
        <div class="layer-group" :class="{ collapsed: collapsedGroups['realtime'] }">
          <div class="layer-group-header" @click="toggleLayerGroup('realtime')">
            <i class="fa-solid fa-chevron-down"></i>
            <span>实时态势</span>
          </div>
          <div class="layer-group-content">
            <!-- 台风 (树形结构) -->
            <div class="layer-tree-node">
              <label class="layer-item parent">
                <input type="checkbox" :checked="layerVisibility.typhoon" @change="toggleLayer('typhoon', $event.target.checked)">
                台风
              </label>
              <div class="layer-children">
                <label class="layer-item child">
                  <input type="checkbox" :checked="layerVisibility.typhoon_wind_circle" @change="toggleLayer('typhoon_wind_circle', $event.target.checked)">
                  风圈
                </label>
                <label class="layer-item child">
                  <input type="checkbox" :checked="layerVisibility.typhoon_forecast_track" @change="toggleLayer('typhoon_forecast_track', $event.target.checked)">
                  预测路径
                </label>
                <label class="layer-item child">
                  <input type="checkbox" :checked="layerVisibility.typhoon_probability_range" @change="toggleLayer('typhoon_probability_range', $event.target.checked)">
                  中心概率范围
                </label>
                <label class="layer-item child">
                  <input type="checkbox" :checked="layerVisibility.typhoon_history_track" @change="toggleLayer('typhoon_history_track', $event.target.checked)">
                  历史路径
                </label>
                <label class="layer-item child">
                  <input type="checkbox" :checked="layerVisibility.typhoon_marker" @change="toggleLayer('typhoon_marker', $event.target.checked)">
                  台风标志
                </label>
              </div>
            </div>
            <label class="layer-item">
              <input type="checkbox" :checked="layerVisibility.vessels" @change="toggleLayer('vessels', $event.target.checked)">
              海上船舶
            </label>
            <label class="layer-item">
              <input type="checkbox" :checked="layerVisibility.wind_particle" @change="toggleLayer('wind_particle', $event.target.checked)">
              风场粒子
            </label>
            <label class="layer-item">
              <input type="checkbox" :checked="layerVisibility.wave_heatmap" @change="toggleLayer('wave_heatmap', $event.target.checked)">
              海浪热力图
            </label>
          </div>
        </div>
        
        <!-- 数值模拟 -->
        <div class="layer-group" :class="{ collapsed: collapsedGroups['sim'] }">
          <div class="layer-group-header" @click="toggleLayerGroup('sim')">
            <i class="fa-solid fa-chevron-down"></i>
            <span>数值模拟</span>
          </div>
          <div class="layer-group-content">
            <label class="layer-item">
              <input type="checkbox" @change="toggleLayer('wind', $event.target.checked)">
              精细化风场
            </label>
            <label class="layer-item">
              <input type="checkbox" @change="toggleLayer('wave_field', $event.target.checked)">
              海浪场
            </label>
            <label class="layer-item">
              <input type="checkbox" @change="toggleLayer('surge', $event.target.checked)">
              风暴增水
            </label>
          </div>
        </div>
      </div>
    </CollapsiblePanel>

    <!-- 观测设备（增强版） -->
    <CollapsiblePanel id="panel-devices" title="观测设备" icon="fa-satellite-dish">
      <DeviceExplorer @device-click="handleDeviceClick" />
    </CollapsiblePanel>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '../../stores/app'
import CollapsiblePanel from '../common/CollapsiblePanel.vue'
import DeviceExplorer from '../device/DeviceExplorer.vue'

// Emits
const emit = defineEmits(['device-click', 'layer-toggle'])

const store = useAppStore()

// 状态
const collapsedGroups = ref({
  base: true,
  observe: false,
  realtime: false,
  sim: true
})

// 计算属性
const layerVisibility = computed(() => store.layerVisibility)

// 方法
function toggleLayerGroup(groupId) {
  collapsedGroups.value[groupId] = !collapsedGroups.value[groupId]
}

function toggleLayer(layerId, checked) {
  emit('layer-toggle', { layerId, checked })
  store.setLayerVisibility(layerId, checked)
}

function handleDeviceClick(device) {
  emit('device-click', device)
}

onMounted(() => {
  store.fetchDevices()
})
</script>

<style scoped>
.left-toolbar {
  width: 340px;
  flex-shrink: 0;
  background: var(--bg-deepest);
  border-left: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  z-index: 50;
}

/* 图层树 - 固定高度并启用内部滚动 */
.layer-tree-scroll {
  max-height: 230px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--accent-cyan) transparent;
}

.layer-tree-scroll::-webkit-scrollbar {
  width: 4px;
}

.layer-tree-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.layer-tree-scroll::-webkit-scrollbar-thumb {
  background: var(--accent-cyan);
  border-radius: 2px;
  opacity: 0.5;
}

.layer-group {
  margin-bottom: 6px;
}

.layer-group-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.layer-group-header i {
  font-size: 8px;
  transition: transform var(--transition-fast);
  color: var(--text-muted);
}

.layer-group.collapsed .layer-group-header i {
  transform: rotate(-90deg);
}

.layer-group-content {
  padding-left: 14px;
  overflow: hidden;
  max-height: 1000px;
  transition: max-height var(--transition-fast);
}

.layer-group.collapsed .layer-group-content {
  max-height: 0;
}

/* 树形节点样式 */
.layer-tree-node {
  margin-bottom: 4px;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  cursor: pointer;
  color: var(--text-tertiary);
  font-size: 12px;
}

.layer-item.parent {
  color: var(--text-secondary);
  font-weight: 500;
}

.layer-children {
  padding-left: 18px;
  border-left: 1px solid var(--border-subtle);
  margin-left: 6px;
}

.layer-item.child {
  font-size: 11px;
}

.layer-item:hover {
  color: var(--text-secondary);
}

.layer-item input[type="checkbox"] {
  accent-color: var(--accent-cyan);
  width: 14px;
  height: 14px;
}
</style>
