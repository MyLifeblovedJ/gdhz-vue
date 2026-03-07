<template>
  <div ref="mapAreaRef" class="map-area" :class="{ fullscreen: props.fullscreen }">
    <div ref="mapRef" class="map-container leaflet-stage" :class="{ active: is2DMode }"></div>
    <div ref="cesiumRef" class="map-container cesium-stage" :class="{ active: is3DMode }"></div>

    <canvas
      v-show="layerVisibility.wind_particle && is2DMode"
      ref="windCanvas"
      class="wind-canvas"
    ></canvas>

    <canvas
      v-show="layerVisibility.wave_heatmap && is2DMode"
      ref="waveCanvas"
      class="wave-canvas"
    ></canvas>

    <div class="map-ui-overlay">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import { useAppStore } from '../../stores/app'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Cartesian3,
  Cartesian2,
  Color,
  Math as CesiumMath,
  OpenStreetMapImageryProvider,
  PolylineDashMaterialProperty,
  SceneTransforms,
  SceneMode,
  ScreenSpaceEventType,
  SkyBox,
  UrlTemplateImageryProvider,
  WebMercatorTilingScheme,
  Viewer,
  Ion
} from 'cesium'

// 鏍稿績閰嶇疆锛氬交搴曠鎺?Cesium 瀵硅繙绔?Ion 鏈嶅姟鐨勪换浣曞皾璇曪紝闃叉璧勬簮鍔犺浇澶辫触鎶ラ敊
Ion.defaultAccessToken = ''

import { basemaps as basemapConfig } from '../../data/mockData'
import { deviceTypeConfig } from '../../data/deviceConfig'
import { buildMapRenderSpec } from '../../utils/mapRenderSpec'
import guangdongGeo from '../../data/guangdong_geo.json'
import gdCityBoundaryGeo from '../../data/GDSJXZQH.json'
import gdProvinceLineGeo from '../../data/广东省line.json'

const props = defineProps({
  center: {
    type: Array,
    default: () => [22.0, 114.0]
  },
  zoom: {
    type: Number,
    default: 8
  },
  currentBasemap: {
    type: String,
    default: 'dark'
  },
  mapMode: {
    type: String,
    default: '3D'
  },
  fullscreen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['map-ready', 'device-click'])

const store = useAppStore()
const mapAreaRef = ref(null)
const mapRef = ref(null)
const cesiumRef = ref(null)
const windCanvas = ref(null)
const waveCanvas = ref(null)

let map = null
let viewer = null
let basemapLayers = {}
let markerLayers = {}
let markers = {}
let deviceEntities3D = []
let typhoonLayer = null
let typhoonEntities3D = []
let vesselLayer = null
let vesselEntities3D = []
let spinningBillboards3D = []
let spinBillboardRaf = 0
let windAnimationFrame = null
let waveAnimationFrame = null
let isSwitchingBasemap = false
let provinceBoundaryLayer2D = null
let provinceBoundaryEntities3D = []
let cityWarningBoundaryLayer2D = null
let cityWarningBoundaryEntities3D = []
let coastalCityLabelLayer2D = null
let coastalCityLabelEntities3D = []
let countyBoundaryLayer2D = null
let countyLabelLayer2D = null
let mapZoomLevelHandler = null
let countyBoundaryEntities3D = []
let countyLabelEntities3D = []
let viewerCameraMoveEndHandler = null
let gdCountyBoundaryData = null
let countyBoundaryLoadingPromise = null
let countyRenderItems = []
let countyBoundariesRendered2D = false
let countyLabelsRendered2D = false
let countyBoundariesRendered3D = false
let countyLabelsRendered3D = false
let viewerScenePostRenderHandler = null
let cesiumHoverPickRaf = 0
let pendingCesiumHoverPosition = null
let lastCesiumFrameUpdate = 0
const CITY_WARNING_PANE = 'city-warning-pane'
const PROVINCE_BOUNDARY_PANE = 'province-boundary-pane'
const COUNTY_BOUNDARY_PANE = 'county-boundary-pane'
const COUNTY_LABEL_PANE = 'county-label-pane'
const COUNTY_BOUNDARY_MIN_ZOOM = 9
const COUNTY_LABEL_MIN_ZOOM = 10
const COUNTY_BOUNDARY_MAX_HEIGHT_3D = 800000
const COUNTY_LABEL_MAX_HEIGHT_3D = 500000

const THREE_D_VIEW_PRESETS = {
  decision: {
    key: 'decision',
    label: '当前视角',
    destination: { lng: 112.3, lat: 11.9, height: 1080000 },
    orientation: {
      heading: CesiumMath.toRadians(4),
      pitch: CesiumMath.toRadians(-46),
      roll: 0
    }
  },
  legacy5173: {
    key: 'legacy5173',
    label: '5173视角',
    destination: { lng: 113.5, lat: 22.5, height: 1500000 },
    orientation: null
  }
}
const DEFAULT_3D_PRESET_KEY = 'decision'
const active3DViewPresetKey = ref(DEFAULT_3D_PRESET_KEY)

const currentMapMode = computed(() => props.mapMode || store.mapMode || '3D')
const is2DMode = computed(() => currentMapMode.value === '2D')
const is3DMode = computed(() => currentMapMode.value === '3D')

// 鍥惧眰鍙鎬?
const layerVisibility = computed(() => store.layerVisibility)
const typhoonData = computed(() => store.typhoonData)
const vesselData = computed(() => store.vesselData)
const mapRenderSpec = computed(() => buildMapRenderSpec({
  devices: store.devices,
  typhoonData: typhoonData.value,
  vessels: vesselData.value,
  layerVisibility: layerVisibility.value
}))

// 鍏ㄥ眬鍙橀噺鍖烘坊鍔?
let highlightLayer = null

function createOverlayState() {
  return {
    visible: false,
    html: '',
    x: 0,
    y: 0,
    position: null,
    entityId: null
  }
}

const cesiumHoverOverlay = ref(createOverlayState())
const cesiumPopupOverlay = ref(createOverlayState())

// 椋庨櫓浣嶇疆鏄犲皠锛堝吋瀹圭己澶辩粡绾害鐨勬棫鏁版嵁锛?
const riskLocationMap = {
  '鐝犳捣棣欐床娈?': [22.28, 113.58],
  '涓北娌挎捣浣庢醇鍦板尯': [22.5, 113.5],
  '鐝犳睙鍙ｆ捣鍩?': [22.1, 113.7],
  '闃虫睙娴烽櫟宀?': [21.58, 111.85],
  '婀涙睙娓尯': [21.18, 110.42],
  '鐝犳睙鍙ｅ娴峰煙': [21.8, 113.8]
}

// 鍒濆鍖栧湴鍥鹃鑹?
const MAP_COLORS = {
  risk: '#df5d6a',
  riskDeep: '#cf4b59',
  forecast: '#d9973a',
  windBlue: '#5a91d8',
  textBright: '#d7e3ef',
  vesselWarn: '#d9973a',
  vesselNormal: '#53b07e'
}

const tdtToken = import.meta.env.VITE_TIANDITU_TOKEN || ''

function buildTiandituProvider(layerCode) {
  return new UrlTemplateImageryProvider({
    url: `https://t{s}.tianditu.gov.cn/${layerCode}_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=${layerCode}&style=default&tilematrixset=w&FORMAT=tiles&TileMatrix={z}&TileRow={y}&TileCol={x}&tk=${tdtToken}`,
    subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
    tilingScheme: new WebMercatorTilingScheme(),
    maximumLevel: 18
  })
}

function getGeometryPolygons(geometry) {
  if (!geometry) return []
  if (geometry.type === 'Polygon') return [geometry.coordinates]
  if (geometry.type === 'MultiPolygon') return geometry.coordinates
  return []
}

function getLinePaths(geojson) {
  const paths = []
  if (!geojson?.features?.length) return paths
  geojson.features.forEach((feature) => {
    const geometry = feature.geometry
    if (!geometry) return
    if (geometry.type === 'LineString') {
      paths.push(geometry.coordinates)
      return
    }
    if (geometry.type === 'MultiLineString') {
      geometry.coordinates.forEach(line => paths.push(line))
    }
  })
  return paths
}

const GD_PROVINCE_LINE_PATHS = getLinePaths(gdProvinceLineGeo)

const WARNING_LEVEL_STYLE = {
  red: { fill: '#FF4D4F', fillOpacity: 0.55 },
  orange: { fill: '#FF9C6E', fillOpacity: 0.55 },
  yellow: { fill: '#FADB14', fillOpacity: 0.55 },
  blue: { fill: '#1677FF', fillOpacity: 0.55 }
}
const WARNING_CITY_BORDER_COLOR = '#777777'

const WARNING_LEVEL_WEIGHT = {
  red: 4,
  orange: 3,
  yellow: 2,
  blue: 1
}

const COASTAL_CITY_NAMES = new Set([
  '潮州市',
  '汕头市',
  '揭阳市',
  '汕尾市',
  '惠州市',
  '深圳市',
  '东莞市',
  '广州市',
  '中山市',
  '珠海市',
  '江门市',
  '阳江市',
  '茂名市',
  '湛江市'
])
const COASTAL_CITY_DISPLAY_NAMES = new Set(Array.from(COASTAL_CITY_NAMES).map(name => name.replace(/市$/, '')))

function extractStormSurgeCityLevels() {
  const cityLevelMap = new Map()
  const alerts = Array.isArray(store.alerts) ? store.alerts : []

  alerts.forEach((alert) => {
    if (alert?.type !== 'surge') return
    const match = String(alert.title || '').match(/^(.+?)风暴潮/)
    if (!match) return
    const cityName = match[1].trim()
    const level = alert.level
    if (!WARNING_LEVEL_STYLE[level]) return
    const prev = cityLevelMap.get(cityName)
    if (!prev || (WARNING_LEVEL_WEIGHT[level] > WARNING_LEVEL_WEIGHT[prev])) {
      cityLevelMap.set(cityName, level)
    }
  })

  return cityLevelMap
}

function ringSignedArea(ring) {
  if (!Array.isArray(ring) || ring.length < 3) return 0
  let sum = 0
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i]
    const [x2, y2] = ring[(i + 1) % ring.length]
    sum += (x1 * y2 - x2 * y1)
  }
  return sum / 2
}

