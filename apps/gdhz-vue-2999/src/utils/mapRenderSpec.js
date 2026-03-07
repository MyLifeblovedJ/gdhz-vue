import { DEVICE_TYPES, deviceTypeConfig } from '../data/deviceConfig'
import { buildQuadrantWindCirclePolygon, buildTyphoonVisualModel, getTyphoonCategoryColor } from './typhoonVisuals'
import { createDeviceIcon, createTyphoonIcon, createTyphoonPointIcon, createVesselIcon } from './mapIconFactory'

const DEVICE_STATUS_COLORS = {
  alarm: '#ef4444',
  warn: '#f59e0b',
  offline: '#64748b',
}

const HOME_STATION_DEVICE_TYPE_MAP = {
  surge: DEVICE_TYPES.SURGE_STATION,
  tide: DEVICE_TYPES.TIDE_STATION,
  wave: DEVICE_TYPES.WAVE_BUOY,
}

function buildPopupHtml(title, rows) {
  return `<b>${title}</b><br>${rows.join('<br>')}`
}

function getDeviceStyle(device, config) {
  const color = DEVICE_STATUS_COLORS[device.status] || config.color
  const size = device.status === 'offline' ? 12 : 14
  return { color, size }
}

function buildProbabilityCone(forecastPoints) {
  if (!forecastPoints || forecastPoints.length <= 1) return null

  const centerLine = forecastPoints.map(point => ({ lat: point.lat, lng: point.lng }))
  const radii = centerLine.map((_, index) => index * 0.35)
  const leftEdge = []
  const rightEdge = []

  for (let index = 0; index < centerLine.length; index += 1) {
    const { lat, lng } = centerLine[index]
    let dx = 0
    let dy = 0

    if (index < centerLine.length - 1) {
      dx = centerLine[index + 1].lng - lng
      dy = centerLine[index + 1].lat - lat
    } else if (index > 0) {
      dx = lng - centerLine[index - 1].lng
      dy = lat - centerLine[index - 1].lat
    }

    const length = Math.sqrt(dx * dx + dy * dy) || 1
    const nx = -dy / length
    const ny = dx / length
    if (radii[index] > 0) {
      leftEdge.push({ lat: lat + nx * radii[index], lng: lng + ny * radii[index] })
      rightEdge.push({ lat: lat - nx * radii[index], lng: lng - ny * radii[index] })
    }
  }

  const endCenter = centerLine[centerLine.length - 1]
  const endRadius = radii[radii.length - 1]
  const prev = centerLine[centerLine.length - 2]
  const endAngle = Math.atan2(endCenter.lat - prev.lat, endCenter.lng - prev.lng)
  const endArc = []

  for (let angle = Math.PI / 2; angle >= -Math.PI / 2; angle -= Math.PI / 24) {
    endArc.push({
      lat: endCenter.lat + Math.sin(endAngle + angle) * endRadius,
      lng: endCenter.lng + Math.cos(endAngle + angle) * endRadius,
    })
  }

  return {
    id: 'typhoon-probability-cone',
    kind: 'polygon',
    points: [centerLine[0], ...leftEdge, ...endArc, ...rightEdge.slice().reverse()],
    style: {
      strokeColor: '#ffffff',
      strokeWidth: 2,
      strokeOpacity: 1,
      dashArray: '8, 6',
      fillColor: '#3B82F6',
      fillOpacity: 0.15,
    },
  }
}

export function buildDeviceRenderSpec(devices = []) {
  return devices
    .filter(device => Number.isFinite(device?.lat) && Number.isFinite(device?.lng))
    .map((device) => {
      const config = deviceTypeConfig[device.type]
      if (!config) return null

      const { color, size } = getDeviceStyle(device, config)

      return {
        id: `device-${device.id}`,
        sourceId: device.id,
        sourceType: 'device',
        kind: 'point',
        lat: device.lat,
        lng: device.lng,
        image: createDeviceIcon({ iconName: config.icon, color, size }),
        size,
        popupHtml: buildPopupHtml(device.name, [
          `类型: ${device.typeName}`,
          `数值: ${device.val ?? '--'}`,
        ]),
      }
    })
    .filter(Boolean)
}

export function buildHomeStationRenderSpec(homeStations = []) {
  return homeStations
    .filter(station => Number.isFinite(station?.lat) && Number.isFinite(station?.lng))
    .map((station) => {
      const mappedType = HOME_STATION_DEVICE_TYPE_MAP[station.stationType]
      const config = deviceTypeConfig[mappedType]
      if (!config) return null

      const { color, size } = getDeviceStyle(
        { status: station.status },
        config
      )

      return {
        id: `home-station-${station.id}`,
        sourceId: station.id,
        sourceType: 'home-station',
        kind: 'point',
        lat: station.lat,
        lng: station.lng,
        image: createDeviceIcon({ iconName: config.icon, color, size: size + 2 }),
        size: size + 2,
        hoverHtml: `<b>${station.name}</b><br>${station.stationTypeLabel || '--'}<br>${station.city || '--'}`,
        popupHtml: buildPopupHtml(station.name, [
          `类型: ${station.stationTypeLabel || '--'}`,
          `观测值: ${station.currentValue ?? '--'}${station.unit || ''}`,
          `阈值: ${station.thresholdValue ?? '--'}${station.thresholdUnit || ''}`,
          `说明: ${station.thresholdText || '--'}`,
        ]),
      }
    })
    .filter(Boolean)
}

