/**
 * 广东省海洋灾害综合决策系统 - 设备类型配置
 * 定义各类观测设备的观测要素、单位、图表类型和预警阈值
 * 采用树形数据结构
 */

// 设备类型定义（树形结构）
export const DEVICE_TYPES = {
    // 一级分类
    COASTAL_STATION: 'coastal_station',     // 岸基观测站（父类）
    BUOY: 'buoy',                           // 浮标（父类）
    EROSION_MONITOR: 'erosion_monitor',     // 海岸侵蚀
    SMART_MARKER: 'smart_marker',           // 智能标识物
    UAV: 'uav',                             // 无人机
    USV: 'usv',                             // 无人艇

    // 二级分类 - 岸基观测站子类
    SURGE_STATION: 'surge_station',         // 风暴潮核定站
    COASTAL_BASE: 'coastal_base',           // 岸基观测站
    TIDE_STATION: 'tide_station',           // 潮位站

    // 二级分类 - 浮标子类
    WAVE_BUOY: 'wave_buoy',                 // 波浪谱浮标（锚定）
    DISPOSABLE_BUOY: 'disposable_buoy',     // 抛弃式浮标
    ARGO_BUOY: 'argo_buoy',                 // Argo浮标
}

// 设备类型树形结构配置
export const deviceTypeTree = [
    {
        id: DEVICE_TYPES.COASTAL_STATION,
        name: '岸基观测站',
        icon: 'fa-tower-observation',
        color: '#4A8FC4',
        children: [
            { id: DEVICE_TYPES.SURGE_STATION, name: '风暴潮核定站', count: 36, icon: 'fa-water', color: '#5F9FB9' },
            { id: DEVICE_TYPES.COASTAL_BASE, name: '岸基观测站', count: 65, icon: 'fa-tower-observation', color: '#4A8FC4' },
            { id: DEVICE_TYPES.TIDE_STATION, name: '潮位站', count: 17, icon: 'fa-chart-line', color: '#4FB3D8' },
        ]
    },
    {
        id: DEVICE_TYPES.BUOY,
        name: '浮标',
        icon: 'fa-circle-dot',
        color: '#5A91D8',
        children: [
            { id: DEVICE_TYPES.WAVE_BUOY, name: '波浪谱浮标（锚定）', count: 20, icon: 'fa-bullseye', color: '#5A91D8' },
            { id: DEVICE_TYPES.DISPOSABLE_BUOY, name: '抛弃式浮标', count: 18, icon: 'fa-circle', color: '#6F8EA8' },
            { id: DEVICE_TYPES.ARGO_BUOY, name: 'Argo浮标', count: 10, icon: 'fa-circle-dot', color: '#7B9BB2' },
        ]
    },
    {
        id: DEVICE_TYPES.EROSION_MONITOR,
        name: '海岸侵蚀',
        icon: 'fa-video',
        color: '#5F9FB9',
        count: 12,
        children: []
    },
    {
        id: DEVICE_TYPES.SMART_MARKER,
        name: '智能标识物',
        icon: 'fa-location-dot',
        color: '#6A97B8',
        count: 10,
        children: []
    },
    {
        id: DEVICE_TYPES.UAV,
        name: '无人机',
        icon: 'fa-helicopter',
        color: '#6C9AB8',
        count: 20,
        children: []
    },
    {
        id: DEVICE_TYPES.USV,
        name: '无人艇',
        icon: 'fa-ship',
        color: '#5F89A7',
        count: 12,
        children: []
    },
]