function ringCentroid(ring) {
  const area = ringSignedArea(ring)
  if (Math.abs(area) < 1e-10) {
    const sum = ring.reduce((acc, [x, y]) => {
      acc.x += x
      acc.y += y
      return acc
    }, { x: 0, y: 0 })
    return [sum.x / ring.length, sum.y / ring.length]
  }
  let cx = 0
  let cy = 0
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i]
    const [x2, y2] = ring[(i + 1) % ring.length]
    const f = (x1 * y2 - x2 * y1)
    cx += (x1 + x2) * f
    cy += (y1 + y2) * f
  }
  const k = 1 / (6 * area)
  return [cx * k, cy * k]
}

function getPrimaryOuterRing(feature) {
  const polygons = getGeometryPolygons(feature?.geometry)
  let bestRing = null
  let maxAbsArea = 0
  polygons.forEach((polygonCoords) => {
    const outerRing = polygonCoords?.[0]
    if (!outerRing || outerRing.length < 3) return
    const absArea = Math.abs(ringSignedArea(outerRing))
    if (absArea > maxAbsArea) {
      maxAbsArea = absArea
      bestRing = outerRing
    }
  })
  return bestRing
}

function pointInRing(lng, lat, ring) {
  if (!Array.isArray(ring) || ring.length < 3) return false
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0]
    const yi = ring[i][1]
    const xj = ring[j][0]
    const yj = ring[j][1]
    const intersect = ((yi > lat) !== (yj > lat))
      && (lng < (xj - xi) * (lat - yi) / ((yj - yi) || Number.EPSILON) + xi)
    if (intersect) inside = !inside
  }
  return inside
}

function pointInPolygonWithHoles(lng, lat, polygonCoords) {
  const outerRing = polygonCoords?.[0]
  if (!outerRing || !pointInRing(lng, lat, outerRing)) return false
  for (let i = 1; i < polygonCoords.length; i++) {
    if (pointInRing(lng, lat, polygonCoords[i])) return false
  }
  return true
}

function isPointInFeature(lng, lat, feature) {
  const polygons = getGeometryPolygons(feature?.geometry)
  return polygons.some((polygonCoords) => pointInPolygonWithHoles(lng, lat, polygonCoords))
}

function getCoastalCityLabelData() {
  const labels = []
  gdCityBoundaryGeo?.features?.forEach((feature) => {
    const cityName = feature?.properties?.Name || feature?.properties?.name
    if (!COASTAL_CITY_NAMES.has(cityName)) return
    const ring = getPrimaryOuterRing(feature)
    if (!ring) return
    const [lng, lat] = ringCentroid(ring)
    labels.push({
      cityName,
      displayName: cityName.replace(/市$/, ''),
      lng,
      lat
    })
  })
  return labels
}

function renderCoastalCityLabels2D() {
  if (!map || !coastalCityLabelLayer2D) return
  coastalCityLabelLayer2D.clearLayers()
  const labels = getCoastalCityLabelData()
  labels.forEach((item) => {
    const marker = L.marker([item.lat, item.lng], {
      interactive: false,
      icon: L.divIcon({
        className: 'coastal-city-label',
        html: `<span>${item.displayName}</span>`,
        iconSize: [0, 0]
      })
    })
    marker.addTo(coastalCityLabelLayer2D)
  })
}

