<template>
  <div
    class="minimap-container"
    :class="{ collapsed: isCollapsed }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <button
      class="minimap-toggle"
      type="button"
      :title="isCollapsed ? '展开全局视图' : '收起全局视图'"
      @click="isCollapsed = !isCollapsed"
    >
      <i :class="isCollapsed ? 'fa-solid fa-expand' : 'fa-solid fa-compress'"></i>
    </button>
    <div v-show="!isCollapsed" ref="minimapRef" class="minimap-leaflet"></div>
    <div v-show="isCollapsed" class="minimap-collapsed-label">
      <i class="fa-solid fa-map"></i>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import guangdongGeo from '../../data/guangdong_geo.json'

const props = defineProps({
  /** 主地图的中心点 [lat, lng] */
  center: {
    type: Array,
    default: () => [22.0, 114.5]
  },
  /** 主地图的缩放级别 */
  zoom: {
    type: Number,
    default: 7
  },
  /** 主地图视口边界 { north, south, east, west } */
  viewBounds: {
    type: Object,
    default: null
  },
  /** 底图类型 */
  basemap: {
    type: String,
    default: 'dark'
  }
})

const emit = defineEmits(['navigate', 'collapse-change'])

const minimapRef = ref(null)
const isCollapsed = ref(false)
const isHovered = ref(false)

let minimap = null
let viewportRect = null
let regionLayer = null

// 全局范围：南海 + 广东沿海区域
const GLOBAL_BOUNDS = {
  center: [18.5, 113.5],
  zoom: 4
}
const VIEWPORT_PADDING_RATIO = 0.32
const VIEWPORT_FIT_PADDING = [10, 10]
const VIEWPORT_FIT_MAX_ZOOM = 12

const tdtToken = import.meta.env.VITE_TIANDITU_TOKEN || ''

function handleMouseEnter() {
  isHovered.value = true
}

function handleMouseLeave() {
  isHovered.value = false
}

function initMinimap() {
  if (!minimapRef.value || minimap) return

  minimap = L.map(minimapRef.value, {
    center: GLOBAL_BOUNDS.center,
    zoom: GLOBAL_BOUNDS.zoom,
    zoomControl: false,
    attributionControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    touchZoom: false,
    tap: false
  })

  // 底图
  applyBasemap(props.basemap)

  // 渲染广东省轮廓
  renderRegionOutline()

  // 初始化视口矩形
  updateViewportRect()

  // 允许用户点击小地图导航
  minimap.on('click', (e) => {
    emit('navigate', { lat: e.latlng.lat, lng: e.latlng.lng })
  })
}

function renderRegionOutline() {
  if (!minimap || !guangdongGeo) return

  regionLayer = L.geoJSON(guangdongGeo, {
    style: {
      color: '#0ea5e9',
      weight: 1.2,
      opacity: 0.6,
      fillColor: '#0ea5e9',
      fillOpacity: 0.08,
      interactive: false
    }
  }).addTo(minimap)
}

function syncViewportCoverage(rectBounds) {
  if (!minimap || !rectBounds?.isValid?.()) return
  minimap.fitBounds(rectBounds.pad(VIEWPORT_PADDING_RATIO), {
    animate: false,
    padding: VIEWPORT_FIT_PADDING,
    maxZoom: VIEWPORT_FIT_MAX_ZOOM
  })
}

function updateViewportRect() {
  if (!minimap) return

  const bounds = props.viewBounds
  if (!bounds) return

  const rectBounds = L.latLngBounds(
    [bounds.south, bounds.west],
    [bounds.north, bounds.east]
  )

  if (viewportRect) {
    viewportRect.setBounds(rectBounds)
  } else {
    viewportRect = L.rectangle(rectBounds, {
      color: '#7dd3fc',
      weight: 2.6,
      fillColor: '#38bdf8',
      fillOpacity: 0.24,
      dashArray: '6 4',
      interactive: false,
      className: 'minimap-viewport-rect'
    }).addTo(minimap)
  }

  syncViewportCoverage(rectBounds)
  viewportRect.bringToFront()
}

let currentBasemapLayer = null

