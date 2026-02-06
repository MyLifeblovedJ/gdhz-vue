/**
 * 广东省海洋灾害综合决策系统 - 全局状态管理
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { deviceApi, alertApi, riskApi } from '../api'
import {
    mockStats,
    mockDatabaseStats,
    mockRiskDecisions,
    mockTyphoonData,
    mockVesselData,
    generateHistoryData
} from '../data/mockData'
import { deviceTypeConfig, getDeviceStats } from '../data/deviceConfig'

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

    // 横幅状态
    const isBannerCollapsed = ref(false)
    const isBannerAnimating = ref(false)

    // 左侧边栏收缩状态
    const isLeftSidebarCollapsed = ref(false)

    // 右侧边栏收缩状态
    const isRightSidebarCollapsed = ref(false)

    // 悬浮工具栏激活的面板 (null | 'layers' | 'devices' | 'models')
    // 默认展开观测设备面板
    const activeFloatingPanel = ref('devices')

    // 当前页面
    const currentPage = ref('overview')

    // 图层状态
    const layerVisibility = ref({
        // 观测网络 - 岸基观测站
        coastal_stations: true,
        coastal_base: true,
        tide_stations: true,
        surge_stations: true,
        // 观测网络 - 浮标
        buoys: true,
        wave_buoy: true,
        anchor_buoy: true,
        disposable_buoy: true,
        argo_buoy: true,
        // 观测网络 - 其他
        erosion_monitor: true,
        smart_marker: true,
        uav: true,
        usv: true,
        // 实时态势
        typhoon: true, // 总开关
        typhoon_wind_circle: false, // 各级风圈
        typhoon_forecast_track: false, // 预测路径
        typhoon_probability_range: true, // 台风中心概率范围 (默认开启)
        typhoon_history_track: true, // 历史路径 (默认开启)
        typhoon_marker: true, // 台风标志 (默认开启)
        vessels: true,
        wind_particle: true,
        wave_heatmap: true,
    })

    // 选中的设备（用于详情面板）
    const selectedDevice = ref(null)
    const deviceHistoryData = ref({})

    // ===== 计算属性 =====
    const onlineDevices = computed(() =>
        devices.value.filter(d => d.status === 'online')
    )

    const alertDevices = computed(() =>
        devices.value.filter(d => d.status === 'alarm' || d.status === 'warn')
    )

    // 设备统计（按类型分组）
    const deviceStatsByType = computed(() => {
        const stats = {}
        Object.entries(deviceTypeConfig).forEach(([type, config]) => {
            const typeDevices = devices.value.filter(d => d.type === type)
            stats[type] = {
                name: config.name,
                icon: config.icon,
                color: config.color,
                total: typeDevices.length,
                online: typeDevices.filter(d => d.status === 'online').length,
                warn: typeDevices.filter(d => d.status === 'warn').length,
                alarm: typeDevices.filter(d => d.status === 'alarm').length,
                offline: typeDevices.filter(d => d.status === 'offline').length,
            }
        })
        return stats
    })

    // 设备状态汇总（用于饼图）
    const deviceStatusSummary = computed(() => [
        { name: '在线', value: onlineDevices.value.length, color: '#10B981' },
        { name: '预警', value: devices.value.filter(d => d.status === 'warn').length, color: '#F59E0B' },
        { name: '告警', value: devices.value.filter(d => d.status === 'alarm').length, color: '#EF4444' },
        { name: '离线', value: devices.value.filter(d => d.status === 'offline').length, color: '#6B7280' },
    ])

    // ===== 操作 =====

    /**
     * 加载设备数据
     */
    async function fetchDevices(params = {}) {
        isLoading.value = true
        try {
            devices.value = await deviceApi.getDevices(params)
            // 更新统计
            stats.value = {
                totalDevices: devices.value.length,
                onlineDevices: onlineDevices.value.length,
                alertDevices: alertDevices.value.length,
                offlineDevices: devices.value.filter(d => d.status === 'offline').length,
            }
        } finally {
            isLoading.value = false
        }
    }

    /**
     * 加载预警数据
     */
    async function fetchAlerts(params = {}) {
        try {
            alerts.value = await alertApi.getAlerts(params)
        } catch (error) {
            console.error('Failed to fetch alerts:', error)
        }
    }

    /**
     * 加载滚动消息
     */
    async function fetchMarqueeMessages() {
        try {
            marqueeMessages.value = await alertApi.getMarqueeMessages()
        } catch (error) {
            console.error('Failed to fetch marquee messages:', error)
        }
    }

    /**
     * 加载风险数据
     */
    async function fetchRiskData() {
        try {
            riskData.value = await riskApi.getRiskData()
        } catch (error) {
            console.error('Failed to fetch risk data:', error)
        }
    }

    /**
     * 获取设备历史数据
     */
    async function fetchDeviceHistory(deviceId, elementKey, startTime, endTime) {
        try {
            // 使用mock数据生成函数
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

    /**
     * 选择设备
     */
    function selectDevice(device) {
        selectedDevice.value = device
    }

    /**
     * 清除选中设备
     */
    function clearSelectedDevice() {
        selectedDevice.value = null
        deviceHistoryData.value = {}
    }

    /**
     * 切换图层可见性
     */
    function toggleLayerVisibility(layerId) {
        layerVisibility.value[layerId] = !layerVisibility.value[layerId]
    }

    /**
     * 设置图层可见性
     */
    function setLayerVisibility(layerId, visible) {
        layerVisibility.value[layerId] = visible
    }

    /**
     * 初始化数据
     */
    async function initializeData() {
        await Promise.all([
            fetchDevices(),
            fetchAlerts(),
            fetchMarqueeMessages(),
            fetchRiskData(),
        ])
    }

    /**
     * 切换横幅状态
     */
    function toggleBanner() {
        isBannerCollapsed.value = !isBannerCollapsed.value
    }

    /**
     * 设置横幅为关闭状态（带动画）
     */
    function collapseBannerWithAnimation() {
        isBannerAnimating.value = true
        setTimeout(() => {
            isBannerCollapsed.value = true
            isBannerAnimating.value = false
        }, 400)
    }

    /**
     * 更新当前时间
     */
    function updateCurrentTime() {
        currentTime.value = new Date()
    }

    /**
     * 设置当前页面
     */
    function setCurrentPage(page) {
        currentPage.value = page
    }

    /**
     * 切换左侧边栏状态
     */
    function toggleLeftSidebar() {
        isLeftSidebarCollapsed.value = !isLeftSidebarCollapsed.value
    }

    /**
     * 切换右侧边栏状态
     */
    function toggleRightSidebar() {
        isRightSidebarCollapsed.value = !isRightSidebarCollapsed.value
    }

    /**
     * 设置悬浮面板激活状态
     */
    function setActiveFloatingPanel(panel) {
        // 如果点击同一个面板，则关闭；否则切换到新面板
        if (activeFloatingPanel.value === panel) {
            activeFloatingPanel.value = null
        } else {
            activeFloatingPanel.value = panel
        }
    }

    /**
     * 关闭悬浮面板
     */
    function closeFloatingPanel() {
        activeFloatingPanel.value = null
    }

    return {
        // 状态
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
        layerVisibility,
        selectedDevice,
        deviceHistoryData,

        // 计算属性
        onlineDevices,
        alertDevices,
        deviceStatsByType,
        deviceStatusSummary,

        // 操作
        fetchDevices,
        fetchAlerts,
        fetchMarqueeMessages,
        fetchRiskData,
        fetchDeviceHistory,
        initializeData,
        selectDevice,
        clearSelectedDevice,
        toggleLayerVisibility,
        setLayerVisibility,
        toggleBanner,
        collapseBannerWithAnimation,
        updateCurrentTime,
        setCurrentPage,
        toggleLeftSidebar,
        toggleRightSidebar,
        setActiveFloatingPanel,
        closeFloatingPanel,
    }
})