function renderCoastalCityLabels3D() {
  if (!viewer) return
  coastalCityLabelEntities3D.forEach(entity => viewer.entities.remove(entity))
  coastalCityLabelEntities3D = []
  const labels = getCoastalCityLabelData()
  labels.forEach((item) => {
    const entity = viewer.entities.add({
      position: Cartesian3.fromDegrees(item.lng, item.lat, 300),
      label: {
        text: item.displayName,
        font: 'bold 15px "Microsoft YaHei"',
        fillColor: Color.fromCssColorString('#ffffff'),
        outlineColor: Color.fromCssColorString('#111827'),
        outlineWidth: 3,
        style: 2,
        showBackground: true,
        backgroundColor: Color.fromCssColorString('rgba(11, 16, 32, 0.45)'),
        pixelOffset: new Cartesian2(0, -8),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    })
    coastalCityLabelEntities3D.push(entity)
  })
}

function getCountyDisplayName(feature) {
  const props = feature?.properties || {}
  return (
    props.Name ||
    props.name ||
    props.NAME ||
    props.qxmc ||
    props.QXMC ||
    props.county ||
    props.COUNTY ||
    ''
  )
}

function normalizeCountyLabel(name) {
  return String(name || '').replace(/市$/, '').trim()
}

function isCoastalCountyByCentroid(lng, lat) {
  return gdCityBoundaryGeo?.features?.some((cityFeature) => {
    const cityName = cityFeature?.properties?.Name || cityFeature?.properties?.name
    if (!COASTAL_CITY_NAMES.has(cityName)) return false
    return isPointInFeature(lng, lat, cityFeature)
  }) || false
}

function buildCountyRenderItems() {
  const features = gdCountyBoundaryData?.features || []
  countyRenderItems = features.map((feature) => {
    const ring = getPrimaryOuterRing(feature)
    if (!ring) return null
    const [lng, lat] = ringCentroid(ring)
    const rawName = getCountyDisplayName(feature)
    const labelName = normalizeCountyLabel(rawName)
    const isDuplicateCityLabel = COASTAL_CITY_DISPLAY_NAMES.has(labelName)
    return {
      feature,
      lng,
      lat,
      labelName,
      showLabel: Boolean(labelName) && !isDuplicateCityLabel,
      coastal: isCoastalCountyByCentroid(lng, lat)
    }
  }).filter(Boolean)
}

async function ensureCountyBoundaryDataLoaded() {
  if (gdCountyBoundaryData) return true
  if (!countyBoundaryLoadingPromise) {
    countyBoundaryLoadingPromise = import('../../data/GDQXXZQH.json')
      .then((mod) => {
        gdCountyBoundaryData = mod.default || mod
        buildCountyRenderItems()
        return true
      })
      .catch((error) => {
        console.error('Failed to load GDQXXZQH.json:', error)
        return false
      })
      .finally(() => {
        countyBoundaryLoadingPromise = null
      })
  }
  return countyBoundaryLoadingPromise
}

function renderCountyBoundaries2D() {
  if (!map || !countyBoundaryLayer2D) return
  countyBoundaryLayer2D.clearLayers()

  countyRenderItems.filter(item => item.coastal).forEach((item) => {
    const feature = item.feature
    const polygons = getGeometryPolygons(feature.geometry)
    polygons.forEach((polygonCoords) => {
      const rings = polygonCoords.map(ring => ring.map(([lng, lat]) => [lat, lng]))
      L.polygon(rings, {
        color: '#98a2b3',
        weight: 0.7,
        opacity: 0.9,
        fill: false,
        interactive: false,
        bubblingMouseEvents: false,
        pane: COUNTY_BOUNDARY_PANE
      }).addTo(countyBoundaryLayer2D)
    })
  })
  countyBoundariesRendered2D = true
}

function renderCountyLabels2D() {
  if (!map || !countyLabelLayer2D) return
  countyLabelLayer2D.clearLayers()

  countyRenderItems.filter(item => item.coastal && item.showLabel).forEach((item) => {
    L.marker([item.lat, item.lng], {
      interactive: false,
      pane: COUNTY_LABEL_PANE,
      icon: L.divIcon({
        className: 'county-label',
        html: `<span>${item.labelName}</span>`,
        iconSize: [0, 0]
      })
    }).addTo(countyLabelLayer2D)
  })
  countyLabelsRendered2D = true
}

async function applyCountyBoundaryVisibility2D() {
  if (!map || !countyBoundaryLayer2D || !countyLabelLayer2D) return
  if (!is2DMode.value) {
    countyBoundaryLayer2D.clearLayers()
    countyLabelLayer2D.clearLayers()
    countyBoundariesRendered2D = false
    countyLabelsRendered2D = false
    return
  }

  const zoom = map.getZoom()
  if (zoom < COUNTY_BOUNDARY_MIN_ZOOM) {
    countyBoundaryLayer2D.clearLayers()
    countyBoundariesRendered2D = false
  } else {
    const ok = await ensureCountyBoundaryDataLoaded()
    if (ok && !countyBoundariesRendered2D) renderCountyBoundaries2D()
  }

  if (zoom < COUNTY_LABEL_MIN_ZOOM) {
    countyLabelLayer2D.clearLayers()
    countyLabelsRendered2D = false
  } else {
    const ok = await ensureCountyBoundaryDataLoaded()
    if (ok && !countyLabelsRendered2D) renderCountyLabels2D()
  }
}

function renderCountyBoundaries3D() {
  if (!viewer) return
  if (countyBoundariesRendered3D) return
  if (!countyRenderItems.length) return
  countyBoundaryEntities3D.forEach(entity => viewer.entities.remove(entity))
  countyBoundaryEntities3D = []

  countyRenderItems.filter(item => item.coastal).forEach((item) => {
    const feature = item.feature
    const polygons = getGeometryPolygons(feature.geometry)
    polygons.forEach((polygonCoords) => {
      const outerRing = polygonCoords?.[0]
      if (!outerRing || outerRing.length < 3) return
      const degArray = []
      outerRing.forEach(([lng, lat]) => degArray.push(lng, lat))
      if (degArray.length < 6) return
      const entity = viewer.entities.add({
        polyline: {
          positions: Cartesian3.fromDegreesArray(degArray),
          width: 1.0,
          material: Color.fromCssColorString('#98a2b3').withAlpha(0.9)
        },
        show: false
      })
      countyBoundaryEntities3D.push(entity)
    })
  })
  countyBoundariesRendered3D = countyBoundaryEntities3D.length > 0
}

function renderCountyLabels3D() {
  if (!viewer) return
  if (countyLabelsRendered3D) return
  if (!countyRenderItems.length) return
  countyLabelEntities3D.forEach(entity => viewer.entities.remove(entity))
  countyLabelEntities3D = []

  countyRenderItems.filter(item => item.coastal && item.showLabel).forEach((item) => {
    const entity = viewer.entities.add({
      position: Cartesian3.fromDegrees(item.lng, item.lat, 120),
      label: {
        text: item.labelName,
        font: '600 12px "Microsoft YaHei"',
        fillColor: Color.fromCssColorString('#e5e7eb'),
        outlineColor: Color.fromCssColorString('#111827'),
        outlineWidth: 2,
        style: 2,
        showBackground: true,
        backgroundColor: Color.fromCssColorString('rgba(17, 24, 39, 0.32)'),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
      show: false
    })
    countyLabelEntities3D.push(entity)
  })
  countyLabelsRendered3D = countyLabelEntities3D.length > 0
}

async function applyCountyBoundaryVisibility3D() {
  if (!viewer) return
  if (!is3DMode.value) {
    countyBoundaryEntities3D.forEach(entity => { entity.show = false })
    countyLabelEntities3D.forEach(entity => { entity.show = false })
    return
  }

  const cameraHeight = viewer.camera?.positionCartographic?.height ?? Number.POSITIVE_INFINITY
  const showBoundary = cameraHeight <= COUNTY_BOUNDARY_MAX_HEIGHT_3D
  const showLabel = cameraHeight <= COUNTY_LABEL_MAX_HEIGHT_3D

  if ((showBoundary || showLabel) && !gdCountyBoundaryData) {
    const ok = await ensureCountyBoundaryDataLoaded()
    if (!ok) return
  }
  if (showBoundary) renderCountyBoundaries3D()
  if (showLabel) renderCountyLabels3D()

  countyBoundaryEntities3D.forEach(entity => { entity.show = showBoundary })
  countyLabelEntities3D.forEach(entity => { entity.show = showLabel })
}

function renderProvinceBoundary2D() {
  if (!map || !provinceBoundaryLayer2D) return
  provinceBoundaryLayer2D.clearLayers()

  GD_PROVINCE_LINE_PATHS.forEach((path) => {
    const latlngs = path.map(([lng, lat]) => [lat, lng])
    L.polyline(latlngs, {
      color: '#ffea00',
      weight: 2.5,
      opacity: 1,
      interactive: false,
      bubblingMouseEvents: false,
      pane: PROVINCE_BOUNDARY_PANE
    }).addTo(provinceBoundaryLayer2D)
  })
}

function renderProvinceBoundary3D() {
  if (!viewer) return

  provinceBoundaryEntities3D.forEach(entity => viewer.entities.remove(entity))
  provinceBoundaryEntities3D = []

  GD_PROVINCE_LINE_PATHS.forEach((path) => {
    const degArray = []
    path.forEach(([lng, lat]) => {
      degArray.push(lng, lat)
    })
    if (degArray.length < 4) return

    const entity = viewer.entities.add({
      polyline: {
        positions: Cartesian3.fromDegreesArray(degArray),
        width: 2.5,
        material: Color.fromCssColorString('#ffea00')
      }
    })
    provinceBoundaryEntities3D.push(entity)
  })
}

function renderCityWarningBoundaries2D() {
  if (!map || !cityWarningBoundaryLayer2D) return
  cityWarningBoundaryLayer2D.clearLayers()

  const cityLevelMap = extractStormSurgeCityLevels()
  if (!cityLevelMap.size) return

  gdCityBoundaryGeo?.features?.forEach((feature) => {
    const cityName = feature?.properties?.Name || feature?.properties?.name
    const level = cityLevelMap.get(cityName)
    const style = WARNING_LEVEL_STYLE[level]
    if (!style) return

    const polygons = getGeometryPolygons(feature.geometry)
    polygons.forEach((polygonCoords) => {
      const rings = polygonCoords.map(ring => ring.map(([lng, lat]) => [lat, lng]))
      L.polygon(rings, {
        color: 'transparent',
        weight: 0,
        opacity: 0,
        fillColor: style.fill,
        fillOpacity: style.fillOpacity,
        interactive: false,
        bubblingMouseEvents: false,
        pane: CITY_WARNING_PANE
      }).addTo(cityWarningBoundaryLayer2D)

      // 统一单色细边界：避免多色/双层描边造成视觉噪音
      const outerRing = rings[0]
      if (outerRing?.length > 2) {
        L.polyline(outerRing, {
          color: WARNING_CITY_BORDER_COLOR,
          weight: 0.8,
          opacity: 1,
          interactive: false,
          bubblingMouseEvents: false,
          pane: CITY_WARNING_PANE
        }).addTo(cityWarningBoundaryLayer2D)
      }
    })
  })
}

function renderCityWarningBoundaries3D() {
  if (!viewer) return

  cityWarningBoundaryEntities3D.forEach(entity => viewer.entities.remove(entity))
  cityWarningBoundaryEntities3D = []

  const cityLevelMap = extractStormSurgeCityLevels()
  if (!cityLevelMap.size) return

  gdCityBoundaryGeo?.features?.forEach((feature) => {
    const cityName = feature?.properties?.Name || feature?.properties?.name
    const level = cityLevelMap.get(cityName)
    const style = WARNING_LEVEL_STYLE[level]
    if (!style) return

    const polygons = getGeometryPolygons(feature.geometry)
    polygons.forEach((polygonCoords) => {
      const outerRing = polygonCoords?.[0]
      if (!outerRing || outerRing.length < 3) return
      const degArray = []
      outerRing.forEach(([lng, lat]) => {
        degArray.push(lng, lat)
      })
      if (degArray.length < 6) return
      const fillColor = Color.fromCssColorString(style.fill)
      const entity = viewer.entities.add({
        polygon: {
          hierarchy: Cartesian3.fromDegreesArray(degArray),
          material: fillColor.withAlpha(style.fillOpacity),
          outline: false
        }
      })
      cityWarningBoundaryEntities3D.push(entity)

      const edgeEntity = viewer.entities.add({
        polyline: {
          positions: Cartesian3.fromDegreesArray(degArray),
          width: 1.2,
          material: Color.fromCssColorString(WARNING_CITY_BORDER_COLOR).withAlpha(0.9)
        }
      })
      cityWarningBoundaryEntities3D.push(edgeEntity)
    })
  })
}

async function mountCesiumImagery(basemapId) {
  if (!viewer) return

  viewer.imageryLayers.removeAll()

  const loaders = {
    satellite: async () => {
      if (tdtToken) {
        try {
          const imagery = buildTiandituProvider('img')
          const labels = buildTiandituProvider('cia')
          viewer.imageryLayers.addImageryProvider(imagery)
          viewer.imageryLayers.addImageryProvider(labels)
          return
        } catch (e) {
          console.warn('Failed to load Tianditu, falling back to ArcGIS', e)
        }
      }
      viewer.imageryLayers.addImageryProvider(new UrlTemplateImageryProvider({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      }))
    },
    dark: async () => {
      viewer.imageryLayers.addImageryProvider(new UrlTemplateImageryProvider({
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c', 'd']
      }))
    },
    ocean: async () => {
      viewer.imageryLayers.addImageryProvider(new UrlTemplateImageryProvider({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}'
      }))
    }
  }

  try {
    if (loaders[basemapId]) {
      await loaders[basemapId]()
    }
  } catch (error) {
    console.error('Failed to load Cesium basemap:', basemapId, error)
    // 鏈€鍚庡厹搴曪細鍔犺浇 OSM
    try {
      viewer.imageryLayers.addImageryProvider(new OpenStreetMapImageryProvider({
        url: 'https://tile.openstreetmap.org/'
      }))
    } catch (f) {
      console.error('Final fallback failed', f)
    }
  }
}

function applyCesiumMapMode(mode) {
  if (!viewer) return

  if (mode === '2D' && viewer.scene.mode !== SceneMode.SCENE2D) {
    viewer.scene.morphTo2D(0.5)
  }

  if (mode === '3D') {
    if (viewer.scene.mode !== SceneMode.SCENE3D) {
      // 先切回 3D，再重复一次 welcome-5173 的飞入动画
      viewer.scene.morphTo3D(0.6)
      setTimeout(() => {
        if (currentMapMode.value !== '3D' || !viewer) return
        flyTo3DViewPreset(active3DViewPresetKey.value, 1.8)
      }, 680)
    } else {
      flyTo3DViewPreset(active3DViewPresetKey.value, 1.2)
    }
  }
}

function apply3DCameraConstraints() {
  if (!viewer) return
  const controller = viewer.scene?.screenSpaceCameraController
  if (!controller) return
  controller.enableRotate = true
  controller.enableTranslate = true
  controller.enableZoom = true
  controller.enableTilt = true
  controller.enableLook = true
}

function resolve3DViewPreset(presetKey) {
  return THREE_D_VIEW_PRESETS[presetKey] || THREE_D_VIEW_PRESETS[DEFAULT_3D_PRESET_KEY]
}

function flyTo3DViewPreset(presetKey = DEFAULT_3D_PRESET_KEY, duration = 1.8) {
  if (!viewer) return
  const preset = resolve3DViewPreset(presetKey)
  const flyToConfig = {
    destination: Cartesian3.fromDegrees(
      preset.destination.lng,
      preset.destination.lat,
      preset.destination.height
    ),
    duration
  }
  if (preset.orientation) {
    flyToConfig.orientation = preset.orientation
  }
  viewer.camera.flyTo(flyToConfig)
}

function switch3DViewPreset(presetKey) {
  const preset = resolve3DViewPreset(presetKey)
  active3DViewPresetKey.value = preset.key
  if (is3DMode.value) {
    flyTo3DViewPreset(preset.key, 1.2)
  }
}

function applyCesiumResolutionScale() {
  if (!viewer) return

  const pixelRatio = Number(window.devicePixelRatio || 1)
  const resolutionScale = Math.min(Math.max(pixelRatio, 1), 1.25)

  viewer.useBrowserRecommendedResolution = false
  viewer.resolutionScale = resolutionScale
  if (viewer.scene?.postProcessStages?.fxaa) {
    viewer.scene.postProcessStages.fxaa.enabled = false
  }
  viewer.scene?.requestRender?.()
}

function processCesiumHoverPick(position) {
  if (!viewer) return
  const meta = resolveCesiumMetaFromPick(viewer.scene?.pick(position))
  if (!meta?.hoverHtml) {
    resetCesiumHoverOverlay()
  } else {
    setCesiumHoverOverlay(meta)
  }
  if (viewer?.scene?.canvas) {
    viewer.scene.canvas.style.cursor = meta?.hoverHtml || meta?.popupHtml ? 'pointer' : 'default'
  }
}

async function initCesium() {
  if (!cesiumRef.value) return

  try {
    // 褰诲簳瑙ｉ櫎 Ion 渚濊禆锛屽湪鏋勯€犲嚱鏁颁腑灏变笉鍔犺浇浠讳綍榛樿灞?
    viewer = new Viewer(cesiumRef.value, {
      geocoder: false,
      homeButton: false,
      timeline: false,
      animation: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      baseLayerPicker: false,
      baseLayer: false, // 蹇呴』鏄惧紡璁句负 false 鎵嶈兘閬垮紑榛樿 Ion imagery 鍔犺浇
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      terrainProvider: undefined, // 鏄惧紡绂佺敤榛樿鍦板舰
      skyBox: false,
      skyAtmosphere: false
    })
    applyCesiumResolutionScale()

    if (viewer.cesiumWidget && viewer.cesiumWidget.creditContainer) {
      viewer.cesiumWidget.creditContainer.style.display = 'none'
    }

    // 显式配置星空盒锛屽吋瀹瑰綋鍓?Cesium 鐗堟본紝閬垮厤 skyBox:true 鐨勭被鍨嬮敊璇?
    viewer.scene.skyBox = new SkyBox({
      sources: {
        positiveX: '/cesium/Assets/Textures/SkyBox/tycho2t3_80_px.jpg',
        negativeX: '/cesium/Assets/Textures/SkyBox/tycho2t3_80_mx.jpg',
        positiveY: '/cesium/Assets/Textures/SkyBox/tycho2t3_80_py.jpg',
        negativeY: '/cesium/Assets/Textures/SkyBox/tycho2t3_80_my.jpg',
        positiveZ: '/cesium/Assets/Textures/SkyBox/tycho2t3_80_pz.jpg',
        negativeZ: '/cesium/Assets/Textures/SkyBox/tycho2t3_80_mz.jpg'
      }
    })
    viewer.scene.skyBox.show = true

    // 鎵嬪姩鎸変笟鍔￠€昏緫鍔犺浇搴曞浘
    await mountCesiumImagery(props.currentBasemap)
    apply3DCameraConstraints()
    renderCityWarningBoundaries3D()
    renderProvinceBoundary3D()
    renderCoastalCityLabels3D()
    applyCountyBoundaryVisibility3D()
    viewerCameraMoveEndHandler = () => applyCountyBoundaryVisibility3D()
    viewer.camera.moveEnd.addEventListener(viewerCameraMoveEndHandler)
    viewer.screenSpaceEventHandler.setInputAction((movement) => {
      const meta = resolveCesiumMetaFromPick(viewer?.scene?.pick(movement.position))
      if (!meta?.popupHtml) {
        closeCesiumPopup()
        return
      }
      setCesiumPopupOverlay(meta)
      if (meta.sourceType === 'device') {
        const device = store.devices.find(item => item.id === meta.sourceId)
        if (device) {
          emit('device-click', device)
        }
      }
      viewer.scene.requestRender()
    }, ScreenSpaceEventType.LEFT_CLICK)
    viewer.screenSpaceEventHandler.setInputAction((movement) => {
      pendingCesiumHoverPosition = movement.endPosition
      if (cesiumHoverPickRaf) return
      cesiumHoverPickRaf = requestAnimationFrame(() => {
        cesiumHoverPickRaf = 0
        if (!pendingCesiumHoverPosition) return
        processCesiumHoverPick(pendingCesiumHoverPosition)
        pendingCesiumHoverPosition = null
      })
    }, ScreenSpaceEventType.MOUSE_MOVE)
    viewerScenePostRenderHandler = () => {
      if (cesiumHoverOverlay.value.visible || cesiumPopupOverlay.value.visible) {
        updateCesiumOverlayPositions()
      }
    }
    viewer.scene.postRender.addEventListener(viewerScenePostRenderHandler)
    applyCesiumMapMode(currentMapMode.value)
    flyTo3DViewPreset(active3DViewPresetKey.value, 1.2)
    renderDevices3D()
    renderTyphoon()
    startSpinBillboardLoop()
    renderVessels()
  } catch (error) {
    console.error('Cesium Viewer initialization failed:', error)
  }
}

function initMap() {
  if (!mapRef.value) return

  map = L.map(mapRef.value, {
    center: props.center,
    zoom: props.zoom,
    preferCanvas: true,
    scrollWheelZoom: true,
    zoomSnap: 0.25,
    zoomDelta: 0.5,
    wheelDebounceTime: 60,
    wheelPxPerZoomLevel: 80,
    zoomControl: false,
    attributionControl: false
  })

  // 鍒涘缓鐗瑰畾鐨勫眰绾?Pane
  const markersPane = map.createPane('markers-pane');
  markersPane.style.zIndex = 610;
  
  const typhoonPane = map.createPane('typhoon-pane');
  typhoonPane.style.zIndex = 800; // 纭繚鍙伴鍦ㄦ渶椤跺眰
  typhoonPane.style.pointerEvents = 'auto';

  const cityWarningPane = map.createPane(CITY_WARNING_PANE)
  cityWarningPane.style.zIndex = 805
  cityWarningPane.style.pointerEvents = 'none'

  const provinceBoundaryPane = map.createPane(PROVINCE_BOUNDARY_PANE)
  provinceBoundaryPane.style.zIndex = 820
  provinceBoundaryPane.style.pointerEvents = 'none'

  const countyBoundaryPane = map.createPane(COUNTY_BOUNDARY_PANE)
  countyBoundaryPane.style.zIndex = 812
  countyBoundaryPane.style.pointerEvents = 'none'

  const countyLabelPane = map.createPane(COUNTY_LABEL_PANE)
  countyLabelPane.style.zIndex = 813
  countyLabelPane.style.pointerEvents = 'none'

  // 鍒涘缓搴曞浘鍥惧眰
  basemapConfig.forEach(config => {
    if (config.id === 'satellite' && tdtToken) {
      const satelliteLayer = L.tileLayer(
        `https://t{s}.tianditu.gov.cn/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&style=default&tilematrixset=w&FORMAT=tiles&TileMatrix={z}&TileRow={y}&TileCol={x}&tk=${tdtToken}`,
        {
          subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
          maxZoom: 18
        }
      )
      const labelLayer = L.tileLayer(
        `https://t{s}.tianditu.gov.cn/cia_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cia&style=default&tilematrixset=w&FORMAT=tiles&TileMatrix={z}&TileRow={y}&TileCol={x}&tk=${tdtToken}`,
        {
          subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
          maxZoom: 18
        }
      )
      basemapLayers[config.id] = L.layerGroup([satelliteLayer, labelLayer])
      return
    }
    basemapLayers[config.id] = L.tileLayer(config.url, { maxZoom: 19 })
  })

  // 娣诲姞榛樿搴曞浘
  basemapLayers[props.currentBasemap].addTo(map)

  // 鍒涘缓鏍囪鍥惧眰缁?
  Object.keys(deviceTypeConfig).forEach(type => {
    markerLayers[type] = L.layerGroup().addTo(map)
  })
  // 鍒涘缓楂樹寒鍥惧眰
  highlightLayer = L.layerGroup().addTo(map)
  cityWarningBoundaryLayer2D = L.layerGroup().addTo(map)
  provinceBoundaryLayer2D = L.layerGroup().addTo(map)
  coastalCityLabelLayer2D = L.layerGroup().addTo(map)
  countyBoundaryLayer2D = L.layerGroup().addTo(map)
  countyLabelLayer2D = L.layerGroup().addTo(map)
  renderCityWarningBoundaries2D()
  renderProvinceBoundary2D()
  renderCoastalCityLabels2D()
  applyCountyBoundaryVisibility2D()

  mapZoomLevelHandler = () => applyCountyBoundaryVisibility2D()
  map.on('zoomend', mapZoomLevelHandler)

  // 鍒涘缓鍙伴鍥惧眰
  typhoonLayer = L.layerGroup().addTo(map)

  // 鍒涘缓鑸硅埗鍥惧眰
  vesselLayer = L.layerGroup().addTo(map)

  emit('map-ready', map)
  
  // 鍒濆鍖朇anvas灏哄
  resizeCanvas()
}

// 娓叉煋椋庨櫓楂樹寒 (浠呴珮椋庨櫓)
function renderRiskHighlights() {
  if (!map || !highlightLayer) return
  highlightLayer.clearLayers()
  
  const risks = store.riskDecisions?.risks || []
  risks.forEach(risk => {
    if (risk.level === 'high') {
      const coord = riskLocationMap[risk.location]
      if (coord) {
        // 鍔ㄦ€佸懠鍚稿渾鍦?
        const circle = L.circle(coord, {
          color: MAP_COLORS.risk,
          fillColor: MAP_COLORS.risk,
          fillOpacity: 0.2,
          radius: 2000,
          className: 'risk-pulse-circle'
        })
        
        // 闂儊鐐?
        const marker = L.circleMarker(coord, {
          radius: 6,
          color: MAP_COLORS.textBright,
          fillColor: MAP_COLORS.risk,
          fillOpacity: 1,
          weight: 2,
          className: 'risk-pulse-marker'
        })
        
        highlightLayer.addLayer(circle)
        highlightLayer.addLayer(marker)
      }
    }
  })
}

// 瀹氫綅鍒伴闄╃偣
function flyToRisk(risk) {
  const coord = risk?.lat && risk?.lng
    ? [risk.lat, risk.lng]
    : riskLocationMap[risk?.location]
  if (coord) {
    if (is3DMode.value && viewer) {
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(coord[1], coord[0], 220000)
      })
      return
    }
    map?.flyTo(coord, 12, { duration: 1.5 })
    
    // 鍒涘缓涓€涓复鏃剁殑寮鸿仛鐒﹀姩鐢?
    const focusCircle = L.circleMarker(coord, {
      radius: 50, // 鍒濆澶у崐寰?
      color: 'transparent',
      fillColor: 'transparent',
      className: 'temp-focus-ring' // CSS鍔ㄧ敾鎺у埗鏀剁缉
    }).addTo(map)
    
    // 涓存椂鏍囪
    const popup = L.popup({ closeButton: false, closeOnClick: false })
      .setLatLng(coord)
      .setContent(`<div style="color:${MAP_COLORS.risk}; font-weight:bold;">鈿狅笍 ${risk.title}</div>`)
      .openOn(map)
      
    setTimeout(() => {
      map.removeLayer(focusCircle)
    }, 2000)
  }
}

