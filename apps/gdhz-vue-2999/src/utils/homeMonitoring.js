const STATUS_PRIORITY = {
  alarm: 0,
  warn: 1,
  online: 2,
  offline: 3,
}

const DETAIL_STATUS_PRIORITY = {
  warn: 0,
  alarm: 1,
  online: 2,
  offline: 3,
}

const RISK_PRIORITY = {
  high: 0,
  medium: 1,
  low: 2,
}

const LABELS = {
  exceedAlarm: '\u8d85\u8b66',
  exceedWarning: '\u8d85\u9884\u8b66',
  distanceToWarning: '\u8ddd\u8b66\u6212',
  overflow: '\u6f2b\u5824',
  crestGap: '\u8ddd\u5824\u9876',
  stateAlarm: '\u72b6\u6001\u544a\u8b66',
  stateWarning: '\u72b6\u6001\u9884\u8b66',
  observed: '\u89c2\u6d4b',
  threshold: '\u9608\u503c',
}

function formatNumber(value, fractionDigits = 2) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) {
    return '--'
  }

  return numericValue
    .toFixed(fractionDigits)
    .replace(/\.0+$/, '')
    .replace(/(\.\d*?)0+$/, '$1')
}

function getFractionDigits(unit) {
  return unit === 'cm' ? 0 : 2
}

function formatDelta(value, unit) {
  if (!Number.isFinite(Number(value))) {
    return `--${unit || ''}`
  }

  return `${formatNumber(value, getFractionDigits(unit))}${unit || ''}`
}

function compareStations(a, b, priorityMap) {
  const statusDiff = (priorityMap[a.status] ?? 99) - (priorityMap[b.status] ?? 99)
  if (statusDiff !== 0) {
    return statusDiff
  }

  const valueA = Number(a.currentValue)
  const valueB = Number(b.currentValue)
  if (Number.isFinite(valueA) && Number.isFinite(valueB) && valueA !== valueB) {
    return valueB - valueA
  }

  return String(a.id || '').localeCompare(String(b.id || ''))
}

function getThresholdLabel(stationType, status) {
  if (status === 'alarm') {
    return LABELS.exceedAlarm
  }

  if (status === 'warn') {
    return stationType === 'wave' ? LABELS.exceedWarning : LABELS.exceedAlarm
  }

  return LABELS.distanceToWarning
}

function parseNumericReading(raw) {
  const match = String(raw ?? '').match(/-?\d+(\.\d+)?/)
  if (!match) {
    return Number.NaN
  }

  return Number(match[0])
}

function sortBreakpoints(breakpoints = []) {
  return [...breakpoints]
    .map((item) => ({
      ...item,
      statusText: formatSeawallBreakpointStatus(item),
      overflowDelta: Number(item.forecastTideLevel) - Number(item.crestElevation),
    }))
    .sort((a, b) => (b.overflowDelta || -999) - (a.overflowDelta || -999))
}

function buildSegmentSummaries(station, segmentMap, seawalls = []) {
  const seawallMap = new Map(seawalls.map(item => [item.id, item]))

  return (station.segmentIds || [])
    .map((segmentId) => segmentMap.get(segmentId))
    .filter(Boolean)
    .map((segment) => {
      const linkedSeawalls = (segment.seawallIds || [])
        .map(seawallId => seawallMap.get(seawallId))
        .filter(Boolean)
        .map((seawall) => ({
          ...seawall,
          breakpoints: sortBreakpoints(seawall.breakpoints || []),
        }))
        .sort((a, b) => (RISK_PRIORITY[a.riskLevel] ?? 99) - (RISK_PRIORITY[b.riskLevel] ?? 99))

      return {
        ...segment,
        seawalls: linkedSeawalls,
      }
    })
}

function buildSeawallOverview(segments = [], seawalls = []) {
  const highRiskSeawalls = seawalls.filter(item => item.riskLevel === 'high')
  const mediumRiskSeawalls = seawalls.filter(item => item.riskLevel === 'medium')
  const mostDangerousSeawall = [...seawalls].sort(
    (a, b) => (RISK_PRIORITY[a.riskLevel] ?? 99) - (RISK_PRIORITY[b.riskLevel] ?? 99)
  )[0] || null

  return {
    segmentCount: segments.length,
    seawallCount: seawalls.length,
    highRiskCount: highRiskSeawalls.length,
    mediumRiskCount: mediumRiskSeawalls.length,
    mostDangerousSeawall,
  }
}

export function formatMetricValue(value, unit) {
  if (!Number.isFinite(Number(value))) {
    return '--'
  }

  return formatDelta(value, unit)
}

export function formatStationThresholdText(station) {
  if (!station) {
    return '--'
  }

  const currentValue = Number(station.currentValue)
  const thresholdValue = Number(station.thresholdValue)
  if (!Number.isFinite(currentValue) || !Number.isFinite(thresholdValue)) {
    return '--'
  }

  const delta = currentValue - thresholdValue
  const unit = station.thresholdUnit || ''
  if (station.status === 'alarm' || station.status === 'warn') {
    return `${getThresholdLabel(station.stationType, station.status)} ${formatDelta(delta, unit)}`
  }

  return `${LABELS.distanceToWarning} ${formatDelta(Math.abs(delta), unit)}`
}