function createSatelliteLayer() {
  if (tdtToken) {
    const imgLayer = L.tileLayer(
      `https://t{s}.tianditu.gov.cn/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&style=default&tilematrixset=w&FORMAT=tiles&TileMatrix={z}&TileRow={y}&TileCol={x}&tk=${tdtToken}`,
      { subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'], maxZoom: 18 }
    )
    const labelLayer = L.tileLayer(
      `https://t{s}.tianditu.gov.cn/cia_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cia&style=default&tilematrixset=w&FORMAT=tiles&TileMatrix={z}&TileRow={y}&TileCol={x}&tk=${tdtToken}`,
      { subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'], maxZoom: 18 }
    )

    return L.layerGroup([imgLayer, labelLayer])
  }

  return L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { maxZoom: 18 }
  )
}

function applyBasemap(basemapId) {
  if (!minimap) return
  if (currentBasemapLayer) {
    minimap.removeLayer(currentBasemapLayer)
    currentBasemapLayer = null
  }

  if (basemapId === 'satellite') {
    currentBasemapLayer = createSatelliteLayer().addTo(minimap)
  } else if (basemapId === 'dark') {
    currentBasemapLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png', {
      subdomains: ['a', 'b', 'c', 'd'],
      maxZoom: 18,
      opacity: 0.7
    }).addTo(minimap)
  } else {
    currentBasemapLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
      subdomains: ['a', 'b', 'c', 'd'],
      maxZoom: 18,
      opacity: 0.7
    }).addTo(minimap)
  }

  // 确保区域轮廓和视口矩形在底图之上
  if (regionLayer) regionLayer.bringToFront()
  if (viewportRect) viewportRect.bringToFront()
}

watch(() => props.viewBounds, () => {
  updateViewportRect()
}, { deep: true })

watch(() => props.basemap, (newBasemap) => {
  applyBasemap(newBasemap)
})

watch(isCollapsed, (collapsed) => {
  emit('collapse-change', collapsed)
  if (!collapsed) {
    nextTick(() => {
      if (minimap) {
        minimap.invalidateSize()
        updateViewportRect()
        syncViewportCoverage(viewportRect?.getBounds?.())
      } else {
        initMinimap()
      }
    })
  }
})

onMounted(() => {
  nextTick(() => initMinimap())
})

onUnmounted(() => {
  if (minimap) {
    minimap.remove()
    minimap = null
  }
  viewportRect = null
  regionLayer = null
})
</script>

<style scoped>
.minimap-container {
  width: 100%;
  height: 140px;
  border-radius: 0;
  overflow: hidden;
  position: relative;
  border: 2px solid rgba(56, 189, 248, 0.48);
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(12px) saturate(1.1);
  -webkit-backdrop-filter: blur(12px) saturate(1.1);
  box-shadow:
    0 10px 30px rgba(2, 8, 23, 0.36),
    0 0 0 1px rgba(186, 230, 253, 0.22) inset,
    0 0 0 1px rgba(2, 132, 199, 0.18);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: default;
}

.minimap-container:hover {
  border-color: rgba(125, 211, 252, 0.78);
  box-shadow:
    0 14px 34px rgba(2, 8, 23, 0.42),
    0 0 0 1px rgba(125, 211, 252, 0.3) inset,
    0 0 24px rgba(14, 165, 233, 0.18);
}

.minimap-container.collapsed {
  width: var(--minimap-collapsed-size, 36px);
  height: 36px;
  border-radius: 0;
  cursor: pointer;
}

.minimap-toggle {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 10;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.65);
  color: rgba(255, 255, 255, 0.7);
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.18s ease;
  opacity: 0;
  pointer-events: none;
}

.minimap-container:hover .minimap-toggle {
  opacity: 1;
  pointer-events: auto;
}

.minimap-container.collapsed .minimap-toggle {
  display: none;
}

.minimap-toggle:hover {
  background: rgba(14, 165, 233, 0.5);
  color: #fff;
}

.minimap-leaflet {
  width: 100%;
  height: 100%;
}

.minimap-leaflet :deep(.leaflet-tile-pane) {
  filter: brightness(0.85) contrast(1.1);
}

.minimap-collapsed-label {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
}

.minimap-collapsed-label:hover {
  color: rgba(56, 189, 248, 0.85);
}

/* 视口矩形动画 */
:deep(.minimap-viewport-rect) {
  animation: viewport-pulse 3s ease-in-out infinite;
}

@keyframes viewport-pulse {
  0%, 100% {
    stroke-opacity: 1;
    fill-opacity: 0.2;
  }
  50% {
    stroke-opacity: 0.78;
    fill-opacity: 0.28;
  }
}

/* 小地图标注上方的标题 */
.minimap-container::before {
  content: '全局视图';
  position: absolute;
  bottom: 4px;
  left: 0;
  right: 0;
  z-index: 5;
  text-align: center;
  font-size: 9px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.45);
  letter-spacing: 0.05em;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.minimap-container.collapsed::before {
  display: none;
}

@media (max-width: 1440px) {
  .minimap-container {
    height: 120px;
  }
}
</style>