function createLeafletImageIcon(item) {
  return L.icon({
    iconUrl: item.image,
    iconSize: [item.size, item.size],
    iconAnchor: [item.size / 2, item.size / 2],
    popupAnchor: [0, -Math.max(6, item.size / 2)],
    tooltipAnchor: [0, -Math.max(6, item.size / 2)],
    className: 'shared-map-icon'
  })
}

function createLeafletSpinningIcon(item) {
  return L.divIcon({
    className: 'typhoon-spinning-icon',
    html: `
      <div class="typhoon-svg-wrapper">
        <img src="${item.image}" width="${item.size}" height="${item.size}" alt="typhoon" style="${item.filter ? `filter:${item.filter};` : ''}" />
      </div>
    `,
    iconSize: [item.size, item.size],
    iconAnchor: [item.size / 2, item.size / 2]
  })
}

function toLeafletLatLngs(points = []) {
  return points.map(point => [point.lat, point.lng])
}

function toDegreesArray(points = [], closeLoop = false) {
  const source = closeLoop && points.length > 2 ? [...points, points[0]] : points
  return source.flatMap(point => [point.lng, point.lat])
}

function toDegreesArrayHeights(points = [], height = 0, closeLoop = false) {
  const source = closeLoop && points.length > 2 ? [...points, points[0]] : points
  return source.flatMap(point => [point.lng, point.lat, height])
}

