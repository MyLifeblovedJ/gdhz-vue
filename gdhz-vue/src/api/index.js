/**
 * 广东省海洋灾害综合决策系统 - API 服务接口
 * 预留标准化接口，当前使用 Mock 数据，后续可对接真实 API
 */

import {
    mockDevices,
    mockAlerts,
    mockStats,
    mockRiskData,
    mockMarqueeMessages
} from '../data/mockData'

// ===== API 基础配置 =====
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// ===== 模拟网络延迟 =====
const simulateDelay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms))

// ===== 设备相关接口 =====
export const deviceApi = {
    /**
     * 获取设备列表
     * @param {Object} params - 查询参数
     * @returns {Promise<Array>} 设备列表
     */
    async getDevices(params = {}) {
        await simulateDelay(200)
        let devices = [...mockDevices]

        // 按关键词过滤
        if (params.keyword) {
            const keyword = params.keyword.toLowerCase()
            devices = devices.filter(d =>
                d.name.toLowerCase().includes(keyword) ||
                d.id.toLowerCase().includes(keyword)
            )
        }

        // 按类型过滤
        if (params.type) {
            devices = devices.filter(d => d.type === params.type)
        }

        // 按状态过滤
        if (params.status) {
            devices = devices.filter(d => d.status === params.status)
        }

        return devices
    },

    /**
     * 获取设备详情
     * @param {string} deviceId - 设备ID
     * @returns {Promise<Object>} 设备详情
     */
    async getDeviceById(deviceId) {
        await simulateDelay(100)
        return mockDevices.find(d => d.id === deviceId) || null
    },

    /**
     * 获取设备统计
     * @returns {Promise<Object>} 统计数据
     */
    async getDeviceStats() {
        await simulateDelay(150)
        return { ...mockStats }
    },
}

// ===== 预警相关接口 =====
export const alertApi = {
    /**
     * 获取预警列表
     * @param {Object} params - 查询参数
     * @returns {Promise<Array>} 预警列表
     */
    async getAlerts(params = {}) {
        await simulateDelay(200)
        let alerts = [...mockAlerts]

        // 按类型过滤
        if (params.type) {
            alerts = alerts.filter(a => a.type === params.type)
        }

        // 按等级过滤
        if (params.level) {
            alerts = alerts.filter(a => a.level === params.level)
        }

        return alerts
    },

    /**
     * 获取滚动预警消息
     * @returns {Promise<Array>} 滚动消息列表
     */
    async getMarqueeMessages() {
        await simulateDelay(100)
        return [...mockMarqueeMessages]
    },
}

// ===== 风险评估接口 =====
export const riskApi = {
    /**
     * 获取区域风险数据
     * @returns {Promise<Array>} 风险数据
     */
    async getRiskData() {
        await simulateDelay(300)
        return [...mockRiskData]
    },
}

// ===== 时间轴接口 =====
export const timelineApi = {
    /**
     * 获取时间轴数据
     * @param {Object} params - 时间参数
     * @returns {Promise<Object>} 时间轴数据
     */
    async getTimelineData(params = {}) {
        await simulateDelay(200)
        // 返回模拟的时间轴数据
        const now = new Date()
        return {
            current: now.toISOString(),
            start: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
            end: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
        }
    },
}

// ===== 统一导出 =====
export default {
    device: deviceApi,
    alert: alertApi,
    risk: riskApi,
    timeline: timelineApi,
}
