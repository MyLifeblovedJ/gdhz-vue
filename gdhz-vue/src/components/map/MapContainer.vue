<template>
  <div class="map-area">
    <div ref="mapRef" class="map-container"></div>
    
    <!-- 风粒子Canvas图层 -->
    <canvas 
      v-show="layerVisibility.wind_particle"
      ref="windCanvas" 
      class="wind-canvas"
    ></canvas>
    
    <!-- 海浪热力图Canvas图层 -->
    <canvas
      v-show="layerVisibility.wave_heatmap"
      ref="waveCanvas"
      class="wave-canvas"
    ></canvas>

    <!-- UI 覆盖层（确保在地图和 Canvas 上方） -->
    <div class="map-ui-overlay">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useAppStore } from '../../stores/app'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { basemaps as basemapConfig } from '../../data/mockData'
import { deviceTypeConfig } from '../../data/deviceConfig'
import guangdongGeo from '../../data/guangdong_geo.json'

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
  }
})

const emit = defineEmits(['map-ready', 'device-click'])

const store = useAppStore()
const mapRef = ref(null)
const windCanvas = ref(null)
const waveCanvas = ref(null)

let map = null
let basemapLayers = {}
let markerLayers = {}
let markers = {}
let typhoonLayer = null
let vesselLayer = null
let windAnimationFrame = null
let waveAnimationFrame = null

// 图层可见性
const layerVisibility = computed(() => store.layerVisibility)
const typhoonData = computed(() => store.typhoonData)
const vesselData = computed(() => store.vesselData)

// 全局变量区添加
let highlightLayer = null

// 风险位置映射表 (Demo用)
const riskLocationMap = {
  '珠海香洲段': [22.28, 113.58],
  '中山沿海低洼地区': [22.5, 113.5],
  '珠江口海域': [22.1, 113.7],
  '阳江海陵岛': [21.58, 111.85],
  '湛江港区': [21.18, 110.42],
  '珠江口外海域': [21.8, 113.8] // 默认为大尺度
}

// 初始化地图
function initMap() {
  if (!mapRef.value) return

  map = L.map(mapRef.value, {
    center: props.center,
    zoom: props.zoom,
    zoomControl: false,
    attributionControl: false
  })

  // 创建特定的层级 Pane
  const markersPane = map.createPane('markers-pane');
  markersPane.style.zIndex = 610;
  
  const typhoonPane = map.createPane('typhoon-pane');
  typhoonPane.style.zIndex = 800; // 确保台风在最顶层
  typhoonPane.style.pointerEvents = 'none'; // 允许点击下方的 markers

  // 创建底图图层
  basemapConfig.forEach(config => {
    basemapLayers[config.id] = L.tileLayer(config.url, { maxZoom: 19 })
  })

  // 添加默认底图
  basemapLayers[props.currentBasemap].addTo(map)

  // 创建标记图层组
  Object.keys(deviceTypeConfig).forEach(type => {
    markerLayers[type] = L.layerGroup().addTo(map)
  })
  
  // 创建高亮图层
  highlightLayer = L.layerGroup().addTo(map)
  
  // 创建台风图层
  typhoonLayer = L.layerGroup().addTo(map)
  
  // 创建船舶图层
  vesselLayer = L.layerGroup().addTo(map)

  emit('map-ready', map)
  
  // 初始化Canvas尺寸
  resizeCanvas()
}

