/**
 * 海洋渊听智能管理系统 - 全局状态管理
 */

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { alertApi, deviceApi, geologyApi, riskApi } from '../api'
import {
  mockDatabaseStats,
  mockRiskDecisions,
  mockStats,
  mockTyphoonData,
  mockVesselData,
  generateHistoryData,
} from '../data/mockData'
import { deviceTypeConfig } from '../data/deviceConfig'
import {
  GEOLOGY_FIELD_OPTIONS,
  buildGeologyColorLegendItems,
  buildGeologyFilterTreeItems,
  filterGeologyRecords,
} from '../utils/geologySampling'

export const useAppStore = defineStore('app', () => {
  // ===== 状态 =====
  const devices = ref([])
  const alerts = ref([])
  const marqueeMessages = ref([])
  const riskData = ref([])
  const stats = ref({ ...mockStats })
  const databaseStats = ref({ ...mockDatabaseStats })
  const riskDecisions = ref({ ...mockRiskDecisions })
  const typhoonData = ref({ ...mockTyphoonData })
  const vesselData = ref([...mockVesselData])
  const isLoading = ref(false)
  const currentTime = ref(new Date())

  const isBannerCollapsed = ref(false)
  const isBannerAnimating = ref(false)
  const isLeftSidebarCollapsed = ref(false)
  const isRightSidebarCollapsed = ref(false)
  const activeFloatingPanel = ref(null)
  const currentPage = ref('overview')
  const mapMode = ref('3D')

  const layerVisibility = ref({
    coastal_stations: false,
    coastal_base: false,
    tide_stations: false,
    surge_stations: false,
    buoys: false,
    wave_buoy: false,
    anchor_buoy: false,
    disposable_buoy: false,
    argo_buoy: false,
    erosion_monitor: false,
    smart_marker: false,
    uav: false,
    usv: false,
    typhoon: false,
    typhoon_wind_circle: false,
    typhoon_forecast_track: false,
    typhoon_probability_range: false,
    typhoon_history_track: false,
    typhoon_marker: false,
    vessels: false,
    wind_particle: false,
    wave_heatmap: false,
  })

  const geology = ref({
    layers: {
      rawVisible: false,
      processedVisible: false,
    },
    colorBy: 'ship',
    filterField: 'ship',
    filterMode: 'multiple',
    selectedValuesByField: {},
    fieldOptions: [...GEOLOGY_FIELD_OPTIONS],
    activeMggid: null,
    activePointId: null,
    records: {
      raw: [],
      processed: [],
    },
    focusFilter: null,
  })

  const selectedDevice = ref(null)
  const deviceHistoryData = ref({})

  // ===== 计算属性 =====
  const onlineDevices = computed(() =>
    devices.value.filter(device => device.status === 'online')
  )

  const alertDevices = computed(() =>
    devices.value.filter(device => device.status === 'alarm' || device.status === 'warn')
  )

  const deviceStatsByType = computed(() => {
    const grouped = {}
    Object.entries(deviceTypeConfig).forEach(([type, config]) => {
      const typeDevices = devices.value.filter(device => device.type === type)
      grouped[type] = {
        name: config.name,
        icon: config.icon,
        color: config.color,
        total: typeDevices.length,
        online: typeDevices.filter(device => device.status === 'online').length,
        warn: typeDevices.filter(device => device.status === 'warn').length,
        alarm: typeDevices.filter(device => device.status === 'alarm').length,
        offline: typeDevices.filter(device => device.status === 'offline').length,
      }
    })
    return grouped
  })

  const deviceStatusSummary = computed(() => [
    { name: '在线', value: onlineDevices.value.length, color: '#10B981' },
    { name: '预警', value: devices.value.filter(device => device.status === 'warn').length, color: '#F59E0B' },
    { name: '告警', value: devices.value.filter(device => device.status === 'alarm').length, color: '#EF4444' },
    { name: '离线', value: devices.value.filter(device => device.status === 'offline').length, color: '#6B7280' },
  ])

  const geologyAllRecords = computed(() => [
    ...geology.value.records.raw,
    ...geology.value.records.processed,
  ])

  const visibleGeologyBaseRecords = computed(() => {
    const records = []
    if (geology.value.layers.rawVisible) {
      records.push(...geology.value.records.raw)
    }
    if (geology.value.layers.processedVisible) {
      records.push(...geology.value.records.processed)
    }
    return records
  })

  const visibleGeologySelectedValues = computed(() => (
    geology.value.selectedValuesByField[geology.value.filterField] || []
  ))

  const visibleGeologyRecords = computed(() => {
    let records = filterGeologyRecords(
      visibleGeologyBaseRecords.value,
      {
        filterField: geology.value.filterField,
        selectedValues: visibleGeologySelectedValues.value,
      },
    )
    const focus = geology.value.focusFilter
    if (focus?.filters) {
      records = records.filter(record => {
        if (focus.filters.institution && (record.institution || '') !== focus.filters.institution) return false
        if (focus.filters.ship && (record.ship || '') !== focus.filters.ship) return false
        if (focus.filters.cruise && (record.cruise || '') !== focus.filters.cruise) return false
        return true
      })
    }
    return records
  })

  const geologyFilterTreeItems = computed(() => buildGeologyFilterTreeItems(
    visibleGeologyBaseRecords.value,
    geology.value.filterField,
    visibleGeologySelectedValues.value,
  ))

  const geologyColorLegendItems = computed(() => buildGeologyColorLegendItems(
    visibleGeologyBaseRecords.value,
    geology.value.colorBy,
  ))

  const activeGeologyRecord = computed(() =>
    geologyAllRecords.value.find(record => record.pointId === geology.value.activePointId) || null
  )

  const activeGeologyGroupRecords = computed(() => {
    if (!geology.value.activeMggid) return []
    return visibleGeologyRecords.value.filter(record => record.mggid === geology.value.activeMggid)
  })

  // ===== 数据获取 =====
  async function fetchDevices(params = {}) {
    isLoading.value = true
    try {
      devices.value = await deviceApi.getDevices(params)
      stats.value = {
        totalDevices: devices.value.length,
        onlineDevices: onlineDevices.value.length,
        alertDevices: alertDevices.value.length,
        offlineDevices: devices.value.filter(device => device.status === 'offline').length,
      }
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAlerts(params = {}) {
    try {
      alerts.value = await alertApi.getAlerts(params)
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
    }
  }

  async function fetchMarqueeMessages() {
    try {
      marqueeMessages.value = await alertApi.getMarqueeMessages()
    } catch (error) {
      console.error('Failed to fetch marquee messages:', error)
    }
  }

  async function fetchRiskData() {
    try {
      riskData.value = await riskApi.getRiskData()
    } catch (error) {
      console.error('Failed to fetch risk data:', error)
    }
  }

  async function fetchGeologySampling() {
    try {
      const payload = await geologyApi.getSamplingPoints()
      geology.value.records = {
        raw: payload.raw || [],
        processed: payload.processed || [],
      }
      geology.value.fieldOptions = payload.fieldOptions?.length
        ? payload.fieldOptions
        : [...GEOLOGY_FIELD_OPTIONS]
      return payload
    } catch (error) {
      console.error('Failed to fetch geology sampling data:', error)
      geology.value.records = { raw: [], processed: [] }
      geology.value.fieldOptions = [...GEOLOGY_FIELD_OPTIONS]
      return { raw: [], processed: [], all: [] }
    }
  }

  async function fetchDeviceHistory(deviceId, elementKey, startTime, endTime) {
    try {
      const data = generateHistoryData(deviceId, elementKey, startTime, endTime)
      deviceHistoryData.value = {
        deviceId,
        elementKey,
        startTime,
        endTime,
        data,
      }
      return data
    } catch (error) {
      console.error('Failed to fetch device history:', error)
      return []
    }
  }

  async function initializeData() {
    await Promise.all([
      fetchDevices(),
      fetchAlerts(),
      fetchMarqueeMessages(),
      fetchRiskData(),
      fetchGeologySampling(),
    ])
  }

  // ===== 交互 =====
  function selectDevice(device) {
    selectedDevice.value = device
  }

  function clearSelectedDevice() {
    selectedDevice.value = null
    deviceHistoryData.value = {}
  }

  function toggleLayerVisibility(layerId) {
    layerVisibility.value[layerId] = !layerVisibility.value[layerId]
  }

  function setLayerVisibility(layerId, visible) {
    layerVisibility.value[layerId] = visible
  }

  function ensureActiveGeologySelectionVisible() {
    if (!geology.value.activePointId) return
    if (!visibleGeologyRecords.value.some(record => record.pointId === geology.value.activePointId)) {
      clearActiveGeologySelection()
    }
  }

  function setGeologyLayerVisibility(datasetType, visible) {
    if (datasetType === 'raw') {
      geology.value.layers.rawVisible = visible
    }
    if (datasetType === 'processed') {
      geology.value.layers.processedVisible = visible
    }
    ensureActiveGeologySelectionVisible()
  }

  function setGeologyColorBy(field) {
    if (!geology.value.fieldOptions.some(item => item.key === field)) return
    geology.value.colorBy = field
  }

  function setGeologyFilterField(field) {
    if (!geology.value.fieldOptions.some(item => item.key === field)) return
    geology.value.filterField = field
    if (geology.value.filterMode === 'single') {
      const selected = geology.value.selectedValuesByField[field] || []
      geology.value.selectedValuesByField[field] = selected.slice(0, 1)
    }
    ensureActiveGeologySelectionVisible()
  }

  function setGeologyFilterMode(mode) {
    geology.value.filterMode = mode === 'single' ? 'single' : 'multiple'
    if (geology.value.filterMode === 'single') {
      const field = geology.value.filterField
      const selected = geology.value.selectedValuesByField[field] || []
      geology.value.selectedValuesByField[field] = selected.slice(0, 1)
    }
    ensureActiveGeologySelectionVisible()
  }

  function setGeologySelectedValues(field, values = []) {
    const targetField = field || geology.value.filterField
    const normalizedValues = Array.from(new Set(values.map(value => String(value))))
    geology.value.selectedValuesByField = {
      ...geology.value.selectedValuesByField,
      [targetField]: geology.value.filterMode === 'single' && targetField === geology.value.filterField
        ? normalizedValues.slice(0, 1)
        : normalizedValues,
    }
    ensureActiveGeologySelectionVisible()
  }

  function toggleGeologySelectedValue(value, field = geology.value.filterField) {
    const currentValues = geology.value.selectedValuesByField[field] || []
    const normalizedValue = String(value)
    if (geology.value.filterMode === 'single' && field === geology.value.filterField) {
      const nextValues = currentValues[0] === normalizedValue ? [] : [normalizedValue]
      setGeologySelectedValues(field, nextValues)
      return
    }

    const nextValues = currentValues.includes(normalizedValue)
      ? currentValues.filter(item => item !== normalizedValue)
      : [...currentValues, normalizedValue]
    setGeologySelectedValues(field, nextValues)
  }

  function setActiveGeologyPoint(pointId) {
    const record = geologyAllRecords.value.find(item => item.pointId === pointId)
    geology.value.activePointId = record?.pointId || null
    geology.value.activeMggid = record?.mggid || null
  }

  function clearActiveGeologySelection() {
    geology.value.activePointId = null
    geology.value.activeMggid = null
  }

  function setGeologyFocusFilter(focusFilter) {
    geology.value.focusFilter = focusFilter
  }

  function clearGeologyFocusFilter() {
    geology.value.focusFilter = null
  }

  function toggleBanner() {
    isBannerCollapsed.value = !isBannerCollapsed.value
  }

  function collapseBannerWithAnimation() {
    isBannerAnimating.value = true
    setTimeout(() => {
      isBannerCollapsed.value = true
      isBannerAnimating.value = false
    }, 400)
  }

  function updateCurrentTime() {
    currentTime.value = new Date()
  }

  function setCurrentPage(page) {
    currentPage.value = page
  }

  function setMapMode(mode) {
    if (mode === '2D' || mode === '3D') {
      mapMode.value = mode
    }
  }

  function toggleMapMode() {
    mapMode.value = mapMode.value === '2D' ? '3D' : '2D'
  }

  function toggleLeftSidebar() {
    isLeftSidebarCollapsed.value = !isLeftSidebarCollapsed.value
  }

  function toggleRightSidebar() {
    isRightSidebarCollapsed.value = !isRightSidebarCollapsed.value
  }

  function setActiveFloatingPanel(panel) {
    activeFloatingPanel.value = activeFloatingPanel.value === panel ? null : panel
  }

  function closeFloatingPanel() {
    activeFloatingPanel.value = null
  }

  return {
    devices,
    alerts,
    marqueeMessages,
    riskData,
    stats,
    databaseStats,
    riskDecisions,
    typhoonData,
    vesselData,
    isLoading,
    currentTime,
    isBannerCollapsed,
    isBannerAnimating,
    isLeftSidebarCollapsed,
    isRightSidebarCollapsed,
    activeFloatingPanel,
    currentPage,
    mapMode,
    layerVisibility,
    geology,
    selectedDevice,
    deviceHistoryData,

    onlineDevices,
    alertDevices,
    deviceStatsByType,
    deviceStatusSummary,
    visibleGeologyRecords,
    geologyFilterTreeItems,
    geologyColorLegendItems,
    activeGeologyRecord,
    activeGeologyGroupRecords,

    fetchDevices,
    fetchAlerts,
    fetchMarqueeMessages,
    fetchRiskData,
    fetchGeologySampling,
    fetchDeviceHistory,
    initializeData,
    selectDevice,
    clearSelectedDevice,
    toggleLayerVisibility,
    setLayerVisibility,
    setGeologyLayerVisibility,
    setGeologyColorBy,
    setGeologyFilterField,
    setGeologyFilterMode,
    setGeologySelectedValues,
    toggleGeologySelectedValue,
    setActiveGeologyPoint,
    clearActiveGeologySelection,
    setGeologyFocusFilter,
    clearGeologyFocusFilter,
    toggleBanner,
    collapseBannerWithAnimation,
    updateCurrentTime,
    setCurrentPage,
    setMapMode,
    toggleMapMode,
    toggleLeftSidebar,
    toggleRightSidebar,
    setActiveFloatingPanel,
    closeFloatingPanel,
  }
})