function parseDashLength(dashArray) {
  const segments = String(dashArray || '')
    .split(',')
    .map(item => Number(item.trim()))
    .filter(value => Number.isFinite(value) && value > 0)
  if (!segments.length) return 16
  return segments.reduce((sum, value) => sum + value, 0)
}

function clearCesiumEntityCollection(collection) {
  if (!viewer || !collection.length) return
  collection.forEach(entity => viewer.entities.remove(entity))
  collection.length = 0
  viewer.scene.requestRender()
}

function buildCesiumAnchor(position, height = 160) {
  if (!position) return null
  return Cartesian3.fromDegrees(position.lng, position.lat, height)
}

function resetCesiumHoverOverlay() {
  cesiumHoverOverlay.value = createOverlayState()
  viewer?.scene?.requestRender()
}

function closeCesiumPopup() {
  cesiumPopupOverlay.value = createOverlayState()
  viewer?.scene?.requestRender()
}

function updateCesiumOverlayPosition(key) {
  if (!viewer) return
  const overlayRef = key === 'popup' ? cesiumPopupOverlay : cesiumHoverOverlay
  const overlay = overlayRef.value
  if (!overlay.visible || !overlay.position) return

  const projectToWindow = SceneTransforms.worldToWindowCoordinates || SceneTransforms.wgs84ToWindowCoordinates
  const windowPosition = projectToWindow
    ? projectToWindow(viewer.scene, overlay.position, new Cartesian2())
    : null
  if (!windowPosition) {
    overlayRef.value = { ...overlay, visible: false }
    return
  }

  const canvas = viewer.scene.canvas
  const scaleX = canvas.clientWidth / canvas.width
  const scaleY = canvas.clientHeight / canvas.height
  overlayRef.value = {
    ...overlay,
    x: windowPosition.x * scaleX,
    y: windowPosition.y * scaleY
  }
}

function updateCesiumOverlayPositions() {
  updateCesiumOverlayPosition('hover')
  updateCesiumOverlayPosition('popup')
}

function setCesiumHoverOverlay(meta) {
  if (!meta?.hoverHtml) {
    resetCesiumHoverOverlay()
    return
  }
  cesiumHoverOverlay.value = {
    visible: true,
    html: meta.hoverHtml,
    x: 0,
    y: 0,
    position: meta.position,
    entityId: meta.id
  }
  updateCesiumOverlayPosition('hover')
  viewer.scene.requestRender()
}

function setCesiumPopupOverlay(meta) {
  if (!meta?.popupHtml) {
    closeCesiumPopup()
    return
  }
  cesiumPopupOverlay.value = {
    visible: true,
    html: meta.popupHtml,
    x: 0,
    y: 0,
    position: meta.position,
    entityId: meta.id
  }
  updateCesiumOverlayPosition('popup')
  viewer.scene.requestRender()
}

function resolveCesiumMetaFromPick(picked) {
  const entity = picked?.id
  return entity?.renderMeta || null
}

function renderLeafletLine(layer, item) {
  layer.addLayer(L.polyline(toLeafletLatLngs(item.points), {
    color: item.style.color,
    weight: item.style.width,
    opacity: item.style.opacity,
    dashArray: item.style.dashArray,
    pane: 'typhoon-pane',
    interactive: false
  }))
}

function renderLeafletPolygon(layer, item) {
  layer.addLayer(L.polygon(toLeafletLatLngs(item.points), {
    color: item.style.strokeColor,
    weight: item.style.strokeWidth,
    opacity: item.style.strokeOpacity ?? 1,
    dashArray: item.style.dashArray,
    fillColor: item.style.fillColor,
    fillOpacity: item.style.fillOpacity,
    pane: 'typhoon-pane',
    interactive: false
  }))
}

