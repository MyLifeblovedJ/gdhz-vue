<template>
  <div class="map-legend-wrapper" :class="{ embedded }">
    <div class="legend-container">
      <div
        v-if="!embedded"
        class="legend-title-bar"
        @click="isContainerExpanded = !isContainerExpanded"
        :style="{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }"
      >
        <div style="display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-palette"></i>
          <span>图例</span>
        </div>
        <i
          :class="isContainerExpanded ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'"
          style="font-size: 14px; color: #64748b; transition: transform 0.2s;"
        ></i>
      </div>

      <div class="legend-scroll" v-show="embedded || isContainerExpanded">
        <div v-if="visibleLegends.length === 0" class="legend-empty">
          暂无相关图例
        </div>

        <div
          v-for="legend in visibleLegends"
          :key="legend.id"
          class="legend-panel"
          :class="{ collapsed: collapsedLegends[legend.id] }"
        >
          <div class="legend-header" @click="toggleLegend(legend.id)">
            <span class="legend-name">{{ legend.title }}</span>
            <span class="legend-header-controls">
              <span
                v-if="legend.id === 'geology'"
                class="legend-link-inline header"
                :title="geologyLinkTooltip"
                @click.stop
              >
                <span class="legend-link-label">联动</span>
                <button
                  type="button"
                  class="ios-switch"
                  :class="{ active: isGeologyLinked, disabled: !canToggleGeologyLink }"
                  :disabled="!canToggleGeologyLink"
                  :aria-pressed="isGeologyLinked"
                  @click.stop="toggleGeologyColorLink"
                >
                  <span class="ios-switch-track">
                    <span class="ios-switch-thumb"></span>
                  </span>
                </button>
              </span>
              <i :class="collapsedLegends[legend.id] ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-up'"></i>
            </span>
          </div>

          <div class="legend-content" v-show="!collapsedLegends[legend.id]">
            <div
              v-for="(item, index) in legend.items"
              :key="index"
              class="legend-item"
              :class="{
                'has-description': Boolean(item.description),
                'legend-item-section': item.type === 'geology-color-section',
              }"
            >
              <template v-if="item.type === 'geology-color-section'">
                <div class="legend-color-section">
                  <div class="legend-color-section-title">{{ item.label }}</div>
                  <div
                    v-for="colorItem in visibleGeologyColorItems(item)"
                    :key="colorItem.id"
                    class="legend-item legend-item-sub"
                  >
                    <span class="legend-symbol">
                      <span
                        v-if="item.symbolType === 'geology-processed'"
                        class="symbol-geology-processed"
                        :style="{ borderColor: colorItem.color, background: '#ffffff' }"
                      ></span>
                      <span
                        v-else
                        class="symbol-geology-raw"
                        :style="{ background: colorItem.color, borderColor: '#0f172a' }"
                      ></span>
                    </span>
                    <span class="legend-text">
                      <span class="legend-label">{{ colorItem.label }}</span>
                    </span>
                  </div>
                  <button
                    v-if="item.items.length > GEOLOGY_COLOR_COLLAPSE_LIMIT"
                    type="button"
                    class="legend-show-more"
                    @click.stop="toggleGeologyColorSection(item.id)"
                  >
                    {{ isGeologyColorSectionExpanded(item.id)
                      ? '收起'
                      : `显示更多（剩余 ${item.items.length - GEOLOGY_COLOR_COLLAPSE_LIMIT} 项）` }}
                  </button>
                </div>
              </template>
              <template v-else>
                <span class="legend-symbol" :class="[item.type, { animate: item.animate }]">
                  <template v-if="item.type === 'dot'">
                    <span class="symbol-dot" :style="{ background: item.color }"></span>
                  </template>
                  <template v-else-if="item.type === 'geology-raw'">
                    <span
                      class="symbol-geology-raw"
                      :style="{ background: item.color, borderColor: item.borderColor || '#0f172a' }"
                    ></span>
                  </template>
                  <template v-else-if="item.type === 'geology-processed'">
                    <span
                      class="symbol-geology-processed"
                      :style="{ borderColor: item.color, background: item.fillColor || '#ffffff' }"
                    ></span>
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

                <span class="legend-text">
                  <span class="legend-label">{{ item.label }}</span>
                  <span v-if="item.description" class="legend-description">
                    <template v-if="item.type === 'geology-raw' || item.type === 'geology-processed'">
                      稳定按照
                      <select
                        class="inline-color-select"
                        :value="getGeologyItemColorField(item.type)"
                        @change="handleGeologyItemColorByChange(item.type, $event)"
                      >
                        <option v-for="field in geologyFieldOptions" :key="field.key" :value="field.key">
                          {{ field.label }}
                        </option>
                      </select>
                      映射颜色，同值同色，{{ item.shapeText }}。
                    </template>
                    <template v-else>
                      {{ item.description }}
                    </template>
                  </span>
                </span>
              </template>
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
import { GEOLOGY_FIELD_OPTIONS } from '../../utils/geologySampling'