export function formatSeawallBreakpointStatus(breakpoint) {
  if (!breakpoint) {
    return '--'
  }

  const crestElevation = Number(breakpoint.crestElevation)
  const forecastTideLevel = Number(breakpoint.forecastTideLevel)
  if (!Number.isFinite(crestElevation) || !Number.isFinite(forecastTideLevel)) {
    return '--'
  }

  const delta = forecastTideLevel - crestElevation
  if (delta >= 0) {
    return `${LABELS.overflow} +${formatNumber(delta, 2)}m`
  }

  return `${LABELS.crestGap} ${formatNumber(delta, 2)}m`
}

export function getDefaultHomeStationId(stations = []) {
  const sorted = [...stations].sort((a, b) => compareStations(a, b, STATUS_PRIORITY))
  return sorted[0]?.id || null
}

export function getDefaultHomeDetailStationId(stations = []) {
  const sorted = [...stations].sort((a, b) => compareStations(a, b, DETAIL_STATUS_PRIORITY))
  return sorted[0]?.id || null
}

export function buildHomeMonitoringViewModel(data = {}, selectedStationId = null) {
  const stations = Array.isArray(data.stations) ? data.stations : []
  const segments = Array.isArray(data.segments) ? data.segments : []
  const seawalls = Array.isArray(data.seawalls) ? data.seawalls : []
  const segmentMap = new Map(segments.map(item => [item.id, item]))

  const normalizedStations = [...stations]
    .map((station) => ({
      ...station,
      thresholdText: formatStationThresholdText(station),
    }))
    .sort((a, b) => compareStations(a, b, STATUS_PRIORITY))

  const defaultStationId = getDefaultHomeStationId(normalizedStations)
  const defaultDetailStationId = getDefaultHomeDetailStationId(normalizedStations)
  const activeStationId = selectedStationId || defaultStationId
  const selectedStationSource =
    normalizedStations.find(item => item.id === activeStationId) || normalizedStations[0] || null

  const selectedStation = selectedStationSource
    ? {
        ...selectedStationSource,
        segmentSummaries: buildSegmentSummaries(selectedStationSource, segmentMap, seawalls),
      }
    : null

  return {
    stations: normalizedStations,
    segments,
    seawalls,
    defaultStationId,
    defaultDetailStationId,
    selectedStationId: selectedStation?.id || null,
    selectedStation,
    seawallOverview: buildSeawallOverview(segments, seawalls),
  }
}

export function formatDeviceAlertDetail(device) {
  if (!device || (device.status !== 'alarm' && device.status !== 'warn')) {
    return ''
  }

  const currentReading = Number.isFinite(Number(device.currentReading))
    ? Number(device.currentReading)
    : parseNumericReading(device.val)
  const thresholdValue = Number(device.thresholdValue)
  const thresholdUnit = device.thresholdUnit || ''

  if (!Number.isFinite(currentReading) || !Number.isFinite(thresholdValue)) {
    return device.status === 'alarm' ? LABELS.stateAlarm : LABELS.stateWarning
  }

  const delta = currentReading - thresholdValue
  const prefix =
    device.type === 'wave_buoy' && device.status === 'warn'
      ? LABELS.exceedWarning
      : LABELS.exceedAlarm

  return `${prefix} ${formatDelta(delta, thresholdUnit)}`
}

export function formatDeviceMetricLine(device) {
  if (!device) {
    return `${LABELS.observed} -- | ${LABELS.threshold} -- | ${LABELS.exceedAlarm} --`
  }

  const currentReading = Number.isFinite(Number(device.currentReading))
    ? Number(device.currentReading)
    : parseNumericReading(device.val)
  const thresholdValue = Number(device.thresholdValue)
  const unit = device.thresholdUnit || ''
  const currentText = Number.isFinite(currentReading)
    ? formatMetricValue(currentReading, unit)
    : (device.val || '--')
  const thresholdText = Number.isFinite(thresholdValue)
    ? formatMetricValue(thresholdValue, unit)
    : '--'

  if (!Number.isFinite(currentReading) || !Number.isFinite(thresholdValue)) {
    return `${LABELS.observed} ${currentText} | ${LABELS.threshold} ${thresholdText} | ${LABELS.exceedAlarm} --`
  }

  const delta = currentReading - thresholdValue
  const deltaLabel =
    delta >= 0
      ? (device.type === 'wave_buoy' && device.status === 'warn' ? LABELS.exceedWarning : LABELS.exceedAlarm)
      : LABELS.distanceToWarning
  const deltaText = formatMetricValue(Math.abs(delta), unit)

  return `${LABELS.observed} ${currentText} | ${LABELS.threshold} ${thresholdText} | ${deltaLabel} ${deltaText}`
}