function renderLeafletPointMarker(layer, item, { pane = 'markers-pane', zIndexOffset = 0, popup = true, tooltip = true } = {}) {
  const marker = L.marker([item.lat, item.lng], {
    icon: createLeafletImageIcon(item),
    pane,
    zIndexOffset
  })

  if (popup && item.popupHtml) {
    marker.bindPopup(item.popupHtml)
  }

  if (tooltip && item.hoverHtml) {
    marker.bindTooltip(item.hoverHtml, {
      className: 'typhoon-tooltip',
      direction: 'top',
      offset: [0, -(item.hoverOffsetY || 6)]
    })
  }

  return marker
}

function attachCesiumInteraction(entity, item, height = 160) {
  entity.renderMeta = {
    id: item.id,
    sourceId: item.sourceId,
    sourceType: item.sourceType,
    hoverHtml: item.hoverHtml || '',
    popupHtml: item.popupHtml || '',
    position: buildCesiumAnchor(item, height)
  }
  return entity
}

function renderCesiumBillboardPoint(collection, item, { height = 160, disableDepth = true } = {}) {
  if (!viewer) return null
  const entity = viewer.entities.add({
    position: buildCesiumAnchor(item, height),
    billboard: {
      image: item.image,
      width: item.size,
      height: item.size,
      color: Color.WHITE,
      disableDepthTestDistance: disableDepth ? Number.POSITIVE_INFINITY : undefined
    }
  })
  attachCesiumInteraction(entity, item, height)
  collection.push(entity)
  return entity
}

function renderCesiumLine(collection, item) {
  if (!viewer) return
  const baseColor = Color.fromCssColorString(item.style.color)
  const material = item.style.dashArray
    ? new PolylineDashMaterialProperty({
      color: baseColor.withAlpha(item.style.opacity ?? 1),
      dashLength: parseDashLength(item.style.dashArray)
    })
    : baseColor.withAlpha(item.style.opacity ?? 1)

  collection.push(viewer.entities.add({
    polyline: {
      positions: Cartesian3.fromDegreesArrayHeights(toDegreesArrayHeights(item.points, 30)),
      width: item.style.width,
      material
    }
  }))
}

function renderCesiumPolygon(collection, item) {
  if (!viewer) return
  const fillDegreeArray = toDegreesArrayHeights(item.points, 20)
  const outlineDegreeArray = toDegreesArrayHeights(item.points, 22, true)
  collection.push(viewer.entities.add({
    polygon: {
      hierarchy: Cartesian3.fromDegreesArrayHeights(fillDegreeArray),
      material: Color.fromCssColorString(item.style.fillColor).withAlpha(item.style.fillOpacity),
      perPositionHeight: true,
      outline: false
    }
  }))

  collection.push(viewer.entities.add({
    polyline: {
      positions: Cartesian3.fromDegreesArrayHeights(outlineDegreeArray),
      width: item.style.strokeWidth,
      material: item.style.dashArray
        ? new PolylineDashMaterialProperty({
          color: Color.fromCssColorString(item.style.strokeColor).withAlpha(item.style.strokeOpacity ?? 1),
          dashLength: parseDashLength(item.style.dashArray)
        })
        : Color.fromCssColorString(item.style.strokeColor).withAlpha(item.style.strokeOpacity ?? 1)
    }
  }))
}

function renderDevices2D() {
  if (!map) return

  Object.values(markerLayers).forEach(layer => layer.clearLayers())
  markers = {}

  mapRenderSpec.value.devices.forEach((item) => {
    const marker = renderLeafletPointMarker(null, item, { pane: 'markers-pane', tooltip: false })
    marker.on('click', () => {
      const device = store.devices.find(candidate => candidate.id === item.sourceId)
      if (device) emit('device-click', device)
    })

    const device = store.devices.find(candidate => candidate.id === item.sourceId)
    const layer = markerLayers[device?.type]
    if (layer) {
      layer.addLayer(marker)
    }
    markers[item.sourceId] = marker
  })
}

function renderDevices3D() {
  clearCesiumEntityCollection(deviceEntities3D)
  closeCesiumPopup()
  resetCesiumHoverOverlay()
  mapRenderSpec.value.devices.forEach((item) => {
    renderCesiumBillboardPoint(deviceEntities3D, item, { height: 180 })
  })
  viewer?.scene?.requestRender()
}

function renderDevices() {
  renderDevices2D()
  renderDevices3D()
}

function renderTyphoon() {
  if (typhoonLayer) {
    typhoonLayer.clearLayers()
  }
  clearCesiumEntityCollection(typhoonEntities3D)
  spinningBillboards3D = spinningBillboards3D.filter(item => item.group !== 'typhoon')
  closeCesiumPopup()
  resetCesiumHoverOverlay()

  const spec = mapRenderSpec.value.typhoon
  if (!layerVisibility.value.typhoon || (!spec.lines.length && !spec.polygons.length && !spec.points.length && !spec.markers.length)) {
    viewer?.scene?.requestRender()
    return
  }

  if (typhoonLayer) {
    spec.lines.forEach(item => renderLeafletLine(typhoonLayer, item))
    spec.polygons.forEach(item => renderLeafletPolygon(typhoonLayer, item))
    spec.points.forEach((item) => {
      typhoonLayer.addLayer(renderLeafletPointMarker(typhoonLayer, item, {
        pane: 'typhoon-pane',
        popup: false,
        tooltip: true
      }))
    })
    spec.markers.forEach((item) => {
      typhoonLayer.addLayer(L.marker([item.lat, item.lng], {
        icon: createLeafletSpinningIcon(item),
        pane: 'typhoon-pane',
        zIndexOffset: 1000,
        interactive: false
      }))
    })
  }

  spec.lines.forEach(item => renderCesiumLine(typhoonEntities3D, item))
  spec.polygons.forEach(item => renderCesiumPolygon(typhoonEntities3D, item))
  spec.points.forEach((item) => {
    renderCesiumBillboardPoint(typhoonEntities3D, item, { height: 220 })
  })
  spec.markers.forEach((item) => {
    const entity = renderCesiumBillboardPoint(typhoonEntities3D, item, { height: 260 })
    if (entity?.billboard) {
      spinningBillboards3D.push({ entity, group: 'typhoon' })
    }
  })
  viewer?.scene?.requestRender()
}

function renderVessels() {
  if (vesselLayer) {
    vesselLayer.clearLayers()
  }
  clearCesiumEntityCollection(vesselEntities3D)
  closeCesiumPopup()

  mapRenderSpec.value.vessels.forEach((item) => {
    if (vesselLayer) {
      vesselLayer.addLayer(renderLeafletPointMarker(vesselLayer, item, {
        pane: 'markers-pane',
        popup: true,
        tooltip: false
      }))
    }
    renderCesiumBillboardPoint(vesselEntities3D, item, { height: 150 })
  })
  viewer?.scene?.requestRender()
}

function getTyphoonPosition() {
  const track = typhoonData.value?.track
  if (track && track.length > 0) {
    return track[track.length - 1]
  }
  return { lat: 21.5, lng: 114.0 } 
}

// 椋庣矑瀛愬姩鐢?
function startWindAnimation() {
  if (!windCanvas.value || !map || is3DMode.value || !mapRef.value || mapRef.value.offsetWidth === 0) return
  
  if (windAnimationFrame) cancelAnimationFrame(windAnimationFrame)
  
  const ctx = windCanvas.value.getContext('2d')
  const width = windCanvas.value.width
  const height = windCanvas.value.height
  
  if (!layerVisibility.value.wind_particle) {
    ctx.clearRect(0, 0, width, height)
    return
  }

  const bounds = map.getBounds()
  const sw = bounds.getSouthWest(), ne = bounds.getNorthEast()
  const particles = []
  const numParticles = 1200
  const spanLat = ne.lat - sw.lat, spanLng = ne.lng - sw.lng
  
  for(let i=0; i<numParticles; i++){
    particles.push({
      lat: sw.lat - spanLat*0.5 + Math.random() * spanLat*2,
      lng: sw.lng - spanLng*0.5 + Math.random() * spanLng*2,
      age: Math.random() * 100
    })
  }

  function animate() {
    if (!map) return
    ctx.clearRect(0, 0, width, height)
    ctx.lineWidth = 1.5
    ctx.lineCap = 'round'
    
    const typhoonPos = getTyphoonPosition()
    const typhoonPt = map.latLngToContainerPoint(L.latLng(typhoonPos.lat, typhoonPos.lng))
    const maxVortexRadius = 300
    
    particles.forEach(p => {
       const pPt = map.latLngToContainerPoint(L.latLng(p.lat, p.lng))
       if (pPt.x < -width || pPt.x > width*2 || pPt.y < -height || pPt.y > height*2 || p.age > 100) {
          const b = map.getBounds()
          p.lat = b.getSouthWest().lat + Math.random() * (b.getNorthEast().lat - b.getSouthWest().lat)
          p.lng = b.getSouthWest().lng + Math.random() * (b.getNorthEast().lng - b.getSouthWest().lng)
          p.age = 0
          return
       }
       
       const dx = pPt.x - typhoonPt.x, dy = pPt.y - typhoonPt.y
       const dist = Math.sqrt(dx*dx + dy*dy)
       let u = 0, v = 0
       const vortexFactor = Math.max(0, 1 - dist / maxVortexRadius)
       if (vortexFactor > 0) {
          let ts = dist < 50 ? (dist/50)*8 : (50/dist)*8 + 2
          const angle = Math.atan2(dy, dx) - Math.PI/2 - 0.2
          u += Math.cos(angle) * ts * vortexFactor
          v += Math.sin(angle) * ts * vortexFactor
       }
       u += -1.5 * (1 - vortexFactor*0.8) + (Math.random()-0.5)*0.5
       v += -0.75 * (1 - vortexFactor*0.8) + (Math.random()-0.5)*0.5
       
       const nextPt = { x: pPt.x + u, y: pPt.y + v }
       const nextLatLng = map.containerPointToLatLng(nextPt)
       p.lat = nextLatLng.lat
       p.lng = nextLatLng.lng
       p.age++
       
       if (pPt.x > -50 && pPt.x < width+50 && pPt.y > -50 && pPt.y < height+50) {
          const alpha = Math.min(1, p.age/20, (100-p.age)/20) * 0.8
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
          ctx.beginPath()
          ctx.moveTo(pPt.x - u*3, pPt.y - v*3) 
          ctx.lineTo(nextPt.x, nextPt.y)
          ctx.stroke()
       }
    })
    windAnimationFrame = requestAnimationFrame(animate)
  }
  animate()
}

