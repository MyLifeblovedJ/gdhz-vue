import { DEVICE_TYPES, deviceTypeConfig } from '../data/deviceConfig'
import { buildQuadrantWindCirclePolygon, buildTyphoonVisualModel, getTyphoonCategoryColor } from './typhoonVisuals'
import { createDeviceIcon, createGeologyPointIcon, createTyphoonIcon, createTyphoonPointIcon, createVesselIcon } from './mapIconFactory'
import {
  buildGeologyHighlightState,
  createStableCategoryColorMap,
  getGeologyCategory,
  getGeologyCategoryGroup,
  getGeologyDatasetColor,
  getGeologyFieldValue,
} from './geologySampling'

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

function escapePopupHtml(value) {
  return String(value ?? '--')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatCoordinateValue(value) {
  if (!Number.isFinite(value)) return '--'
  return Number(value).toFixed(6)
}

function buildGeologyMetadataLinkHtml(record) {
  const mggid = record?.mggid || '--'
  const sample = record?.sample || record?.pointId || '--'
  const title = record?.title || '--'
  const institution = record?.institution || '--'
  const cruise = record?.cruise || '--'
  const device = record?.device || '--'

  return `
    <span class="geology-popup-card__compound-value">
      <span class="geology-popup-card__compound-text">${escapePopupHtml(mggid)}</span>
      <a
        class="geology-popup-card__meta-link"
        href="#"
        data-mggid="${escapePopupHtml(mggid)}"
        data-sample="${escapePopupHtml(sample)}"
        data-title="${escapePopupHtml(title)}"
        data-institution="${escapePopupHtml(institution)}"
        data-cruise="${escapePopupHtml(cruise)}"
        data-device="${escapePopupHtml(device)}"
      >(原始数据链接)</a>
    </span>
  `.trim()
}

function buildGeologyProcessedLinkHtml(record) {
  const excelName = record?.processedExcelName || '--'
  const templateName = record?.templateExcelName || '--'
  const sourcePdfName = record?.sourcePdfName || '--'
  const sourcePdfId = record?.sourcePdfId || '--'
  const mggid = record?.mggid || '--'
  const sample = record?.sample || record?.pointId || '--'
  const title = record?.title || '--'
  const institution = record?.institution || '--'
  const cruise = record?.cruise || '--'
  const device = record?.device || '--'

  return `
    <span class="geology-popup-card__compound-value">
      <span class="geology-popup-card__compound-text">${escapePopupHtml(excelName)}</span>
      <a
        class="geology-popup-card__processed-link"
        href="#"
        data-link-kind="processed"
        data-mggid="${escapePopupHtml(mggid)}"
        data-sample="${escapePopupHtml(sample)}"
        data-title="${escapePopupHtml(title)}"
        data-institution="${escapePopupHtml(institution)}"
        data-cruise="${escapePopupHtml(cruise)}"
        data-device="${escapePopupHtml(device)}"
        data-focus-dir="pdf"
        data-focus-pdf-id="${escapePopupHtml(sourcePdfId)}"
        data-focus-pdf-name="${escapePopupHtml(sourcePdfName)}"
        data-focus-excel="${escapePopupHtml(excelName)}"
        data-focus-template="${escapePopupHtml(templateName)}"
      >(处理后数据链接)</a>
    </span>
  `.trim()
}

function buildGeologyPopupHtml(title, rows, categoryTag = null) {
  const renderedRows = rows.map(({ label, value, valueHtml, valueClass = '' }) => `
    <div class="geology-popup-card__row">
      <span class="geology-popup-card__label">${escapePopupHtml(label)}</span>
      <span class="geology-popup-card__value ${escapePopupHtml(valueClass)}">${valueHtml || escapePopupHtml(value)}</span>
    </div>
  `).join('')

  const categoryHtml = categoryTag
    ? `<span class="geology-popup-card__cat-tag" style="--cat-color: ${escapePopupHtml(categoryTag.color)}">
         <i class="${escapePopupHtml(categoryTag.icon)}"></i>
         ${escapePopupHtml(categoryTag.label)}
       </span>`
    : ''

  return `
    <section class="geology-popup-card" data-popup-type="geology">
      <button class="geology-popup-card__close" type="button" aria-label="关闭地质点气泡">×</button>
      <header class="geology-popup-card__title">${escapePopupHtml(title)}</header>
      ${categoryHtml ? `<div class="geology-popup-card__cat-row">${categoryHtml}</div>` : ''}
      <div class="geology-popup-card__body">${renderedRows}</div>
    </section>
  `.trim()
}

function blendHexColor(color, mixColor = '#ffffff', ratio = 0) {
  const normalize = (value) => String(value || '').replace('#', '').trim()
  const expand = (value) => value.length === 3
    ? value.split('').map(character => character + character).join('')
    : value
  const source = expand(normalize(color))
  const mix = expand(normalize(mixColor))
  if (source.length !== 6 || mix.length !== 6) return color

  const mixChannel = (sourceIndex) => {
    const from = Number.parseInt(source.slice(sourceIndex, sourceIndex + 2), 16)
    const to = Number.parseInt(mix.slice(sourceIndex, sourceIndex + 2), 16)
    const value = Math.round(from + (to - from) * ratio)
    return value.toString(16).padStart(2, '0')
  }

  return `#${mixChannel(0)}${mixChannel(2)}${mixChannel(4)}`
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

export function buildGeologyRenderSpec(records = [], geologyStyle = {}) {
  const colorMode = geologyStyle.colorMode === 'independent' ? 'independent' : 'linked'
  const linkedColorField = geologyStyle.colorBy || 'ship'
  const rawColorField = colorMode === 'independent'
    ? (geologyStyle.rawColorBy || linkedColorField)
    : linkedColorField
  const processedColorField = colorMode === 'independent'
    ? (geologyStyle.processedColorBy || linkedColorField)
    : linkedColorField
  const rawRecords = records.filter(record => record?.datasetType !== 'processed')
  const processedRecords = records.filter(record => record?.datasetType === 'processed')
  const linkedColorMap = colorMode === 'linked'
    ? createStableCategoryColorMap(records, linkedColorField)
    : null
  const rawColorMap = colorMode === 'independent'
    ? createStableCategoryColorMap(rawRecords, rawColorField)
    : null
  const processedColorMap = colorMode === 'independent'
    ? createStableCategoryColorMap(processedRecords, processedColorField)
    : null
  const activeRecord = records.find(record => record?.pointId === geologyStyle.activePointId) || null

  return records
    .filter(record => Number.isFinite(record?.latitude) && Number.isFinite(record?.longitude))
    .map((record) => {
      const isProcessed = record?.datasetType === 'processed'
      const colorField = isProcessed ? processedColorField : rawColorField
      const colorMap = colorMode === 'independent'
        ? (isProcessed ? processedColorMap : rawColorMap)
        : linkedColorMap
      const categoryValue = getGeologyFieldValue(record, colorField)
      const baseColor = colorMap?.[categoryValue] || getGeologyDatasetColor(record)
      const highlightState = buildGeologyHighlightState(record, {
        activeRecord,
        activePointId: geologyStyle.activePointId,
        colorMode,
        colorBy: linkedColorField,
        rawColorBy: rawColorField,
        processedColorBy: processedColorField,
      })
      const color = highlightState === 'linked'
        ? blendHexColor(baseColor, '#ffffff', 0.26)
        : baseColor
      const size = highlightState === 'selected'
        ? 20
        : highlightState === 'linked'
          ? 18
          : 14
      const opacity = highlightState === 'dimmed' ? 0.18 : 1
      const datasetLabel = isProcessed ? '\u5904\u7406\u540e\u6570\u636e' : '\u539f\u59cb\u6570\u636e'
      const category = getGeologyCategory(record)
      const categoryGroup = getGeologyCategoryGroup(record)
      const popupRows = [
        { label: '\u6570\u636e\u96c6', value: record.title || '--' },
        { label: 'MGGID', valueHtml: buildGeologyMetadataLinkHtml(record), valueClass: 'is-compound' },
        ...(isProcessed ? [{ label: '\u5904\u7406\u540e\u6587\u4ef6', valueHtml: buildGeologyProcessedLinkHtml(record), valueClass: 'is-compound' }] : []),
        { label: '\u6570\u636e\u6e90', value: datasetLabel },
        { label: '\u7814\u7a76\u5927\u7c7b', value: categoryGroup.label },
        { label: '\u5177\u4f53\u5206\u7c7b', value: category.label },
        { label: '\u673a\u6784', value: record.institution || '--' },
        { label: '\u8239\u8236', value: record.ship || '--' },
        { label: '\u822a\u6b21', value: record.cruise || '--' },
        { label: '\u8bbe\u5907', value: record.device || '--' },
        { label: '\u7ecf\u5ea6', value: formatCoordinateValue(record.longitude) },
        { label: '\u7eac\u5ea6', value: formatCoordinateValue(record.latitude) },
      ]
      return {
        id: `geology-${record.pointId}`,
        sourceId: record.pointId,
        sourceType: 'geology',
        kind: 'point',
        lat: record.latitude,
        lng: record.longitude,
        image: createGeologyPointIcon({
          color,
          size,
          variant: record.datasetType,
          highlightState,
        }),
        size,
        opacity,
        color,
        colorBy: colorField,
        colorValue: categoryValue,
        visualVariant: record.datasetType,
        highlightState,
        hoverHtml: '',
        legacyPopupHtml: buildPopupHtml(`样品编号: ${record.sample || record.pointId || '--'}`, [
          `数据集: ${record.title || '--'}`,
          `数据源: ${record.datasetType === 'processed' ? '处理后数据' : '原始数据'}`,
          `船舶: ${record.ship || '--'}`,
          `航次: ${record.cruise || '--'}`,
          `设备: ${record.device || '--'}`,
          `机构: ${record.institution || '--'}`,
          `MGGID: ${record.mggid || '--'}`,
        ]),
        popupHtml: buildGeologyPopupHtml(
          `\u6837\u54c1\u7f16\u53f7\uff1a${record.sample || record.pointId || '--'}`,
          popupRows,
          category,
        ),
      }
    })
}

export function buildMapRenderSpec({ devices = [], homeStations = [], typhoonData = null, vessels = [], layerVisibility = {}, geologyRecords = [], geologyStyle = {} }) {
  return {
    devices: buildDeviceRenderSpec(devices),
    homeStations: buildHomeStationRenderSpec(homeStations),
    typhoon: buildTyphoonRenderSpec(typhoonData, layerVisibility),
    vessels: buildVesselRenderSpec(vessels, layerVisibility),
    geology: buildGeologyRenderSpec(geologyRecords, geologyStyle),
  }
}