// 设备类型详细配置（用于观测要素和阈值）
export const deviceTypeConfig = {
    [DEVICE_TYPES.SURGE_STATION]: {
        name: '风暴潮核定站',
        icon: 'fa-water',
        color: '#5F9FB9',
        count: 36,
        parent: DEVICE_TYPES.COASTAL_STATION,
        elements: [
            { key: 'surge', name: '增水值', unit: 'cm', chartType: 'line' },
            { key: 'tideLevel', name: '潮位', unit: 'm', chartType: 'line' },
            { key: 'windSpeed', name: '风速', unit: 'm/s', chartType: 'bar' },
            { key: 'windDir', name: '风向', unit: '°', chartType: 'radar' },
        ],
        thresholds: {
            surge: { blue: 50, yellow: 100, orange: 150, red: 200 },
            tideLevel: { blue: 2.0, yellow: 2.5, orange: 3.0, red: 3.5 },
        }
    },
    [DEVICE_TYPES.COASTAL_BASE]: {
        name: '岸基观测站',
        icon: 'fa-tower-observation',
        color: '#4A8FC4',
        count: 65,
        parent: DEVICE_TYPES.COASTAL_STATION,
        elements: [
            { key: 'windSpeed', name: '风速', unit: 'm/s', chartType: 'line' },
            { key: 'windDir', name: '风向', unit: '°', chartType: 'radar' },
            { key: 'pressure', name: '气压', unit: 'hPa', chartType: 'line' },
            { key: 'visibility', name: '能见度', unit: 'km', chartType: 'line' },
        ],
        thresholds: {
            windSpeed: { blue: 10.8, yellow: 17.2, orange: 24.5, red: 32.7 },
        }
    },
    [DEVICE_TYPES.TIDE_STATION]: {
        name: '潮位站',
        icon: 'fa-chart-line',
        color: '#4FB3D8',
        count: 17,
        parent: DEVICE_TYPES.COASTAL_STATION,
        elements: [
            { key: 'tideLevel', name: '潮位', unit: 'm', chartType: 'line' },
            { key: 'tideChange', name: '潮位变化率', unit: 'cm/h', chartType: 'bar' },
        ],
        thresholds: {
            tideLevel: { blue: 2.0, yellow: 2.5, orange: 3.0, red: 3.5 },
        }
    },
    [DEVICE_TYPES.WAVE_BUOY]: {
        name: '波浪谱浮标（锚定）',
        icon: 'fa-bullseye',
        color: '#5A91D8',
        count: 20,
        parent: DEVICE_TYPES.BUOY,
        elements: [
            { key: 'waveHeight', name: '波高', unit: 'm', chartType: 'line' },
            { key: 'wavePeriod', name: '波周期', unit: 's', chartType: 'line' },
            { key: 'seaTemp', name: '海温', unit: '°C', chartType: 'line' },
        ],
        thresholds: {
            waveHeight: { blue: 2.5, yellow: 4.0, orange: 6.0, red: 9.0 },
        }
    },
    [DEVICE_TYPES.DISPOSABLE_BUOY]: {
        name: '抛弃式浮标',
        icon: 'fa-circle',
        color: '#6F8EA8',
        count: 18,
        parent: DEVICE_TYPES.BUOY,
        elements: [
            { key: 'seaTemp', name: '海温', unit: '°C', chartType: 'line' },
            { key: 'salinity', name: '盐度', unit: 'PSU', chartType: 'line' },
        ],
        thresholds: {}
    },
    [DEVICE_TYPES.ARGO_BUOY]: {
        name: 'Argo浮标',
        icon: 'fa-circle-dot',
        color: '#7B9BB2',
        count: 10,
        parent: DEVICE_TYPES.BUOY,
        elements: [
            { key: 'depth', name: '下潜深度', unit: 'm', chartType: 'line' },
            { key: 'seaTemp', name: '海温', unit: '°C', chartType: 'line' },
            { key: 'salinity', name: '盐度', unit: 'PSU', chartType: 'line' },
        ],
        thresholds: {}
    },
    [DEVICE_TYPES.EROSION_MONITOR]: {
        name: '海岸侵蚀',
        icon: 'fa-video',
        color: '#5F9FB9',
        count: 12,
        elements: [
            { key: 'erosionRate', name: '侵蚀速率', unit: 'm/年', chartType: 'line' },
            { key: 'coastlineChange', name: '岸线变化', unit: 'm', chartType: 'area' },
        ],
        thresholds: {
            erosionRate: { blue: 0.5, yellow: 1.0, orange: 2.0, red: 3.0 },
        }
    },
    [DEVICE_TYPES.SMART_MARKER]: {
        name: '智能标识物',
        icon: 'fa-location-dot',
        color: '#6A97B8',
        count: 10,
        elements: [
            { key: 'position', name: '位置偏移', unit: 'm', chartType: 'line' },
            { key: 'battery', name: '电量', unit: '%', chartType: 'gauge' },
        ],
        thresholds: {}
    },
    [DEVICE_TYPES.UAV]: {
        name: '无人机',
        icon: 'fa-helicopter',
        color: '#6C9AB8',
        count: 20,
        elements: [
            { key: 'altitude', name: '飞行高度', unit: 'm', chartType: 'line' },
            { key: 'battery', name: '电量', unit: '%', chartType: 'gauge' },
            { key: 'flightTime', name: '飞行时长', unit: 'min', chartType: 'line' },
        ],
        thresholds: {}
    },
    [DEVICE_TYPES.USV]: {
        name: '无人艇',
        icon: 'fa-ship',
        color: '#5F89A7',
        count: 12,
        elements: [
            { key: 'speed', name: '航速', unit: 'kn', chartType: 'line' },
            { key: 'battery', name: '电量', unit: '%', chartType: 'gauge' },
            { key: 'waterDepth', name: '水深', unit: 'm', chartType: 'line' },
        ],
        thresholds: {}
    },
}

