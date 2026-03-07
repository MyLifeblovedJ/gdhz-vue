<template>
  <section class="map-stage">
    <div ref="mapContainer" class="map-container"></div>
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  Camera,
  Cartesian3,
  Color,
  createWorldTerrainAsync,
  IonImageryProvider,
  OpenStreetMapImageryProvider,
  UrlTemplateImageryProvider,
  VerticalOrigin,
  WebMercatorTilingScheme,
  SceneMode,
  Viewer
} from 'cesium'

const props = defineProps({
  mapMode: {
    type: String,
    default: '3D'
  },
  basemapId: {
    type: String,
    default: 'satellite'
  },
  cityWarnings: {
    type: Array,
    default: () => []
  },
  warningSpec: {
    type: Object,
    default: () => ({
      zoomBoundaryKm: 150,
      iconMap: {}
    })
  }
})

const mapContainer = ref(null)
let viewer = null
const warningEntities = new Map()
const iconLoadCache = new Map()
let cameraChangedHandler = null
let renderToken = 0
const tdtToken = import.meta.env.VITE_TIANDITU_TOKEN

function buildTiandituProvider(layerCode) {
  return new UrlTemplateImageryProvider({
    url: `https://t{s}.tianditu.gov.cn/${layerCode}_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=${layerCode}&style=default&tilematrixset=w&FORMAT=tiles&TileMatrix={z}&TileRow={y}&TileCol={x}&tk=${tdtToken}`,
    subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
    tilingScheme: new WebMercatorTilingScheme(),
    maximumLevel: 18
  })
}

async function mountImageryLayers(basemapId) {
  if (!viewer) {
    return
  }

  viewer.imageryLayers.removeAll()

  // 参考原项目模式：基于 basemap id 进行底图切换。
  const basemapLoaders = {
    satellite: async () => {
      // 优先使用天地图卫星影像（img_w）+ 标注（cia_w）。
      if (tdtToken) {
        const imagery = buildTiandituProvider('img')
        const label = buildTiandituProvider('cia')
        viewer.imageryLayers.addImageryProvider(imagery)
        viewer.imageryLayers.addImageryProvider(label)
        return true
      }

      const fallback = await IonImageryProvider.fromAssetId(2)
      viewer.imageryLayers.addImageryProvider(fallback)
      return true
    },
    dark: async () => {
      const dark = new UrlTemplateImageryProvider({
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c', 'd']
      })
      viewer.imageryLayers.addImageryProvider(dark)
      return true
    },
    ocean: async () => {
      const ocean = new UrlTemplateImageryProvider({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}'
      })
      viewer.imageryLayers.addImageryProvider(ocean)
      return true
    }
  }

  try {
    if (basemapLoaders[basemapId]) {
      await basemapLoaders[basemapId]()
      return
    }
  } catch (error) {
    // 指定底图失败时继续走统一兜底。
  }

  const fallbackProviders = [
    () =>
      new UrlTemplateImageryProvider({
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c']
      }),
    () =>
      new OpenStreetMapImageryProvider({
        url: 'https://tile.openstreetmap.org/'
      }),
    () => IonImageryProvider.fromAssetId(2)
  ]

  for (const createProvider of fallbackProviders) {
    try {
      const provider = await createProvider()
      viewer.imageryLayers.addImageryProvider(provider)
      return
    } catch (error) {
      // 单个底图失败时继续尝试下一个源。
    }
  }
}

function getLevelColor(level) {
  const colorMap = {
    red: '#ef4444',
    orange: '#f97316',
    yellow: '#eab308',
    blue: '#3b82f6',
    info: '#38bdf8'
  }
  return Color.fromCssColorString(colorMap[level] || '#38bdf8')
}

function getZoomBoundaryMeters() {
  const km = Number(props.warningSpec?.zoomBoundaryKm)
  if (Number.isFinite(km) && km > 0) {
    return km * 1000
  }
  return 150000
}

function getCameraHeight() {
  if (!viewer) {
    return Number.MAX_SAFE_INTEGER
  }

  return viewer.camera.positionCartographic?.height || Number.MAX_SAFE_INTEGER
}

function getIconUrl(type, level) {
  const typeIcons = props.warningSpec?.iconMap?.[type]
  if (!typeIcons) {
    return ''
  }

  return typeIcons[level] || typeIcons.info || ''
}

async function checkImageAvailable(url) {
  if (!url || typeof window === 'undefined') {
    return false
  }

  if (iconLoadCache.has(url)) {
    return iconLoadCache.get(url)
  }

  const loaded = await new Promise((resolve) => {
    const img = new window.Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = url
  })

  iconLoadCache.set(url, loaded)
  return loaded
}

function clearWarningEntities() {
  if (!viewer) {
    warningEntities.clear()
    return
  }

  for (const entry of warningEntities.values()) {
    viewer.entities.remove(entry.border)
    viewer.entities.remove(entry.fill)
    viewer.entities.remove(entry.icon)
    viewer.entities.remove(entry.fallbackDot)
  }

  warningEntities.clear()
}