const props = defineProps({
  embedded: {
    type: Boolean,
    default: false,
  },
})

const store = useAppStore()

const collapsedLegends = ref({})
const isContainerExpanded = ref(false)
const legendOrder = ref([])
const expandedGeologyColorSections = ref({})
const GEOLOGY_COLOR_COLLAPSE_LIMIT = 10

const geologyColorByField = computed(() => store.geology.colorBy)
const rawGeologyColorByField = computed(() => store.geology.rawColorBy)
const processedGeologyColorByField = computed(() => store.geology.processedColorBy)
const geologyFieldOptions = computed(() => store.geology.fieldOptions?.length ? store.geology.fieldOptions : GEOLOGY_FIELD_OPTIONS)
const canToggleGeologyLink = computed(() => store.geology.layers.rawVisible && store.geology.layers.processedVisible)
const isGeologyLinked = computed(() => canToggleGeologyLink.value && store.geology.colorMode === 'linked')
const geologyLinkTooltip = computed(() => (
  canToggleGeologyLink.value
    ? '开启后原始数据和处理后数据共用同一个分类着色字段；关闭后可分别设置。'
    : '仅在同时显示原始数据和处理后数据时可开启联动着色。'
))
const geologyColorItems = computed(() => {
  const group = store.geologyColorLegendItems[0]
  return group?.children?.map(item => ({
    id: item.id,
    color: item.color,
    label: item.label,
  })) || []
})
const rawGeologyColorItems = computed(() => {
  const group = store.rawGeologyColorLegendItems[0]
  return group?.children?.map(item => ({
    id: item.id,
    color: item.color,
    label: item.label,
  })) || []
})
const processedGeologyColorItems = computed(() => {
  const group = store.processedGeologyColorLegendItems[0]
  return group?.children?.map(item => ({
    id: item.id,
    color: item.color,
    label: item.label,
  })) || []
})

function handleGeologyColorByChange(event) {
  store.setGeologyColorBy(event.target.value)
}

function getGeologyItemColorField(itemType) {
  if (isGeologyLinked.value) return geologyColorByField.value
  return itemType === 'geology-processed'
    ? processedGeologyColorByField.value
    : rawGeologyColorByField.value
}

function handleGeologyItemColorByChange(itemType, event) {
  if (isGeologyLinked.value) {
    handleGeologyColorByChange(event)
    return
  }
  store.setGeologyDatasetColorBy(
    itemType === 'geology-processed' ? 'processed' : 'raw',
    event.target.value,
  )
}

function toggleGeologyColorLink() {
  if (!canToggleGeologyLink.value) return
  if (isGeologyLinked.value) {
    store.setGeologyColorMode('independent')
    return
  }
  store.setGeologyColorBy(rawGeologyColorByField.value)
  store.setGeologyColorMode('linked')
}

const geologyLegend = computed(() => {
  if (!store.geology.layers.rawVisible && !store.geology.layers.processedVisible) {
    return null
  }

  const items = []

  if (store.geology.layers.rawVisible) {
    items.push({
      type: 'geology-raw',
      color: '#64748b',
      borderColor: '#0f172a',
      label: '原始数据',
      description: true,
      shapeText: '实心圆点',
    })
    const colorItems = store.geology.colorMode === 'independent'
      ? rawGeologyColorItems.value
      : geologyColorItems.value
    if (colorItems.length) {
      items.push({
        id: 'geology-color-raw',
        type: 'geology-color-section',
        label: '原始数据分类',
        symbolType: 'geology-raw',
        items: colorItems,
      })
    }
  }

  if (store.geology.layers.processedVisible) {
    items.push({
      type: 'geology-processed',
      color: '#64748b',
      fillColor: '#ffffff',
      label: '处理后数据',
      description: true,
      shapeText: '白心菱形',
    })
    const colorItems = store.geology.colorMode === 'independent'
      ? processedGeologyColorItems.value
      : geologyColorItems.value
    if (colorItems.length) {
      items.push({
        id: 'geology-color-processed',
        type: 'geology-color-section',
        label: '处理后数据分类',
        symbolType: 'geology-processed',
        items: colorItems,
      })
    }
  }

  return {
    id: 'geology',
    title: '地质采样',
    items,
  }
})