// 娴锋氮鐑姏鍥?
let waveHeatmapLayer = null
function renderWaveHeatmap() {
  if (waveHeatmapLayer) { map?.removeLayer(waveHeatmapLayer); waveHeatmapLayer = null; }
  if (!layerVisibility.value.wave_heatmap || !map || is3DMode.value || !mapRef.value?.offsetWidth) return
  
  const w = 500, h = 400
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')
  const boundsArr = [[19.5, 111.0], [23.5, 117.0]] 
  const minLat = 19.5, maxLat = 23.5, minLng = 111.0, maxLng = 117.0
  const tp = getTyphoonPosition()
  const cx = w * ((tp.lng - minLng) / (maxLng - minLng))
  const cy = h * ((maxLat - tp.lat) / (maxLat - minLat))
  
  const imgData = ctx.createImageData(w, h)
  const data = imgData.data
  const getWaveColor = (v) => {
     if (v < 0.1) return [0,0,0,0]
     if (v < 0.3) return [0, 131, 143, 100]
     if (v < 0.5) return [0, 188, 212, 140]
     if (v < 0.7) return [77, 208, 225, 170]
     if (v < 0.85) return [129, 212, 250, 190]
     return [179, 157, 219, 220]
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
       const dx = x - cx, dy = y - cy
       const dist = Math.sqrt(dx*dx + dy*dy)
       let intensity = (x/w * 0.5 + y/h * 0.3)
       if (dist < 200) intensity += Math.pow(1 - dist/200, 3) * 1.5
       intensity += (Math.random() - 0.5) * 0.05
       const [r,g,b,a] = getWaveColor(Math.min(1, Math.max(0, intensity)))
       const idx = (y * w + x) * 4
       data[idx] = r; data[idx+1] = g; data[idx+2] = b; data[idx+3] = a
    }
  }
  ctx.putImageData(imgData, 0, 0)
  
  if (guangdongGeo) {
      ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = 'black'
      const drawRing = (ring) => {
          ctx.beginPath()
          ring.forEach((c, i) => {
              const px = w * ((c[0] - minLng) / (maxLng - minLng))
              const py = h * ((maxLat - c[1]) / (maxLat - minLat))
              if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
          })
          ctx.closePath(); ctx.fill()
      }
      guangdongGeo.features.forEach(f => {
          if (f.geometry.type === 'Polygon') drawRing(f.geometry.coordinates[0])
          else if (f.geometry.type === 'MultiPolygon') f.geometry.coordinates.forEach(p => drawRing(p[0]))
      })
      ctx.restore()
  }
  waveHeatmapLayer = L.imageOverlay(canvas.toDataURL(), boundsArr, { opacity: 0.8, interactive: false, zIndex: 300 }).addTo(map)
}

function resizeCanvas() {
  if (windCanvas.value && mapRef.value) {
    windCanvas.value.width = mapRef.value.offsetWidth
    windCanvas.value.height = mapRef.value.offsetHeight
  }
  applyCesiumResolutionScale()
}

function startSpinBillboardLoop() {
  if (spinBillboardRaf) return
  function tick() {
    spinBillboardRaf = 0
    if (!viewer || !spinningBillboards3D.length) return
    const seconds = performance.now() / 1000
    spinningBillboards3D.forEach(({ entity }) => {
      if (entity?.billboard) {
        entity.billboard.rotation = -seconds * (Math.PI / 2)
      }
    })
    viewer.scene.requestRender()
    spinBillboardRaf = requestAnimationFrame(tick)
  }
  spinBillboardRaf = requestAnimationFrame(tick)
}

function stopSpinBillboardLoop() {
  if (spinBillboardRaf) {
    cancelAnimationFrame(spinBillboardRaf)
    spinBillboardRaf = 0
  }
}

function switchBasemap(basemapId) {
  if (isSwitchingBasemap) return
  isSwitchingBasemap = true
  try {
    if (map) {
      Object.values(basemapLayers).forEach(layer => { if (map.hasLayer(layer)) map.removeLayer(layer); })
      if (basemapLayers[basemapId]) basemapLayers[basemapId].addTo(map)
    }
    if (viewer) mountCesiumImagery(basemapId)
  } finally { isSwitchingBasemap = false }
}

function zoomIn() { if (is3DMode.value && viewer) viewer.camera.zoomIn(120000); else map?.zoomIn(); }
function zoomOut() { if (is3DMode.value && viewer) viewer.camera.zoomOut(120000); else map?.zoomOut(); }

// 外部滚轮事件转发 —— 与内部滚轮一致的高频缩放节奏
let externalWheelDelta = 0
let externalWheelRaf = 0
let lastExternalWheelTime = 0

function handleExternalWheel(deltaY, clientX = null, clientY = null) {
  externalWheelDelta += Number(deltaY || 0)
  if (externalWheelRaf) return

  externalWheelRaf = requestAnimationFrame(() => {
    externalWheelRaf = 0
    const now = performance.now()
    // 与内部 wheel 捕获对齐锛堢害60fps锛?
    if (now - lastExternalWheelTime < 16) return
    lastExternalWheelTime = now

    const delta = externalWheelDelta
    externalWheelDelta = 0
    if (!Number.isFinite(delta) || delta === 0) return

    if (is3DMode.value && viewer) {
      // 3D 鍔ㄦ€佹杩涳細鎸夋 yu杞幅搴﹁皟鏁达紝閬垮厤鈥滆烦鏍尖€?
      const step = Math.min(260000, Math.max(45000, Math.abs(delta) * 900))
      if (delta < 0) {
        viewer.camera.zoomIn(step)
      } else {
        viewer.camera.zoomOut(step)
      }
      viewer.scene.requestRender()
    } else if (is2DMode.value && map) {
      const currentZoom = map.getZoom()
      const step = 0.25
      const nextZoom = delta < 0 ? currentZoom + step : currentZoom - step
      const limitedZoom = map._limitZoom ? map._limitZoom(nextZoom) : nextZoom
      if (limitedZoom === currentZoom) return
      if (
        Number.isFinite(clientX) &&
        Number.isFinite(clientY) &&
        mapRef.value
      ) {
        const rect = mapRef.value.getBoundingClientRect()
        const insideMap =
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        if (insideMap) {
          const containerPoint = L.point(clientX - rect.left, clientY - rect.top)
          map.setZoomAround(containerPoint, limitedZoom, { animate: true, duration: 0.15 })
          return
        }
      }
      map.setZoom(limitedZoom, { animate: true, duration: 0.15 })
    }
  })
}
function resetView() {
  if (is3DMode.value && viewer) {
    flyTo3DViewPreset(active3DViewPresetKey.value, 1.2)
  }
  else map?.flyTo(props.center, props.zoom)
}

function flyToDevice(deviceId) {
  const device = store.devices.find(d => d.id === deviceId)
  if (device && is3DMode.value && viewer) {
    viewer.camera.flyTo({ destination: Cartesian3.fromDegrees(device.lng, device.lat, 180000) })
  } else if (markers[deviceId] && device) {
    map?.flyTo([device.lat, device.lng], 12, { duration: 1 }); markers[deviceId].openPopup()
  }
}

watch(() => store.devices, () => renderDevices(), { deep: true })
watch(() => store.alerts, () => {
  renderCityWarningBoundaries2D()
  renderCityWarningBoundaries3D()
}, { deep: true })
watch(() => props.currentBasemap, (nb) => switchBasemap(nb))
watch(() => currentMapMode.value, (m) => {
    applyCesiumMapMode(m)
    if (m !== '3D') {
      resetCesiumHoverOverlay()
      closeCesiumPopup()
    }
    if (m === '3D' && windAnimationFrame) {
      cancelAnimationFrame(windAnimationFrame); windAnimationFrame = null
      if (windCanvas.value) windCanvas.value.getContext('2d').clearRect(0, 0, windCanvas.value.width, windCanvas.value.height)
    }
    if (m === '2D' && layerVisibility.value.wind_particle) startWindAnimation()
})

