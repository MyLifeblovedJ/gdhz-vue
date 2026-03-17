<template>
  <div class="layer-control">
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
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '../../stores/app'

const emit = defineEmits(['layer-toggle'])

const store = useAppStore()

// 状态
const collapsedGroups = ref({
  base: true,
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
</script>

<style scoped>
.layer-control {
  padding: 4px 0;
}

/* 图层树 - 固定高度并启用内部滚动 */
.layer-tree-scroll {
  max-height: 400px;
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