const visibleLegends = computed(() => {
  const legends = []
  const visibility = store.layerVisibility

  if (geologyLegend.value) {
    legends.push(geologyLegend.value)
  }

  if (
    visibility.surge_stations ||
    visibility.buoys ||
    visibility.coastal_stations ||
    visibility.tide_stations ||
    visibility.coastal_base ||
    visibility.wave_buoy ||
    visibility.erosion_monitor ||
    visibility.smart_marker ||
    visibility.uav ||
    visibility.usv
  ) {
    legends.push(legendConfig.stations)
  }

  if (visibility.typhoon) {
    legends.push(legendConfig.typhoon)
  }

  if (visibility.vessels) {
    legends.push(legendConfig.vessels)
  }

  if (visibility.wind_particle) {
    legends.push(legendConfig.wind_particle)
  }

  if (visibility.wave_heatmap) {
    legends.push(legendConfig.wave_heatmap)
  }

  return legends.sort((a, b) => {
    const aIndex = legendOrder.value.indexOf(a.id)
    const bIndex = legendOrder.value.indexOf(b.id)
    if (aIndex === -1 && bIndex === -1) return 0
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return bIndex - aIndex
  })
})

function toggleLegend(legendId) {
  collapsedLegends.value[legendId] = !collapsedLegends.value[legendId]
}

function isGeologyColorSectionExpanded(sectionId) {
  return !!expandedGeologyColorSections.value[sectionId]
}

function toggleGeologyColorSection(sectionId) {
  expandedGeologyColorSections.value = {
    ...expandedGeologyColorSections.value,
    [sectionId]: !expandedGeologyColorSections.value[sectionId],
  }
}

function visibleGeologyColorItems(section) {
  if (isGeologyColorSectionExpanded(section.id)) return section.items
  return section.items.slice(0, GEOLOGY_COLOR_COLLAPSE_LIMIT)
}

watch(
  () => store.layerVisibility,
  (newVal, oldVal) => {
    Object.keys(newVal).forEach((key) => {
      if (newVal[key] && !oldVal?.[key]) {
        const legendId = getLegendIdForLayer(key)
        if (legendId && !legendOrder.value.includes(legendId)) {
          legendOrder.value.push(legendId)

          Object.keys(collapsedLegends.value).forEach((id) => {
            if (id !== legendId) {
              collapsedLegends.value[id] = true
            }
          })
          collapsedLegends.value[legendId] = false
        }
      }
    })
  },
  { deep: true },
)

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
  position: fixed;
  left: var(--map-safe-left, 18px);
  top: var(--map-safe-top, 200px);
  z-index: 1000;
  pointer-events: auto;
}

.map-legend-wrapper.embedded {
  position: static;
  width: 100%;
  margin-bottom: 8px;
}

.legend-container {
  width: 168px;
  max-height: 300px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 14px;
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.12);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.map-legend-wrapper.embedded .legend-container {
  width: 100%;
  max-height: 100%;
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
  overflow: visible;
}

.legend-title-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #ffffff;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}

.map-legend-wrapper.embedded .legend-title-bar {
  background: transparent;
  padding: 14px 12px 10px;
  font-size: 16px;
  font-weight: 800;
  color: #1a1a1a;
  border-bottom: 2px solid #f1f3f5;
  margin-bottom: 8px;
}

.legend-title-bar i {
  font-size: 13px;
  color: var(--text-secondary);
}

.legend-scroll {
  max-height: 250px;
  overflow-y: auto;
  flex: 1;
}