// 渲染风险高亮 (仅高风险)
function renderRiskHighlights() {
  if (!map || !highlightLayer) return
  highlightLayer.clearLayers()
  
  const risks = store.riskDecisions?.risks || []
  risks.forEach(risk => {
    if (risk.level === 'high') {
      const coord = riskLocationMap[risk.location]
      if (coord) {
        // 动态呼吸圆圈
        const circle = L.circle(coord, {
          color: '#EF4444',
          fillColor: '#EF4444',
          fillOpacity: 0.2,
          radius: 2000,
          className: 'risk-pulse-circle'
        })
        
        // 闪烁点
        const marker = L.circleMarker(coord, {
          radius: 6,
          color: '#fff',
          fillColor: '#EF4444',
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

// 定位到风险点
function flyToRisk(risk) {
  const coord = riskLocationMap[risk.location]
  if (coord) {
    map?.flyTo(coord, 12, { duration: 1.5 })
    
    // 创建一个临时的强聚焦动画
    const focusCircle = L.circleMarker(coord, {
      radius: 50, // 初始大半径
      color: 'transparent',
      fillColor: 'transparent',
      className: 'temp-focus-ring' // CSS动画控制收缩
    }).addTo(map)
    
    // 临时标记
    const popup = L.popup({ closeButton: false, closeOnClick: false })
      .setLatLng(coord)
      .setContent(`<div style="color:#EF4444; font-weight:bold;">⚠️ ${risk.title}</div>`)
      .openOn(map)
      
    setTimeout(() => {
      map.removeLayer(focusCircle)
    }, 2000)
  }
}

// 渲染设备标记
function renderDevices() {
  const devices = store.devices
  if (!map) return

  // 清空现有标记
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
        background: rgba(8, 25, 50, 0.9);
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
      pane: 'markers-pane' // 指定面板
    })
      .bindPopup(`<b>${device.name}</b><br>类型: ${device.typeName}<br>数值: ${device.val}`)

    marker.on('click', () => {
      emit('device-click', device)
    })

    if (markerLayers[device.type]) {
      markerLayers[device.type].addLayer(marker)
    }

    markers[device.id] = marker
  })
}

// 渲染台风路径
function renderTyphoon() {
  if (!map || !typhoonLayer) return
  
  typhoonLayer.clearLayers()
  
  // 总开关检查
  if (!layerVisibility.value.typhoon || !typhoonData.value) return
  
  const { track, forecast, windCircle } = typhoonData.value
  
  // 1. 绘制历史路径
  if (layerVisibility.value.typhoon_history_track && track && track.length > 0) {
    const trackPoints = track.map(p => [p.lat, p.lng])
    const trackLine = L.polyline(trackPoints, {
      color: '#EF4444',
      weight: 3,
      opacity: 0.8,
      pane: 'typhoon-pane'
    })
    typhoonLayer.addLayer(trackLine)
    
    // 路径点标记
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
  
  // 2. 绘制预测路径
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

  // 3. 绘制台风中心概率范围 (平滑的锥形边界)
  if (layerVisibility.value.typhoon_probability_range && forecast && forecast.length > 0 && track && track.length > 0) {
    const lastTrack = track[track.length - 1];
    const allPoints = [lastTrack, ...forecast];
    
    // 构建中心线点序列
    const centerLine = allPoints.map(p => [p.lat, p.lng]);
    
    // 计算每个中心点对应的偏移半径 (随预测时间逐渐增大)
    const radii = allPoints.map((_, i) => i * 0.35);
    
    // 生成左侧和右侧边界点
    const leftEdge = [];
    const rightEdge = [];
    
    for (let i = 0; i < centerLine.length; i++) {
        const [lat, lng] = centerLine[i];
        const r = radii[i];
        
        // 计算当时段的方向 (使用前后点)
        let dx = 0, dy = 0;
        if (i < centerLine.length - 1) {
            dx = centerLine[i+1][1] - lng;
            dy = centerLine[i+1][0] - lat;
        } else if (i > 0) {
            dx = lng - centerLine[i-1][1];
            dy = lat - centerLine[i-1][0];
        }
        const len = Math.sqrt(dx*dx + dy*dy) || 1;
        const nx = -dy / len; // 法向量
        const ny = dx / len;
        
        // 跳过第一个点（半径为0），避免重复
        if (r > 0) {
            leftEdge.push([lat + nx * r, lng + ny * r]);
            rightEdge.push([lat - nx * r, lng - ny * r]);
        }
    }
    
    // 在末端绘制平滑半圆弧闭合
    const lastIdx = centerLine.length - 1;
    const endCenter = centerLine[lastIdx];
    const endRadius = radii[lastIdx];
    const endArc = [];
    
    // 计算末端方向
    const endDx = centerLine[lastIdx][1] - centerLine[lastIdx-1][1];
    const endDy = centerLine[lastIdx][0] - centerLine[lastIdx-1][0];
    const endAngle = Math.atan2(endDy, endDx);
    
    // 生成末端半圆弧 (从左侧到右侧，顺时针)
    for (let a = Math.PI/2; a >= -Math.PI/2; a -= Math.PI/24) {
        const lat = endCenter[0] + Math.sin(endAngle + a) * endRadius;
        const lng = endCenter[1] + Math.cos(endAngle + a) * endRadius;
        endArc.push([lat, lng]);
    }
    
    // 组合成完整轮廓: 起点 -> 左边界 -> 末端弧 -> 右边界反向 -> 回到起点
    const startPoint = centerLine[0]; // 起点（台风当前位置）
    const outline = [
        startPoint, // 从起点开始
        ...leftEdge,
        ...endArc,
        ...rightEdge.slice().reverse()
        // Leaflet 会自动闭合回到起点
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
  
  // 4. 绘制风圈
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

  // 5. 台风旋转标志 (醒目化)
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
        pane: 'typhoon-pane', // 确保在最顶层
        zIndexOffset: 1000
    })
    typhoonLayer.addLayer(marker)
  }
}

// 渲染船舶
function renderVessels() {
  if (!map || !vesselLayer) return
  
  vesselLayer.clearLayers()
  
  if (!layerVisibility.value.vessels || !vesselData.value) return
  
  vesselData.value.forEach(vessel => {
    const color = vessel.status === 'warning' ? '#F59E0B' : '#10B981'
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
      类型: ${vessel.type}<br>
      航速: ${vessel.speed.toFixed(1)}kn<br>
      航向: ${vessel.heading}°
    `)
    vesselLayer.addLayer(marker)
  })
}

// 获取当前台风位置
function getTyphoonPosition() {
  if (props.typhoonData && props.typhoonData.length > 0) {
    // 假设最后一个轨迹点是当前位置
    const track = props.typhoonData[0].track
    if (track && track.length > 0) {
      return track[track.length - 1]
    }
  }
  // mockData fallback (如果有的话，或者返回一个默认中心)
  return { lat: 21.5, lng: 114.0 } 
}

// 风粒子动画 - 地理坐标系版
function startWindAnimation() {
  if (!windCanvas.value || !map) return
  
  if (windAnimationFrame) {
    cancelAnimationFrame(windAnimationFrame)
    windAnimationFrame = null
  }
  
  const ctx = windCanvas.value.getContext('2d')
  const width = windCanvas.value.width
  const height = windCanvas.value.height
  
  if (!layerVisibility.value.wind_particle) {
    ctx.clearRect(0, 0, width, height)
    return
  }

  // 初始化粒子 (使用 LatLng)
  // 在当前视野范围内随机分布
  const bounds = map.getBounds()
  const southWest = bounds.getSouthWest()
  const northEast = bounds.getNorthEast()
  
  const particles = []
  const numParticles = 1200
  
  // 扩大一点生成范围，避免拖动边缘空白
  const spanLat = northEast.lat - southWest.lat
  const spanLng = northEast.lng - southWest.lng
  
  for(let i=0; i<numParticles; i++){
    particles.push({
      lat: southWest.lat - spanLat*0.5 + Math.random() * spanLat*2,
      lng: southWest.lng - spanLng*0.5 + Math.random() * spanLng*2,
      age: Math.random() * 100,
      path: [] 
    })
  }

  function animate() {
    if (!map) return
    
    ctx.clearRect(0, 0, width, height)
    ctx.lineWidth = 1.5
    ctx.lineCap = 'round'
    
    // 获取当前台风屏幕坐标（用于计算流场）
    const typhoonPos = getTyphoonPosition()
    const typhoonLatLng = L.latLng(typhoonPos.lat, typhoonPos.lng)
    const typhoonPt = map.latLngToContainerPoint(typhoonLatLng)
    
    // 视口边界，用于判断粒子是否在屏幕外太远
    // 简单优化：只绘制屏幕内的，但更新所有？或者只更新附近的。
    // 为简便，更新所有，绘制时裁减。
    
    const maxVortexRadius = 300 // 像素，漩涡影响半径
    
    particles.forEach(p => {
       // 1. 将粒子地理坐标转为屏幕坐标
       const pLatLng = L.latLng(p.lat, p.lng)
       const pPt = map.latLngToContainerPoint(pLatLng)
       
       // 如果粒子偏离屏幕太远，重置到屏幕内随机位置
       if (pPt.x < -width || pPt.x > width*2 || pPt.y < -height || pPt.y > height*2 || p.age > 100) {
          const b = map.getBounds()
          const sw = b.getSouthWest()
          const ne = b.getNorthEast()
          const sl = ne.lat - sw.lat
          const slg = ne.lng - sw.lng
          
          p.lat = sw.lat + Math.random() * sl
          p.lng = sw.lng + Math.random() * slg
          p.age = 0
          p.path = []
          return // 下帧处理
       }
       
       // 2. 计算流场速度向量 (在屏幕坐标系下计算，方便视觉控制)
       const dx = pPt.x - typhoonPt.x
       const dy = pPt.y - typhoonPt.y
       const dist = Math.sqrt(dx*dx + dy*dy)
       
       let u = 0, v = 0
       
       // 混合场逻辑
       const vortexFactor = Math.max(0, 1 - dist / maxVortexRadius) // 0~1, 越近越强
       
       if (vortexFactor > 0) {
          // Rankine Vortex 
          // 切向速度
          let tangentSpeed = 0
          const coreR = 50 // 核心半径
          if (dist < coreR) {
             tangentSpeed = (dist/coreR) * 8
          } else {
             tangentSpeed = (coreR/dist) * 8 + 2
          }
          
          // 角度
          const angle = Math.atan2(dy, dx)
          const targetAngle = angle - Math.PI/2 - 0.2 // 逆时针 + 内吸
          
          u += Math.cos(targetAngle) * tangentSpeed * vortexFactor
          v += Math.sin(targetAngle) * tangentSpeed * vortexFactor
       }
       
       // 环境风 (模拟东南信风或其他背景流)
       // 假设往西北吹 (-1, -1)
       const envSpeed = 1.5
       u += -1.0 * envSpeed * (1 - vortexFactor*0.8) // 漩涡中心受环境风影响小
       v += -0.5 * envSpeed * (1 - vortexFactor*0.8)
       
       // 3. 更新屏幕位置 -> 反算回地理坐标
       // 增加随机性
       u += (Math.random()-0.5)*0.5
       v += (Math.random()-0.5)*0.5
       
       const newPPt = { x: pPt.x + u, y: pPt.y + v }
       const newPLatLng = map.containerPointToLatLng(newPPt)
       
       p.lat = newPLatLng.lat
       p.lng = newPLatLng.lng
       
       // 4. 绘制
       p.path.push({x: newPPt.x, y: newPPt.y})
       if(p.path.length > 8) p.path.shift()
       p.age++
       
       if (p.path.length > 2 && pPt.x > -50 && pPt.x < width+50 && pPt.y > -50 && pPt.y < height+50) {
          const alpha = Math.min(1, p.age/20, (100-p.age)/20) * 0.8
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
          ctx.beginPath()
          // 绘制路径 (注意：这里用的是当前帧计算出的屏幕轨迹连线，
          // 实际上如果地图移动，旧path在屏幕上的位置其实就不对了。
          // 完美做法是只画当前帧的线段，或者重算所有path点的屏幕位置。
          // 为了性能，且风本身很快，我们只画当前点的一个拖尾向量，或者简单处理：
          // 清空path，只画 pPt -> newPPt。但为了长尾效果，我们重算一下path里所有点的屏幕位置？代价太大。
          // 折衷：只存 LatLng 历史？不，太重。
          // 改进：只画线头。或者接受拖动时的短暂错位（因为是动画，很快刷新）。
          // 最稳妥：粒子只保留上一帧位置，画线段。视觉上足够了。
          
          // 修正策略：只画 "流星头"，即 (pPt -> newPPt) * trail_length
          // 利用速度向量画拖尾
          ctx.moveTo(pPt.x - u*3, pPt.y - v*3) 
          ctx.lineTo(newPPt.x, newPPt.y)
          ctx.stroke()
       }
    })
    
    windAnimationFrame = requestAnimationFrame(animate)
  }
  
  animate()
}

// 海浪热力图 - 使用 L.imageOverlay 确保跟随地图
let waveHeatmapLayer = null

function renderWaveHeatmap() {
  if (waveHeatmapLayer) {
    if(map) map.removeLayer(waveHeatmapLayer)
    waveHeatmapLayer = null
  }
  
  if (!layerVisibility.value.wave_heatmap || !map) return
  
  // 创建离屏 Canvas 生成热力纹理
  const w = 500
  const h = 400
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')

  // 地理范围
  const boundsArr = [[19.5, 111.0], [23.5, 117.0]] 
  const minLat = 19.5, maxLat = 23.5
  const minLng = 111.0, maxLng = 117.0
  
  // 动态计算台风在 Heatmap 纹理中的相对坐标
  const typhoonPos = getTyphoonPosition()
  // 注意：Canvas Y轴向下，地图Lat向上，需翻转
  // normalize lng: (lng - min) / (max - min)
  // normalize lat: (max - lat) / (max - min)  <-- Y轴翻转
  const cx = w * ((typhoonPos.lng - minLng) / (maxLng - minLng))
  const cy = h * ((maxLat - typhoonPos.lat) / (maxLat - minLat))
  
  // 遍历像素生成数据
  // 优化：直接操作 ImageData
  const imgData = ctx.createImageData(w, h)
  const data = imgData.data
  
  function getWaveColor(val) {
     // val: 0.0 - 1.0 (对应 0 - 6m)
     // 蓝绿紫色调，与红色台风图标区分
     // 返回 [r, g, b, a]
     if (val < 0.1) return [0,0,0,0] // 小浪不显示
     if (val < 0.3) return [0, 131, 143, 100]    // 深青色
     if (val < 0.5) return [0, 188, 212, 140]    // 青色
     if (val < 0.7) return [77, 208, 225, 170]   // 亮青色
     if (val < 0.85) return [129, 212, 250, 190] // 天蓝色
     return [179, 157, 219, 220]                  // 紫色（最高浪）
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
       // 归一化坐标
       const nx = x / w
       const ny = y / h
       
       // 距离台风中心的距离 (像素空间)
       const dx = x - cx
       const dy = y - cy
       const dist = Math.sqrt(dx*dx + dy*dy)
       
       // 波浪模型
       let intensity = (nx * 0.5 + ny * 0.3) // 基础场
       
       // 台风核心区增强
       const maxR = Math.min(w, h) * 0.4
       if (dist < maxR) {
          // 越靠近中心越强
          intensity += Math.pow(1 - dist/maxR, 3) * 1.5
       }
       
       // 噪点
       intensity += (Math.random() - 0.5) * 0.05
       
       const [r,g,b,a] = getWaveColor(Math.min(1, Math.max(0, intensity)))
       
       const idx = (y * w + x) * 4
       data[idx] = r
       data[idx+1] = g
       data[idx+2] = b
       data[idx+3] = a
    }
  }
  
  
  ctx.putImageData(imgData, 0, 0)
  
  // 陆地遮罩处理 (Land Masking) - 将陆地部分"擦除"
  // 使用 globalCompositeOperation = 'destination-out'
  if (guangdongGeo) {
      ctx.save()
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = 'black' // Color doesn't matter for masking, only alpha (1.0 = erase)
      
      const drawRing = (ring) => {
          ctx.beginPath()
          ring.forEach((coord, i) => {
              const [lng, lat] = coord
              const px = w * ((lng - minLng) / (maxLng - minLng))
              const py = h * ((maxLat - lat) / (maxLat - minLat))
              if (i === 0) ctx.moveTo(px, py)
              else ctx.lineTo(px, py)
          })
          ctx.closePath()
          ctx.fill()
      }
      
      const drawGeometry = (geometry) => {
          if (geometry.type === 'Polygon') {
              // Paint outer ring (holes require destination-in or similar complexities, 
              // but for simple masking, filling outer ring is usually enough if no major lakes)
              drawRing(geometry.coordinates[0])
          } else if (geometry.type === 'MultiPolygon') {
              geometry.coordinates.forEach(poly => {
                  drawRing(poly[0])
              })
          }
      }
      
      guangdongGeo.features.forEach(feature => {
          drawGeometry(feature.geometry)
      })
      
      ctx.restore()
  }
  
  waveHeatmapLayer = L.imageOverlay(canvas.toDataURL(), boundsArr, {
    opacity: 0.8,
    interactive: false,
    zIndex: 300
  }).addTo(map)
}
  


// 调整Canvas尺寸 (仅需调整windCanvas)
function resizeCanvas() {
  if (windCanvas.value && mapRef.value) {
    windCanvas.value.width = mapRef.value.offsetWidth
    windCanvas.value.height = mapRef.value.offsetHeight
  }
  // waveCanvas 已弃用，改用 L.imageOverlay
}

// 切换底图
function switchBasemap(basemapId) {
  if (!map) return
  
  Object.values(basemapLayers).forEach(layer => {
    if (map.hasLayer(layer)) {
      map.removeLayer(layer)
    }
  })

  if (basemapLayers[basemapId]) {
    basemapLayers[basemapId].addTo(map)
  }
}

// 地图控制方法
function zoomIn() {
  map?.zoomIn()
}

function zoomOut() {
  map?.zoomOut()
}

function resetView() {
  map?.flyTo(props.center, props.zoom)
}

function flyToDevice(deviceId) {
  const device = store.devices.find(d => d.id === deviceId)
  const marker = markers[deviceId]
  if (marker && device) {
    map?.flyTo([device.lat, device.lng], 12, { duration: 1 })
    marker.openPopup()
  }
}

// 监听设备数据变化 - 使用浅层监听提升性能
watch(() => store.devices, () => {
  renderDevices()
})

// 监听底图变化
watch(() => props.currentBasemap, (newBasemap) => {
  switchBasemap(newBasemap)
})

// 监听图层可见性变化 - 分别监听各个属性，避免深度监听的性能开销
watch(() => layerVisibility.value.typhoon, () => {
  renderTyphoon()
})

watch(() => layerVisibility.value.typhoon_history_track, () => {
  renderTyphoon()
})

watch(() => layerVisibility.value.typhoon_forecast_track, () => {
  renderTyphoon()
})

watch(() => layerVisibility.value.typhoon_probability_range, () => {
  renderTyphoon()
})

watch(() => layerVisibility.value.typhoon_wind_circle, () => {
  renderTyphoon()
})

watch(() => layerVisibility.value.typhoon_marker, () => {
  renderTyphoon()
})

watch(() => layerVisibility.value.vessels, () => {
  renderVessels()
})

watch(() => layerVisibility.value.wind_particle, (newVal) => {
  if (newVal) {
    startWindAnimation()
  } else if (windAnimationFrame) {
    cancelAnimationFrame(windAnimationFrame)
    windAnimationFrame = null
    // 清空画布
    if (windCanvas.value) {
      const ctx = windCanvas.value.getContext('2d')
      ctx.clearRect(0, 0, windCanvas.value.width, windCanvas.value.height)
    }
  }
})

watch(() => layerVisibility.value.wave_heatmap, () => {
  renderWaveHeatmap()
})

// 暴露方法给父组件
defineExpose({
  zoomIn,
  zoomOut,
  resetView,
  flyToDevice,
  flyToRisk,
  switchBasemap
})

onMounted(() => {
  initMap()
  if (store.devices.length > 0) {
    renderDevices()
  }
  renderTyphoon()
  renderVessels()
  startWindAnimation()
  renderWaveHeatmap()
  
  window.addEventListener('resize', resizeCanvas)
})

onUnmounted(() => {
  // 停止所有动画
  if (windAnimationFrame) {
    cancelAnimationFrame(windAnimationFrame)
    windAnimationFrame = null
  }
  if (waveAnimationFrame) {
    cancelAnimationFrame(waveAnimationFrame)
    waveAnimationFrame = null
  }

  // 移除事件监听器
  window.removeEventListener('resize', resizeCanvas)

  // 清理热力图图层
  if (waveHeatmapLayer && map) {
    map.removeLayer(waveHeatmapLayer)
    waveHeatmapLayer = null
  }

  // 清理所有标记图层
  Object.values(markerLayers).forEach(layer => {
    layer.clearLayers()
  })
  markerLayers = {}
  markers = {}

  // 清理台风图层
  if (typhoonLayer) {
    typhoonLayer.clearLayers()
    typhoonLayer = null
  }

  // 清理船舶图层
  if (vesselLayer) {
    vesselLayer.clearLayers()
    vesselLayer = null
  }

  // 清理高亮图层
  if (highlightLayer) {
    highlightLayer.clearLayers()
    highlightLayer = null
  }

  // 清理底图图层引用
  basemapLayers = {}

  // 最后移除地图实例
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<style scoped>
.map-area {
  flex: 1;
  position: relative;
  min-width: 0;
}

.map-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  background: var(--bg-deep);
}



/* 风险高亮动画 - 由于Leaflet DOM插入位置，这里使用 global 或 deep */
:deep(.risk-pulse-circle) {
  animation: risk-pulse 2s infinite ease-out;
  transform-origin: center;
}

:deep(.risk-pulse-marker) {
  animation: marker-blink 1s infinite alternate;
}

:deep(.temp-focus-ring) {
  animation: focus-ring-shrink 1.5s ease-out forwards;
  transform-origin: center;
}

@keyframes risk-pulse {
  0% { opacity: 0.1; transform: scale(0.95); }
  50% { opacity: 0.4; transform: scale(1.05); }
  100% { opacity: 0.1; transform: scale(0.95); }
}

@keyframes marker-blink {
  from { opacity: 1; stroke-width: 0; }
  to { opacity: 0.5; stroke-width: 4px; stroke: rgba(239, 68, 68, 0.5); }
}

@keyframes focus-ring-shrink {
  0% { transform: scale(5); border-color: transparent; border-width: 0; }
  20% { opacity: 1; border-color: #EF4444; border-width: 4px; }
  100% { transform: scale(1); opacity: 0; border-width: 0; }
}

.wind-canvas,
.wave-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 400;
}

.wave-canvas {
  z-index: 399;
  opacity: 0.6;
}

/* UI 覆盖层 - 确保所有 UI 元素在地图和 Canvas 上方 */
.map-ui-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 500;
}

.map-ui-overlay > * {
  pointer-events: auto;
}

/* 台风旋转标志样式 */
:global(.typhoon-spinning-icon) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  background: transparent !important;
  border: none !important;
}

:global(.typhoon-svg-wrapper) {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: typhoon-spin 4s linear infinite;
  filter: drop-shadow(0 0 8px rgba(216, 30, 6, 0.6));
}

:global(.typhoon-svg-wrapper svg) {
  display: block;
  transform: rotate(0deg); /* 保持原始角度的基础 */
}

@keyframes typhoon-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(-360deg); } /* 台风逆时针旋转 */
}

/* 标记脉冲动画 - 需要全局注入 */
:global(.custom-div-icon) {
  background: transparent !important;
  border: none !important;
}
</style>