watch([() => layerVisibility.value.typhoon, () => layerVisibility.value.typhoon_history_track, () => layerVisibility.value.typhoon_forecast_track, () => layerVisibility.value.typhoon_probability_range, () => layerVisibility.value.typhoon_wind_circle, () => layerVisibility.value.typhoon_marker], () => renderTyphoon())
watch(() => layerVisibility.value.vessels, () => renderVessels())
watch(() => typhoonData.value, () => renderTyphoon(), { deep: true })
watch(() => vesselData.value, () => renderVessels(), { deep: true })
watch(() => layerVisibility.value.wind_particle, (nv) => {
  if (nv && is2DMode.value) startWindAnimation()
  else if (windAnimationFrame) {
    cancelAnimationFrame(windAnimationFrame); windAnimationFrame = null
    if (windCanvas.value) windCanvas.value.getContext('2d').clearRect(0, 0, windCanvas.value.width, windCanvas.value.height)
  }
})
watch(() => layerVisibility.value.wave_heatmap, () => renderWaveHeatmap())

watch(currentMapMode, (nm) => {
  if (nm === '2D') { nextTick(() => { resizeCanvas(); if (layerVisibility.value.wind_particle) startWindAnimation(); renderWaveHeatmap(); applyCountyBoundaryVisibility2D(); applyCountyBoundaryVisibility3D(); }) }
  else {
    if (windAnimationFrame) {
      cancelAnimationFrame(windAnimationFrame); windAnimationFrame = null
      if (windCanvas.value) windCanvas.value.getContext('2d').clearRect(0, 0, windCanvas.value.width, windCanvas.value.height)
    }
    if (waveHeatmapLayer && map) { map.removeLayer(waveHeatmapLayer); waveHeatmapLayer = null; }
    if (countyBoundaryLayer2D) countyBoundaryLayer2D.clearLayers()
    if (countyLabelLayer2D) countyLabelLayer2D.clearLayers()
    nextTick(() => applyCountyBoundaryVisibility3D())
  }
})

defineExpose({
  zoomIn,
  zoomOut,
  resetView,
  flyToDevice,
  flyToStation: (id) => flyToDevice(id),
  flyToRisk,
  switchBasemap,
  switch3DViewPreset,
  handleExternalWheel
})

onMounted(() => {
  initMap(); initCesium()
  if (store.devices.length > 0) renderDevices()
  renderTyphoon(); renderVessels()
  nextTick(() => { resizeCanvas(); if (is2DMode.value) { startWindAnimation(); renderWaveHeatmap(); } })
  window.addEventListener('resize', resizeCanvas)
})

onUnmounted(() => {
  stopSpinBillboardLoop()
  if (windAnimationFrame) cancelAnimationFrame(windAnimationFrame)
  if (cesiumHoverPickRaf) cancelAnimationFrame(cesiumHoverPickRaf)
  cesiumHoverPickRaf = 0
  pendingCesiumHoverPosition = null
  window.removeEventListener('resize', resizeCanvas)
  if (map && mapZoomLevelHandler) map.off('zoomend', mapZoomLevelHandler)
  mapZoomLevelHandler = null
  if (viewer?.camera && viewerCameraMoveEndHandler) viewer.camera.moveEnd.removeEventListener(viewerCameraMoveEndHandler)
  viewerCameraMoveEndHandler = null
  if (viewer?.scene && viewerScenePostRenderHandler) viewer.scene.postRender.removeEventListener(viewerScenePostRenderHandler)
  viewerScenePostRenderHandler = null
  if (waveHeatmapLayer && map) map.removeLayer(waveHeatmapLayer)
  if (provinceBoundaryLayer2D && map) map.removeLayer(provinceBoundaryLayer2D)
  if (cityWarningBoundaryLayer2D && map) map.removeLayer(cityWarningBoundaryLayer2D)
  if (coastalCityLabelLayer2D && map) map.removeLayer(coastalCityLabelLayer2D)
  if (countyBoundaryLayer2D && map) map.removeLayer(countyBoundaryLayer2D)
  if (countyLabelLayer2D && map) map.removeLayer(countyLabelLayer2D)
  if (viewer && provinceBoundaryEntities3D.length) {
    provinceBoundaryEntities3D.forEach(entity => viewer.entities.remove(entity))
  }
  if (viewer && cityWarningBoundaryEntities3D.length) {
    cityWarningBoundaryEntities3D.forEach(entity => viewer.entities.remove(entity))
  }
  if (viewer && coastalCityLabelEntities3D.length) {
    coastalCityLabelEntities3D.forEach(entity => viewer.entities.remove(entity))
  }
  if (viewer && deviceEntities3D.length) {
    deviceEntities3D.forEach(entity => viewer.entities.remove(entity))
  }
  if (viewer && typhoonEntities3D.length) {
    typhoonEntities3D.forEach(entity => viewer.entities.remove(entity))
  }
  if (viewer && vesselEntities3D.length) {
    vesselEntities3D.forEach(entity => viewer.entities.remove(entity))
  }
  if (viewer && countyBoundaryEntities3D.length) {
    countyBoundaryEntities3D.forEach(entity => viewer.entities.remove(entity))
  }
  if (viewer && countyLabelEntities3D.length) {
    countyLabelEntities3D.forEach(entity => viewer.entities.remove(entity))
  }
  provinceBoundaryEntities3D = []
  cityWarningBoundaryEntities3D = []
  coastalCityLabelEntities3D = []
  deviceEntities3D = []
  typhoonEntities3D = []
  vesselEntities3D = []
  spinningBillboards3D = []
  countyBoundaryEntities3D = []
  countyLabelEntities3D = []
  resetCesiumHoverOverlay()
  closeCesiumPopup()
  Object.values(markerLayers).forEach(l => l.clearLayers())
  if (map) map.remove(); if (viewer) viewer.destroy()
})
</script>

<style scoped>
.map-area { flex: 1; position: relative; min-width: 0; }
.map-area.fullscreen { width: 100vw; height: 100vh; }
.map-container { width: 100%; height: 100%; position: absolute; top: 0; left: 0; background: transparent; opacity: 0; pointer-events: none; transition: opacity 0.25s ease; }
.map-container.active { opacity: 1; pointer-events: auto; }
.cesium-stage { z-index: 20; }
.leaflet-stage { z-index: 30; }

:deep(.risk-pulse-circle) { animation: risk-pulse 2s infinite ease-out; transform-origin: center; }
:deep(.risk-pulse-marker) { animation: marker-blink 1s infinite alternate; }
:deep(.temp-focus-ring) { animation: focus-ring-shrink 1.5s ease-out forwards; transform-origin: center; }

@keyframes risk-pulse { 0%, 100% { opacity: 0.1; transform: scale(0.95); } 50% { opacity: 0.4; transform: scale(1.05); } }
@keyframes marker-blink { from { opacity: 1; stroke-width: 0; } to { opacity: 0.5; stroke-width: 4px; stroke: rgba(223, 93, 106, 0.45); } }
@keyframes focus-ring-shrink { 0% { transform: scale(5); border-color: transparent; border-width: 0; } 20% { opacity: 1; border-color: #df5d6a; border-width: 4px; } 100% { transform: scale(1); opacity: 0; border-width: 0; } }

.wind-canvas, .wave-canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 400; }
.wave-canvas { z-index: 399; opacity: 0.6; }
.cesium-floating-tooltip,
.cesium-floating-popup {
  position: absolute;
  z-index: 460;
  transform: translate(-50%, calc(-100% - 10px));
}
.cesium-floating-tooltip {
  max-width: 220px;
  padding: 6px 10px;
  border: 1px solid #ffffff;
  border-radius: 4px;
  background: #ffffff;
  color: #1f2937;
  font-size: 12px;
  line-height: 1.4;
  pointer-events: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.28);
  white-space: nowrap;
}
.cesium-floating-popup {
  min-width: 180px;
  max-width: 240px;
  padding: 12px 16px 10px 12px;
  border-radius: 12px;
  background: #ffffff;
  color: #1f2937;
  font-size: 12px;
  line-height: 1.5;
  box-shadow: 0 3px 14px rgba(0, 0, 0, 0.24);
}
.cesium-floating-popup__close {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}
.map-ui-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 500; }
.map-ui-overlay > * { pointer-events: auto; }

:global(.typhoon-spinning-icon) { display: flex !important; align-items: center !important; justify-content: center !important; background: transparent !important; border: none !important; }
:global(.typhoon-svg-wrapper) { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; animation: typhoon-spin 4s linear infinite; filter: drop-shadow(0 0 8px rgba(216, 30, 6, 0.6)); }
@keyframes typhoon-spin { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
:global(.custom-div-icon) { background: transparent !important; border: none !important; }
:global(.shared-map-icon) { background: transparent !important; border: none !important; }
:global(.coastal-city-label) { background: transparent !important; border: none !important; }
:global(.coastal-city-label span) {
  display: inline-block;
  padding: 1px 5px;
  border-radius: 6px;
  color: #fff;
  background: rgba(11, 16, 32, 0.42);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.75);
}
:global(.county-label) { background: transparent !important; border: none !important; }
:global(.county-label span) {
  display: inline-block;
  padding: 1px 3px;
  border-radius: 4px;
  color: #e5e7eb;
  background: rgba(17, 24, 39, 0.28);
  font-size: 10px;
  font-weight: 600;
  line-height: 1.15;
  white-space: nowrap;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.65);
}
</style>