.map-legend-wrapper.embedded .legend-scroll {
  max-height: none;
  overflow: visible;
}

.legend-scroll::-webkit-scrollbar {
  width: 4px;
}

.legend-scroll::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.04);
  border-radius: 2px;
}

.legend-scroll::-webkit-scrollbar-thumb {
  background: var(--border-normal);
  border-radius: 2px;
}

.legend-empty {
  padding: 12px;
  color: #888;
  font-size: 13px;
  text-align: center;
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
  padding: 9px 10px;
  cursor: pointer;
  transition: background 0.2s;
}

.legend-header:hover {
  background: rgba(15, 23, 42, 0.03);
}

.legend-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.legend-header i {
  font-size: 12px;
  color: var(--text-muted);
  transition: transform 0.2s;
}

.legend-header-controls {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.legend-panel.collapsed .legend-header i {
  transform: rotate(0);
}

.legend-content {
  padding: 8px 10px 12px;
  border-top: 1px solid var(--border-subtle);
}

.legend-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 6px 0;
  font-size: 12px;
  color: var(--text-secondary);
}

.legend-item-section {
  padding: 4px 0 2px;
}

.legend-symbol {
  width: 20px;
  min-width: 20px;
  min-height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.symbol-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.symbol-geology-raw {
  width: 10px;
  height: 10px;
  border: 1.2px solid #0f172a;
  border-radius: 50%;
  box-sizing: border-box;
}

.symbol-geology-processed {
  width: 10px;
  height: 10px;
  border: 1.4px solid #64748b;
  background: #ffffff;
  transform: rotate(45deg);
  box-sizing: border-box;
}

.legend-symbol.animate .symbol-dot {
  animation: legend-pulse 1.5s infinite;
}

@keyframes legend-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

.symbol-line {
  width: 16px;
  height: 2px;
  border-radius: 1px;
}

.symbol-dashed {
  width: 16px;
  height: 0;
  border-top: 2px dashed;
}

.symbol-circle {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid;
  background: transparent;
}

.symbol-gradient {
  width: 16px;
  height: 8px;
  border-radius: 2px;
  opacity: 0.8;
}

.legend-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.legend-label {
  flex: 1;
  line-height: 1.35;
}

.legend-item.has-description .legend-label {
  color: var(--text-primary);
  font-size: 13.5px;
  font-weight: 700;
}

.legend-color-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-left: 30px;
}

.legend-color-section-title {
  color: var(--text-secondary);
  font-size: 11.5px;
  font-weight: 700;
  padding: 2px 0 3px;
}

.legend-item-sub {
  padding: 4px 0;
}

.legend-show-more {
  align-self: flex-start;
  padding: 2px 0 0;
  border: none;
  background: transparent;
  color: #0f172a;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.legend-show-more:hover {
  color: #0284c7;
}

.legend-description {
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.5;
}

.legend-link-inline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
  vertical-align: middle;
}

.legend-link-inline.header {
  margin-left: 0;
}

.legend-link-label {
  color: #475569;
  font-size: 11.5px;
  font-weight: 700;
}

.ios-switch {
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

.ios-switch-track {
  position: relative;
  display: block;
  width: 34px;
  height: 20px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.42);
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.08);
  transition: background 0.2s ease;
}

.ios-switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.24);
  transition: transform 0.2s ease;
}

.ios-switch.active .ios-switch-track {
  background: #22c55e;
}

.ios-switch.active .ios-switch-thumb {
  transform: translateX(14px);
}

.ios-switch.disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

/* ── 地质采样内联着色选择 ── */
.inline-color-select {
  appearance: none;
  -webkit-appearance: none;
  display: inline;
  padding: 0 14px 0 2px;
  margin: 0 3px;
  border: none;
  border-radius: 0;
  background: transparent url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 5 5-5' fill='none' stroke='%231e293b' stroke-width='1.4'/%3E%3C/svg%3E") no-repeat right 1px center;
  color: #0f172a;
  font-size: 12px;
  font-weight: 800;
  text-decoration: underline;
  text-decoration-color: #1e293b;
  text-decoration-thickness: 1.5px;
  text-underline-offset: 3px;
  cursor: pointer;
  outline: none;
  vertical-align: baseline;
}

.inline-color-select:focus {
  text-decoration-color: #1e293b;
}
</style>