// 预警等级配色
export const ALERT_LEVEL_COLORS = {
    blue: { color: '#3B82F6', name: '蓝色预警', level: 'IV' },
    yellow: { color: '#EAB308', name: '黄色预警', level: 'III' },
    orange: { color: '#F97316', name: '橙色预警', level: 'II' },
    red: { color: '#EF4444', name: '红色预警', level: 'I' },
}

// 图例配置（按图层类型）
export const legendConfig = {
    // 观测站点图例
    stations: {
        id: 'stations',
        title: '观测站点',
        items: [
            { color: '#4FB3D8', label: '正常', type: 'dot' },
            { color: '#F59E0B', label: '预警', type: 'dot', animate: true },
            { color: '#EF4444', label: '告警', type: 'dot', animate: true },
            { color: '#6B7280', label: '离线', type: 'dot' },
        ]
    },
    // 台风图例
    typhoon: {
        id: 'typhoon',
        title: '台风路径',
        items: [
            { color: '#EF4444', label: '历史路径', type: 'line' },
            { color: '#F97316', label: '预测路径', type: 'dashed' },
            { color: '#3B82F6', label: '7级风圈', type: 'circle' },
            { color: '#F97316', label: '10级风圈', type: 'circle' },
            { color: '#EF4444', label: '12级风圈', type: 'circle' },
        ]
    },
    // 船舶图例
    vessels: {
        id: 'vessels',
        title: '海上船舶',
        items: [
            { color: '#4FB3D8', label: '正常', type: 'dot' },
            { color: '#F59E0B', label: '警告', type: 'dot' },
        ]
    },
    // 风场图例
    wind_particle: {
        id: 'wind_particle',
        title: '风场粒子',
        items: [
            { color: '#FFFFFF', label: '风向流线', type: 'line' },
        ]
    },
    // 海浪热力图图例
    wave_heatmap: {
        id: 'wave_heatmap',
        title: '海浪热力图',
        items: [
            { color: '#EF4444', label: '6m以上', type: 'gradient' },
            { color: '#F97316', label: '4-6m', type: 'gradient' },
            { color: '#EAB308', label: '2.5-4m', type: 'gradient' },
            { color: '#3B82F6', label: '2.5m以下', type: 'gradient' },
        ]
    },
}

// 获取设备统计（按树形结构汇总）
export function getDeviceStats() {
    const stats = {
        total: 0,
        byCategory: [],
    }

    deviceTypeTree.forEach(category => {
        let categoryTotal = 0
        const children = []

        if (category.children && category.children.length > 0) {
            category.children.forEach(child => {
                categoryTotal += child.count
                children.push({
                    id: child.id,
                    name: child.name,
                    count: child.count,
                    icon: child.icon,
                    color: child.color,
                })
            })
        } else if (category.count) {
            categoryTotal = category.count
        }

        stats.total += categoryTotal
        stats.byCategory.push({
            id: category.id,
            name: category.name,
            icon: category.icon,
            color: category.color,
            total: categoryTotal,
            children: children,
        })
    })

    return stats
}

// 根据值获取预警等级
export function getAlertLevel(deviceType, elementKey, value) {
    const config = deviceTypeConfig[deviceType]
    if (!config || !config.thresholds[elementKey]) return null

    const thresholds = config.thresholds[elementKey]

    if (value >= thresholds.red) return 'red'
    if (value >= thresholds.orange) return 'orange'
    if (value >= thresholds.yellow) return 'yellow'
    if (value >= thresholds.blue) return 'blue'
    return null
}
