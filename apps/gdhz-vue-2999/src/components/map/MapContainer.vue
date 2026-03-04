<template>
  <div class="map-area" :class="{ fullscreen: props.fullscreen }">
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
  Color,
  Math as CesiumMath,
  OpenStreetMapImageryProvider,
  SceneMode,
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
const mapRef = ref(null)
const cesiumRef = ref(null)
const windCanvas = ref(null)
const waveCanvas = ref(null)

let map = null
let viewer = null
let basemapLayers = {}
let markerLayers = {}
let markers = {}
let typhoonLayer = null
let vesselLayer = null
let windAnimationFrame = null
let waveAnimationFrame = null
let isSwitchingBasemap = false
let provinceBoundaryLayer2D = null
let provinceBoundaryEntities3D = []
let cityWarningBoundaryLayer2D = null
let cityWarningBoundaryEntities3D = []
const CITY_WARNING_PANE = 'city-warning-pane'
const PROVINCE_BOUNDARY_PANE = 'province-boundary-pane'

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

// 鍏ㄥ眬鍙橀噺鍖烘坊鍔?
let highlightLayer = null

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

function renderProvinceBoundary2D() {
  if (!map || !provinceBoundaryLayer2D) return
  provinceBoundaryLayer2D.clearLayers()

  GD_PROVINCE_LINE_PATHS.forEach((path) => {
    const latlngs = path.map(([lng, lat]) => [lat, lng])
    L.polyline(latlngs, {
      color: '#ffea00',
      weight: 2.5,
      opacity: 1,
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
        pane: CITY_WARNING_PANE
      }).addTo(cityWarningBoundaryLayer2D)

      // 统一单色细边界：避免多色/双层描边造成视觉噪音
      const outerRing = rings[0]
      if (outerRing?.length > 2) {
        L.polyline(outerRing, {
          color: WARNING_CITY_BORDER_COLOR,
          weight: 0.8,
          opacity: 1,
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

    if (viewer.cesiumWidget && viewer.cesiumWidget.creditContainer) {
      viewer.cesiumWidget.creditContainer.style.display = 'none'
    }

    // 显式配置星空盒，兼容当前 Cesium 版本，避免 skyBox:true 的类型错误
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
    applyCesiumMapMode(currentMapMode.value)
    flyTo3DViewPreset(active3DViewPresetKey.value, 1.2)
  } catch (error) {
    console.error('Cesium Viewer initialization failed:', error)
  }
}

function initMap() {
  if (!mapRef.value) return

  map = L.map(mapRef.value, {
    center: props.center,
    zoom: props.zoom,
    zoomControl: false,
    attributionControl: false
  })

  // 鍒涘缓鐗瑰畾鐨勫眰绾?Pane
  const markersPane = map.createPane('markers-pane');
  markersPane.style.zIndex = 610;
  
  const typhoonPane = map.createPane('typhoon-pane');
  typhoonPane.style.zIndex = 800; // 纭繚鍙伴鍦ㄦ渶椤跺眰
  typhoonPane.style.pointerEvents = 'none'; // 鍏佽鐐瑰嚮涓嬫柟鐨?markers

  const cityWarningPane = map.createPane(CITY_WARNING_PANE)
  cityWarningPane.style.zIndex = 805
  cityWarningPane.style.pointerEvents = 'none'

  const provinceBoundaryPane = map.createPane(PROVINCE_BOUNDARY_PANE)
  provinceBoundaryPane.style.zIndex = 820
  provinceBoundaryPane.style.pointerEvents = 'none'

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
  renderCityWarningBoundaries2D()
  renderProvinceBoundary2D()
  
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

// 娓叉煋璁惧鏍囪
function renderDevices() {
  const devices = store.devices
  if (!map) return

  // 娓呯┖鐜版湁鏍囪
  Object.values(markerLayers).forEach(layer => layer.clearLayers())
  markers = {}

  devices.forEach(device => {
    const config = deviceTypeConfig[device.type]
    if (!config) return
    
    const isAlert = device.status === 'alarm'
    const isWarn = device.status === 'warn'
    let color = config.color
    if (isWarn) color = 'var(--status-warn)'
    if (isAlert) color = 'var(--alert-red)'

    const customIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="
        width: 14px; height: 14px;
        background: rgba(10, 22, 38, 0.9);
        border: 1px solid ${color};
        border-radius: 50%;
        box-shadow: 0 0 ${isAlert || isWarn ? '5px' : '3px'} ${color};
        display: flex; align-items: center; justify-content: center;
        color: ${color}; font-size: 8px;
        ${isAlert ? 'animation: marker-pulse-ring-red 1.2s ease-out infinite;' : ''}
        ${isWarn && !isAlert ? 'animation: marker-pulse-ring-yellow 1.5s ease-out infinite;' : ''}
      ">
        <i class="fa-solid ${config.icon}" style="transform: scale(0.8);"></i>
      </div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    })

    const marker = L.marker([device.lat, device.lng], { 
      icon: customIcon,
      pane: 'markers-pane' // 鎸囧畾闈㈡澘
    })
      .bindPopup(`<b>${device.name}</b><br>绫诲瀷: ${device.typeName}<br>鏁板€? ${device.val}`)

    marker.on('click', () => {
      emit('device-click', device)
    })

    if (markerLayers[device.type]) {
      markerLayers[device.type].addLayer(marker)
    }

    markers[device.id] = marker
  })
}

// 娓叉煋鍙伴璺緞
function renderTyphoon() {
  if (!map || !typhoonLayer) return
  
  typhoonLayer.clearLayers()
  
  // 鎬诲紑鍏虫鏌?
  if (!layerVisibility.value.typhoon || !typhoonData.value) return
  
  const { track, forecast, windCircle } = typhoonData.value
  
  // 1. 缁樺埗鍘嗗彶璺緞
  if (layerVisibility.value.typhoon_history_track && track && track.length > 0) {
    const trackPoints = track.map(p => [p.lat, p.lng])
    const trackLine = L.polyline(trackPoints, {
      color: '#EF4444',
      weight: 3,
      opacity: 0.8,
      pane: 'typhoon-pane'
    })
    typhoonLayer.addLayer(trackLine)
    
    // 璺緞鐐规爣璁?
    track.forEach((point, index) => {
      const isLatest = index === track.length - 1
      if (isLatest && layerVisibility.value.typhoon_marker) return

      const marker = L.circleMarker([point.lat, point.lng], {
        radius: isLatest ? 8 : 4,
        color: '#EF4444',
        fillColor: '#fff',
        fillOpacity: 1,
        weight: 2,
        pane: 'typhoon-pane'
      })
      typhoonLayer.addLayer(marker)
    })
  }
  
  // 2. 缁樺埗棰勬祴璺緞
  if (layerVisibility.value.typhoon_forecast_track && forecast && forecast.length > 0) {
    const lastTrack = track[track.length - 1]
    const forecastPoints = [[lastTrack.lat, lastTrack.lng], ...forecast.map(p => [p.lat, p.lng])]
    const forecastLine = L.polyline(forecastPoints, {
      color: '#F97316',
      weight: 2,
      opacity: 0.6,
      dashArray: '10, 10',
      pane: 'typhoon-pane'
    })
    typhoonLayer.addLayer(forecastLine)
  }

  // 3. 缁樺埗鍙伴涓績姒傜巼鑼冨洿 (骞虫粦鐨勯敟褰㈣竟鐣?
  if (layerVisibility.value.typhoon_probability_range && forecast && forecast.length > 0 && track && track.length > 0) {
    const lastTrack = track[track.length - 1];
    const allPoints = [lastTrack, ...forecast];
    const centerLine = allPoints.map(p => [p.lat, p.lng]);
    const radii = allPoints.map((_, i) => i * 0.35);
    const leftEdge = [];
    const rightEdge = [];
    
    for (let i = 0; i < centerLine.length; i++) {
        const [lat, lng] = centerLine[i];
        const r = radii[i];
        let dx = 0, dy = 0;
        if (i < centerLine.length - 1) {
            dx = centerLine[i+1][1] - lng;
            dy = centerLine[i+1][0] - lat;
        } else if (i > 0) {
            dx = lng - centerLine[i-1][1];
            dy = lat - centerLine[i-1][0];
        }
        const len = Math.sqrt(dx*dx + dy*dy) || 1;
        const nx = -dy / len; 
        const ny = dx / len;
        if (r > 0) {
            leftEdge.push([lat + nx * r, lng + ny * r]);
            rightEdge.push([lat - nx * r, lng - ny * r]);
        }
    }
    
    const lastIdx = centerLine.length - 1;
    const endCenter = centerLine[lastIdx];
    const endRadius = radii[lastIdx];
    const endArc = [];
    const endDx = centerLine[lastIdx][1] - centerLine[lastIdx-1][1];
    const endDy = centerLine[lastIdx][0] - centerLine[lastIdx-1][0];
    const endAngle = Math.atan2(endDy, endDx);
    
    for (let a = Math.PI/2; a >= -Math.PI/2; a -= Math.PI/24) {
        const lat = endCenter[0] + Math.sin(endAngle + a) * endRadius;
        const lng = endCenter[1] + Math.cos(endAngle + a) * endRadius;
        endArc.push([lat, lng]);
    }
    
    const startPoint = centerLine[0]; 
    const outline = [
        startPoint,
        ...leftEdge,
        ...endArc,
        ...rightEdge.slice().reverse()
    ];
    
    const probabilityShape = L.polygon(outline, {
        color: '#ffffff',
        weight: 2,
        dashArray: '8, 6',
        fillColor: '#3B82F6',
        fillOpacity: 0.15,
        pane: 'typhoon-pane'
    });
    typhoonLayer.addLayer(probabilityShape);
  }
  
  // 4. 缁樺埗椋庡湀
  if (layerVisibility.value.typhoon_wind_circle && windCircle) {
    const center = [windCircle.center.lat, windCircle.center.lng]
    const configs = [
        { radius: windCircle.radius7, color: '#3B82F6', opacity: 0.1 },
        { radius: windCircle.radius10, color: '#F97316', opacity: 0.15 },
        { radius: windCircle.radius12, color: '#EF4444', opacity: 0.2 }
    ];
    
    configs.forEach(c => {
        typhoonLayer.addLayer(L.circle(center, {
            radius: c.radius * 1000,
            color: c.color,
            fillColor: c.color,
            fillOpacity: c.opacity,
            weight: 1,
            pane: 'typhoon-pane'
        }));
    });
  }

  // 5. 鍙伴鏃嬭浆鏍囧織
  if (layerVisibility.value.typhoon_marker && track && track.length > 0) {
    const latest = track[track.length - 1]
    const typhoonIcon = L.divIcon({
        className: 'typhoon-spinning-icon',
        html: `
            <div class="typhoon-svg-wrapper">
                <svg viewBox="0 0 1024 1024" width="60" height="60">
                    <path d="M512 512m-320 0a320 320 0 1 0 640 0 320 320 0 1 0-640 0Z" fill="#d81e06"></path>
                    <path d="M512 512m-128 0a128 128 0 1 0 256 0 128 128 0 1 0-256 0Z" fill="#e6e6e6"></path>
                    <path d="M688 112c-145.6 96.992-286.816 244.352-304 304-16.512 57.312-58.432 111.136-118 108-22.016-1.152-63.216-52.256-42-108A497.6 497.6 0 0 1 688 112z" fill="#d81e06"></path>
                    <path d="M330.496 924c145.6-96.992 286.816-244.352 304-304 16.512-57.312 58.432-111.136 118-108 22.016 1.152 63.216 52.256 42 108a497.6 497.6 0 0 1-464 304z" fill="#d81e06"></path>
                </svg>
            </div>
        `,
        iconSize: [60, 60],
        iconAnchor: [30, 30]
    })
    const marker = L.marker([latest.lat, latest.lng], { 
        icon: typhoonIcon,
        pane: 'typhoon-pane',
        zIndexOffset: 1000
    })
    typhoonLayer.addLayer(marker)
  }
}

// 娓叉煋鑸硅埗
function renderVessels() {
  if (!map || !vesselLayer) return
  vesselLayer.clearLayers()
  if (!layerVisibility.value.vessels || !vesselData.value) return
  
  vesselData.value.forEach(vessel => {
    const color = vessel.status === 'warning' ? MAP_COLORS.vesselWarn : MAP_COLORS.vesselNormal
    const marker = L.circleMarker([vessel.lat, vessel.lng], {
      radius: 3,
      color: color,
      fillColor: color,
      fillOpacity: 0.8,
      weight: 1,
      pane: 'markers-pane'
    })
    marker.bindPopup(`
      <b>${vessel.name}</b><br>
      绫诲瀷: ${vessel.type}<br>
      鑸€? ${vessel.speed.toFixed(1)}kn<br>
      鑸悜: ${vessel.heading}掳
    `)
    vesselLayer.addLayer(marker)
  })
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

watch(() => store.devices, () => renderDevices())
watch(() => store.alerts, () => {
  renderCityWarningBoundaries2D()
  renderCityWarningBoundaries3D()
}, { deep: true })
watch(() => props.currentBasemap, (nb) => switchBasemap(nb))
watch(() => currentMapMode.value, (m) => {
    applyCesiumMapMode(m)
    if (m === '3D' && windAnimationFrame) {
      cancelAnimationFrame(windAnimationFrame); windAnimationFrame = null
      if (windCanvas.value) windCanvas.value.getContext('2d').clearRect(0, 0, windCanvas.value.width, windCanvas.value.height)
    }
    if (m === '2D' && layerVisibility.value.wind_particle) startWindAnimation()
})

watch([() => layerVisibility.value.typhoon, () => layerVisibility.value.typhoon_history_track, () => layerVisibility.value.typhoon_forecast_track, () => layerVisibility.value.typhoon_probability_range, () => layerVisibility.value.typhoon_wind_circle, () => layerVisibility.value.typhoon_marker], () => renderTyphoon())
watch(() => layerVisibility.value.vessels, () => renderVessels())
watch(() => layerVisibility.value.wind_particle, (nv) => {
  if (nv && is2DMode.value) startWindAnimation()
  else if (windAnimationFrame) {
    cancelAnimationFrame(windAnimationFrame); windAnimationFrame = null
    if (windCanvas.value) windCanvas.value.getContext('2d').clearRect(0, 0, windCanvas.value.width, windCanvas.value.height)
  }
})
watch(() => layerVisibility.value.wave_heatmap, () => renderWaveHeatmap())

watch(currentMapMode, (nm) => {
  if (nm === '2D') { nextTick(() => { resizeCanvas(); if (layerVisibility.value.wind_particle) startWindAnimation(); renderWaveHeatmap(); }) }
  else {
    if (windAnimationFrame) {
      cancelAnimationFrame(windAnimationFrame); windAnimationFrame = null
      if (windCanvas.value) windCanvas.value.getContext('2d').clearRect(0, 0, windCanvas.value.width, windCanvas.value.height)
    }
    if (waveHeatmapLayer && map) { map.removeLayer(waveHeatmapLayer); waveHeatmapLayer = null; }
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
  switch3DViewPreset
})

onMounted(() => {
  initMap(); initCesium()
  if (store.devices.length > 0) renderDevices()
  renderTyphoon(); renderVessels()
  nextTick(() => { resizeCanvas(); if (is2DMode.value) { startWindAnimation(); renderWaveHeatmap(); } })
  window.addEventListener('resize', resizeCanvas)
})

onUnmounted(() => {
  if (windAnimationFrame) cancelAnimationFrame(windAnimationFrame)
  window.removeEventListener('resize', resizeCanvas)
  if (waveHeatmapLayer && map) map.removeLayer(waveHeatmapLayer)
  if (provinceBoundaryLayer2D && map) map.removeLayer(provinceBoundaryLayer2D)
  if (cityWarningBoundaryLayer2D && map) map.removeLayer(cityWarningBoundaryLayer2D)
  if (viewer && provinceBoundaryEntities3D.length) {
    provinceBoundaryEntities3D.forEach(entity => viewer.entities.remove(entity))
  }
  if (viewer && cityWarningBoundaryEntities3D.length) {
    cityWarningBoundaryEntities3D.forEach(entity => viewer.entities.remove(entity))
  }
  provinceBoundaryEntities3D = []
  cityWarningBoundaryEntities3D = []
  Object.values(markerLayers).forEach(l => l.clearLayers())
  if (map) map.remove(); if (viewer) viewer.destroy()
})
</script>

<style scoped>
.map-area { flex: 1; position: relative; min-width: 0; }
.map-area.fullscreen { width: 100vw; height: 100vh; }
.map-container { width: 100%; height: 100%; position: absolute; top: 0; left: 0; background: #061629; opacity: 0; pointer-events: none; transition: opacity 0.25s ease; }
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
.map-ui-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 500; }
.map-ui-overlay > * { pointer-events: auto; }

:global(.typhoon-spinning-icon) { display: flex !important; align-items: center !important; justify-content: center !important; background: transparent !important; border: none !important; }
:global(.typhoon-svg-wrapper) { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; animation: typhoon-spin 4s linear infinite; filter: drop-shadow(0 0 8px rgba(216, 30, 6, 0.6)); }
@keyframes typhoon-spin { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
:global(.custom-div-icon) { background: transparent !important; border: none !important; }
</style>