export function buildTyphoonRenderSpec(typhoonData, layerVisibility = {}) {
  if (!typhoonData || layerVisibility.typhoon === false) {
    return {
      points: [],
      lines: [],
      polygons: [],
      markers: [],
    }
  }

  const model = buildTyphoonVisualModel(typhoonData)
  const points = []
  const lines = []
  const polygons = []
  const markers = []

  if (layerVisibility.typhoon_history_track !== false) {
    model.historySegments.forEach((segment, index) => {
      lines.push({
        id: `typhoon-history-${index}`,
        kind: 'polyline',
        points: [
          { lat: segment.start.lat, lng: segment.start.lng },
          { lat: segment.end.lat, lng: segment.end.lng },
        ],
        style: {
          color: segment.color,
          width: 3,
          opacity: 0.85,
        },
      })
    })

    typhoonData.track.forEach((point, index) => {
      const isLatest = index === typhoonData.track.length - 1
      if (isLatest && layerVisibility.typhoon_marker !== false) return

      points.push({
        id: `typhoon-history-point-${index}`,
        sourceType: 'typhoon-history-point',
        kind: 'point',
        lat: point.lat,
        lng: point.lng,
        image: createTyphoonPointIcon({ color: getTyphoonCategoryColor(point.strong), size: 12 }),
        size: 12,
        hoverHtml: `<b>${point.strong || ''}</b><br>${point.time}<br>风速 ${point.windSpeed ?? '--'}m/s · ${point.pressure ?? '--'}hPa`,
        hoverOffsetY: 6,
      })
    })
  }

  if (layerVisibility.typhoon_forecast_track !== false && model.forecastPoints.length > 1) {
    lines.push({
      id: 'typhoon-forecast-line',
      kind: 'polyline',
      points: model.forecastPoints.map(point => ({ lat: point.lat, lng: point.lng })),
      style: {
        color: '#F97316',
        width: 2,
        opacity: 0.6,
        dashArray: '10, 10',
      },
    })

    typhoonData.forecast.forEach((point, index) => {
      points.push({
        id: `typhoon-forecast-point-${index}`,
        sourceType: 'typhoon-forecast-point',
        kind: 'point',
        lat: point.lat,
        lng: point.lng,
        image: createTyphoonPointIcon({ color: getTyphoonCategoryColor(point.strong), size: 12 }),
        size: 12,
        hoverHtml: `<b>预报 ${point.strong || ''}</b><br>${point.time}<br>风速 ${point.windSpeed ?? '--'}m/s`,
        hoverOffsetY: 6,
      })
    })
  }

  if (layerVisibility.typhoon_probability_range !== false) {
    const cone = buildProbabilityCone(model.forecastPoints)
    if (cone) polygons.push(cone)
  }

  if (layerVisibility.typhoon_wind_circle !== false) {
    const windConfigs = [
      { key: 'radius7', color: '#3B82F6', fillOpacity: 0.08, outlineOpacity: 0.7 },
      { key: 'radius10', color: '#F97316', fillOpacity: 0.12, outlineOpacity: 0.78 },
      { key: 'radius12', color: '#EF4444', fillOpacity: 0.18, outlineOpacity: 0.85 },
    ]

    windConfigs.forEach((config) => {
      const polygonPoints = buildQuadrantWindCirclePolygon(
        typhoonData.windCircle?.center,
        typhoonData.windCircle?.[config.key]
      )
      if (!polygonPoints.length) return

      polygons.push({
        id: `typhoon-${config.key}`,
        kind: 'polygon',
        points: polygonPoints,
        style: {
          strokeColor: config.color,
          strokeWidth: 1.5,
          strokeOpacity: config.outlineOpacity,
          fillColor: config.color,
          fillOpacity: config.fillOpacity,
        },
      })
    })
  }

  if (layerVisibility.typhoon_marker !== false && model.currentPoint) {
    markers.push({
      id: 'typhoon-current-marker',
      sourceType: 'typhoon-current-marker',
      kind: 'point',
      lat: model.currentPoint.lat,
      lng: model.currentPoint.lng,
      image: createTyphoonIcon({ size: 60 }),
      size: 60,
      spin: true,
      filter: 'drop-shadow(0 0 8px rgba(216, 30, 6, 0.6))',
    })
  }

  return { points, lines, polygons, markers }
}

export function buildVesselRenderSpec(vessels = [], layerVisibility = {}) {
  if (layerVisibility.vessels === false) return []

  return vessels
    .filter(vessel => Number.isFinite(vessel?.lat) && Number.isFinite(vessel?.lng))
    .map((vessel) => {
      const color = vessel.status === 'warning' ? '#d9973a' : '#53b07e'
      return {
        id: `vessel-${vessel.id}`,
        sourceId: vessel.id,
        sourceType: 'vessel',
        kind: 'point',
        lat: vessel.lat,
        lng: vessel.lng,
        image: createVesselIcon({ color, size: 8 }),
        size: 8,
        popupHtml: buildPopupHtml(vessel.name, [
          `类型: ${vessel.type}`,
          `航速: ${Number(vessel.speed || 0).toFixed(1)}kn`,
          `航向: ${vessel.heading}°`,
        ]),
      }
    })
}

export function buildMapRenderSpec({ devices = [], homeStations = [], typhoonData = null, vessels = [], layerVisibility = {} }) {
  return {
    devices: buildDeviceRenderSpec(devices),
    homeStations: buildHomeStationRenderSpec(homeStations),
    typhoon: buildTyphoonRenderSpec(typhoonData, layerVisibility),
    vessels: buildVesselRenderSpec(vessels, layerVisibility),
  }
}