function applyZoomVisibility() {
  const showRich = getCameraHeight() > getZoomBoundaryMeters()
  for (const entry of warningEntities.values()) {
    if (entry.fill) {
      entry.fill.show = showRich
    }

    if (entry.icon) {
      entry.icon.show = showRich
    }

    if (entry.fallbackDot) {
      entry.fallbackDot.show = showRich
    }
  }
}

async function renderWarningEntities() {
  if (!viewer) {
    return
  }

  const token = ++renderToken
  clearWarningEntities()

  const cityWarnings = props.cityWarnings || []
  for (const cityWarning of cityWarnings) {
    if (token !== renderToken) {
      return
    }

    const boundary = cityWarning.boundary || []
    if (boundary.length < 3) {
      continue
    }

    const dominant = cityWarning.dominantWarning || {}
    const lineColor = getLevelColor(dominant.level)
    const boundaryPath = boundary.concat([boundary[0]])
    const border = viewer.entities.add({
      polyline: {
        positions: Cartesian3.fromDegreesArray(boundaryPath.flat()),
        width: 2.6,
        material: lineColor
      }
    })

    const fill = viewer.entities.add({
      polygon: {
        hierarchy: Cartesian3.fromDegreesArray(boundary.flat()),
        material: lineColor.withAlpha(0.28),
        outline: false
      }
    })

    const center = cityWarning.center || []
    let icon = null
    let fallbackDot = null
    if (center.length === 2) {
      const iconUrl = getIconUrl(dominant.disasterType, dominant.level)
      const hasIcon = await checkImageAvailable(iconUrl)

      if (token !== renderToken) {
        return
      }

      if (hasIcon) {
        icon = viewer.entities.add({
          position: Cartesian3.fromDegrees(center[0], center[1], 600),
          billboard: {
            image: iconUrl,
            scale: 0.5,
            verticalOrigin: VerticalOrigin.BOTTOM
          }
        })
      } else {
        // 图标资源缺失时回退圆点，保障地图中心标识可见。
        fallbackDot = viewer.entities.add({
          position: Cartesian3.fromDegrees(center[0], center[1], 600),
          point: {
            pixelSize: 10,
            color: lineColor,
            outlineColor: Color.WHITE,
            outlineWidth: 1
          }
        })
      }
    }

    warningEntities.set(cityWarning.cityCode, {
      border,
      fill,
      icon,
      fallbackDot
    })
  }

  applyZoomVisibility()
}

// 初始化 Cesium，关闭非必要控件，突出地图主舞台。
async function initViewer() {
  if (!mapContainer.value) {
    return
  }

  let terrainProvider
  try {
    terrainProvider = await createWorldTerrainAsync()
  } catch (error) {
    // 地形服务异常时继续使用平面底图，避免页面不可用。
    terrainProvider = undefined
  }

  viewer = new Viewer(mapContainer.value, {
    geocoder: false,
    homeButton: false,
    timeline: false,
    animation: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    baseLayerPicker: false,
    fullscreenButton: false,
    infoBox: false,
    selectionIndicator: false,
    terrainProvider: terrainProvider || undefined
  })

  viewer.cesiumWidget.creditContainer.style.display = 'none'
  viewer.scene.skyAtmosphere.hueShift = 0.03
  viewer.scene.skyAtmosphere.saturationShift = -0.15
  viewer.scene.skyAtmosphere.brightnessShift = -0.2
  viewer.scene.globe.baseColor = Color.fromCssColorString('#061629')
  viewer.scene.globe.depthTestAgainstTerrain = true

  await mountImageryLayers(props.basemapId)

  Camera.DEFAULT_VIEW_RECTANGLE = undefined
  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(113.5, 22.5, 1500000)
  })

  cameraChangedHandler = () => {
    applyZoomVisibility()
  }
  viewer.camera.changed.addEventListener(cameraChangedHandler)

  applyMapMode(props.mapMode)
  await renderWarningEntities()
}

function applyMapMode(mode) {
  if (!viewer) {
    return
  }

  if (mode === '2D' && viewer.scene.mode !== SceneMode.SCENE2D) {
    viewer.scene.morphTo2D(0.5)
  }

  if (mode === '3D' && viewer.scene.mode !== SceneMode.SCENE3D) {
    viewer.scene.morphTo3D(0.6)
  }
}

onMounted(() => {
  initViewer()
})

watch(
  () => props.mapMode,
  (mode) => {
    applyMapMode(mode)
  }
)

watch(
  () => props.basemapId,
  async (basemapId) => {
    await mountImageryLayers(basemapId)
  }
)

watch(
  () => props.cityWarnings,
  async () => {
    await renderWarningEntities()
  },
  { deep: true }
)

watch(
  () => props.warningSpec,
  async () => {
    await renderWarningEntities()
  },
  { deep: true }
)

onBeforeUnmount(() => {
  if (viewer) {
    if (cameraChangedHandler) {
      viewer.camera.changed.removeEventListener(cameraChangedHandler)
      cameraChangedHandler = null
    }

    clearWarningEntities()
    viewer.destroy()
    viewer = null
  }
})
</script>
