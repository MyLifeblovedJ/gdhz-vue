/**
 * 广东省海洋灾害综合决策系统 - Mock 数据
 * 预留标准化接口，方便后续对接真实 API
 */

import { DEVICE_TYPES, deviceTypeConfig, deviceTypeTree } from './deviceConfig'

// ===== 生成设备数据的辅助函数 =====
function generateDevices(type, count, baseLocations) {
    const config = deviceTypeConfig[type]
    if (!config) return []

    const devices = []

    for (let i = 0; i < count; i++) {
        const baseLoc = baseLocations[i % baseLocations.length]
        const status = getRandomStatus()
        const device = {
            id: `${type}_${String(i + 1).padStart(3, '0')}`,
            name: `${config.name}${i + 1}`,
            type: type,
            typeName: config.name,
            icon: config.icon,
            color: config.color,
            lat: baseLoc.lat + (Math.random() - 0.5) * 0.5,
            lng: baseLoc.lng + (Math.random() - 0.5) * 0.5,
            status: status,
            val: getRandomValue(type, status),
            lastUpdate: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        }
        devices.push(device)
    }

    return devices
}

function getRandomStatus() {
    const rand = Math.random()
    if (rand < 0.75) return 'online'
    if (rand < 0.85) return 'warn'
    if (rand < 0.92) return 'alarm'
    return 'offline'
}

function getRandomValue(type, status) {
    const baseValues = {
        [DEVICE_TYPES.SURGE_STATION]: { normal: '45cm', warn: '120cm', alarm: '185cm' },
        [DEVICE_TYPES.COASTAL_BASE]: { normal: '12m/s', warn: '22m/s', alarm: '35m/s' },
        [DEVICE_TYPES.TIDE_STATION]: { normal: '1.8m', warn: '2.6m', alarm: '3.2m' },
        [DEVICE_TYPES.WAVE_BUOY]: { normal: '2.1m', warn: '4.5m', alarm: '6.8m' },
        [DEVICE_TYPES.DISPOSABLE_BUOY]: { normal: '18.5°C', warn: '22°C', alarm: '25°C' },
        [DEVICE_TYPES.ARGO_BUOY]: { normal: '500m', warn: '200m', alarm: '50m' },
        [DEVICE_TYPES.EROSION_MONITOR]: { normal: '0.3m/年', warn: '1.2m/年', alarm: '2.5m/年' },
        [DEVICE_TYPES.SMART_MARKER]: { normal: '正常', warn: '偏移0.5m', alarm: '偏移1.2m' },
        [DEVICE_TYPES.UAV]: { normal: '巡航中', warn: '低电量', alarm: '失联' },
        [DEVICE_TYPES.USV]: { normal: '作业中', warn: '低电量', alarm: '失联' },
    }

    const typeValues = baseValues[type] || { normal: '--', warn: '--', alarm: '--' }

    if (status === 'alarm') return typeValues.alarm
    if (status === 'warn') return typeValues.warn
    if (status === 'offline') return '--'
    return typeValues.normal
}

// 广东沿海主要观测点位置
const guangdongCoastalLocations = [
    { lat: 22.27, lng: 113.57, name: '珠海' },
    { lat: 22.54, lng: 114.05, name: '深圳' },
    { lat: 23.35, lng: 116.68, name: '汕头' },
    { lat: 21.27, lng: 110.35, name: '湛江' },
    { lat: 21.87, lng: 111.98, name: '阳江' },
    { lat: 22.78, lng: 115.10, name: '惠州' },
    { lat: 21.44, lng: 111.10, name: '茂名' },
    { lat: 22.76, lng: 115.35, name: '汕尾' },
    { lat: 21.90, lng: 113.70, name: '大万山岛' },
    { lat: 22.20, lng: 114.30, name: '担杆岛' },
]

// ===== 生成全量观测设备（基于树形结构） =====
export const mockDevices = [
    // 岸基观测站类（包含3个子类）
    ...generateDevices(DEVICE_TYPES.SURGE_STATION, 36, guangdongCoastalLocations),
    ...generateDevices(DEVICE_TYPES.COASTAL_BASE, 65, guangdongCoastalLocations),
    ...generateDevices(DEVICE_TYPES.TIDE_STATION, 17, guangdongCoastalLocations),
    // 浮标类（包含3个子类）
    ...generateDevices(DEVICE_TYPES.WAVE_BUOY, 20, guangdongCoastalLocations),
    ...generateDevices(DEVICE_TYPES.DISPOSABLE_BUOY, 18, guangdongCoastalLocations),
    ...generateDevices(DEVICE_TYPES.ARGO_BUOY, 10, guangdongCoastalLocations),
    // 其他类型
    ...generateDevices(DEVICE_TYPES.EROSION_MONITOR, 12, guangdongCoastalLocations),
    ...generateDevices(DEVICE_TYPES.SMART_MARKER, 10, guangdongCoastalLocations),
    ...generateDevices(DEVICE_TYPES.UAV, 20, guangdongCoastalLocations),
    ...generateDevices(DEVICE_TYPES.USV, 12, guangdongCoastalLocations),
]

// ===== 统计数据 =====
export const mockStats = {
    totalDevices: mockDevices.length,
    onlineDevices: mockDevices.filter(d => d.status === 'online').length,
    alertDevices: mockDevices.filter(d => d.status === 'alarm' || d.status === 'warn').length,
    offlineDevices: mockDevices.filter(d => d.status === 'offline').length,
}

// ===== 观测数据库统计 =====
export const mockDatabaseStats = {
    dataTypes: 28,           // 观测数据类型数
    totalRecords: '4.2亿',   // 总记录数
    totalSize: '1.8TB',      // 数据总量
    dailyIngest: '120万',    // 日增数据量
    // StatBar 使用的数字格式
    totalData: 1.8,          // TB
    todayData: 120,          // 万条
    lastUpdate: new Date().toISOString(),
}

// ===== 预警数据 =====
export const mockAlerts = [
    {
        id: 'A001',
        type: 'surge',
        level: 'red',
        title: '珠江口风暴潮红色预警',
        time: '10:00',
        icon: '/icons/stormred.png',
        description: '预计最大增水180cm，请沿海地区做好防范准备',
        issuer: '广东省自然资源厅',
        validUntil: '14:00'
    },
    {
        id: 'A002',
        type: 'wave',
        level: 'red',
        title: '粤东海域海浪红色预警',
        time: '09:30',
        icon: '/icons/wavered.png',
        description: '预计最大浪高6.5米，请渔船回港避风',
        issuer: '国家海洋预报台',
        validUntil: '18:00'
    },
    {
        id: 'A003',
        type: 'wave',
        level: 'yellow',
        title: '珠江口海浪黄色预警',
        time: '08:00',
        icon: '/icons/waveyellow.png',
        description: '预计最大浪高3.5米，请注意航行安全',
        issuer: '珠海市气象局',
        validUntil: '20:00'
    },
    {
        id: 'A004',
        type: 'surge',
        level: 'orange',
        title: '湛江港风暴潮橙色预警',
        time: '07:00',
        icon: '/icons/stormorange.png',
        description: '预计最大增水120cm',
        issuer: '广东省自然资源厅',
        validUntil: '16:00'
    },
    {
        id: 'A005',
        type: 'wave',
        level: 'yellow',
        title: '阳江海域海浪黄色预警',
        time: '06:30',
        icon: '/icons/waveyellow.png',
        description: '预计最大浪高4.0米',
        issuer: '阳江市气象局',
        validUntil: '22:00'
    },
]

// ===== 滚动预警消息 =====
export const mockMarqueeMessages = [
    '【紧急预警】珠江口外海域发布风暴潮红色预警，预计最大增水180cm，请沿海地区做好防范准备',
    '【紧急预警】大万山岛附近海域发布海浪红色预警，预计最大浪高6.5米，请渔船回港避风',
    '【防御提示】粤东沿海地区请密切关注潮位变化，做好低洼地区人员转移准备',
]

// ===== 风险决策数据 =====
export const mockRiskDecisions = {
    currentDisaster: {
        type: 'surge',
        typeName: '风暴潮',
        level: 'red',
        levelName: '红色预警',
        startTime: '2026-01-13T06:00:00',
        location: '珠江口外海域',
        peakTime: '2026-01-13T14:00:00',
        affectedAreas: ['珠海市', '中山市', '江门市', '深圳市'],
        description: '受台风"天鸽"影响，珠江口外海域将出现180cm以上的风暴增水，叠加天文大潮，部分岸段有漫堤风险。',
    },
    risks: [
        {
            id: 'R001',
            type: 'dike_overflow',
            level: 'high',
            title: '海堤漫溢风险',
            location: '珠海香洲段',
            description: '风暴潮增水叠加天文大潮，预计14:00左右潮位将达到3.2m，超过海堤警戒水位0.5m，存在漫堤风险。',
            affectedPop: '约15万人',
        },
        {
            id: 'R002',
            type: 'seawater_backflow',
            level: 'medium',
            title: '海水倒灌风险',
            location: '中山沿海低洼地区',
            description: '若发生漫堤，海水将倒灌至内陆低洼地区，可能造成农田盐碱化。',
            affectedArea: '约2000公顷农田',
        },
        {
            id: 'R003',
            type: 'vessel_safety',
            level: 'high',
            title: '渔船安全风险',
            location: '珠江口海域',
            description: '海上风力达10-11级，浪高6-7米，在海作业渔船需立即回港避风。',
            affectedVessels: '约350艘',
        },
        {
            id: 'R004',
            type: 'coastal_erosion',
            level: 'medium',
            title: '海岸侵蚀加剧',
            location: '阳江海陵岛',
            description: '受持续大浪冲刷，海滩侵蚀速率加快，部分临海建筑地基受损风险增加。',
            affectedArea: '约5公里岸线',
        },
        {
            id: 'R005',
            type: 'infrastructure',
            level: 'low',
            title: '港口设施损坏',
            location: '湛江港区',
            description: '大风大浪可能导致码头设施、系泊设备受损，需加强巡检和加固。',
        },
    ],
    recommendations: {
        responseLevel: 'II',
        responseName: '二级应急响应',
        actions: [
            '启动防风防潮应急预案',
            '组织沿海低洼地区人员转移',
            '通知在海渔船回港避风',
            '加强海堤巡查和应急值守',
            '做好排涝泵站准备工作',
        ],
        tools: [
            { id: 'surge_forecast', name: '增水场预报', icon: 'fa-chart-area' },
            { id: 'tide_forecast', name: '潮位预报', icon: 'fa-chart-line' },
            { id: 'inundation_sim', name: '淹没模拟', icon: 'fa-water' },
            { id: 'evacuation_route', name: '疏散路线', icon: 'fa-route' },
        ],
    },
}

// ===== 台风数据 =====
export const mockTyphoonData = {
    id: 'TY2601',
    name: '天鸽',
    enName: 'Hato',
    status: 'active',
    category: '超强台风',
    track: [
        { time: '2026-01-12T00:00', lat: 18.5, lng: 125.5, pressure: 998, windSpeed: 18 },
        { time: '2026-01-12T06:00', lat: 19.0, lng: 123.0, pressure: 992, windSpeed: 25 },
        { time: '2026-01-12T12:00', lat: 19.8, lng: 120.5, pressure: 975, windSpeed: 35 },
        { time: '2026-01-12T18:00', lat: 20.5, lng: 118.0, pressure: 955, windSpeed: 45 },
        { time: '2026-01-13T00:00', lat: 21.2, lng: 115.5, pressure: 940, windSpeed: 52 },
        { time: '2026-01-13T06:00', lat: 21.8, lng: 114.0, pressure: 935, windSpeed: 55 },
    ],
    forecast: [
        { time: '2026-01-13T12:00', lat: 22.3, lng: 113.2, probability: 0.8 },
        { time: '2026-01-13T18:00', lat: 22.8, lng: 112.5, probability: 0.6 },
        { time: '2026-01-14T00:00', lat: 23.5, lng: 111.8, probability: 0.4 },
    ],
    windCircle: {
        center: { lat: 21.8, lng: 114.0 },
        radius7: 280,
        radius10: 120,
        radius12: 50,
    },
}

// ===== 历史灾害匹配数据 =====
export const mockHistoricalMatches = {
    current: {
        name: '天鸽',
        category: '超强台风',
        maxWindSpeed: 55,
        minPressure: 935,
        landingLocation: '珠海金湾区',
        estimatedLanding: '2026-01-13 14:00'
    },
    matches: [
        {
            id: 'TY1822',
            name: '山竹',
            year: 2018,
            similarity: 0.93,
            category: '超强台风',
            maxWindSpeed: 62,
            minPressure: 910,
            landingLocation: '台山市海宴镇',
            landingTime: '2018-09-16 17:00',
            affectedAreas: ['江门', '阳江', '茂名', '珠海'],
            casualties: {
                deaths: 6,
                injured: 165,
                missing: 2
            },
            economicLoss: 52.0,
            details: {
                maxStormSurge: 3.15,
                maxWaveHeight: 14.0,
                evacuation: 320000,
                affectedPopulation: 4300000
            }
        },
        {
            id: 'TY1509',
            name: '彩虹',
            year: 2015,
            similarity: 0.82,
            category: '超强台风',
            maxWindSpeed: 62,
            minPressure: 910,
            landingLocation: '湛江坡头区',
            landingTime: '2015-10-04 14:10',
            affectedAreas: ['湛江', '茂名', '阳江'],
            casualties: {
                deaths: 5,
                injured: 213,
                missing: 1
            },
            economicLoss: 32.8,
            details: {
                maxStormSurge: 2.15,
                maxWaveHeight: 9.2,
                evacuation: 435000,
                affectedPopulation: 2800000
            }
        },
        {
            id: 'TY0814',
            name: '黑格比',
            year: 2008,
            similarity: 0.76,
            category: '强台风',
            maxWindSpeed: 48,
            minPressure: 960,
            landingLocation: '电白区',
            landingTime: '2008-09-24 04:20',
            affectedAreas: ['茂名', '阳江', '江门'],
            casualties: {
                deaths: 3,
                injured: 127,
                missing: 0
            },
            economicLoss: 18.6,
            details: {
                maxStormSurge: 1.95,
                maxWaveHeight: 7.3,
                evacuation: 187000,
                affectedPopulation: 1900000
            }
        }
    ]
}

// ===== 船舶数据 =====
export const mockVesselData = Array.from({ length: 150 }, (_, i) => ({
    id: `V${String(i + 1).padStart(4, '0')}`,
    name: `渔船${i + 1}`,
    type: ['渔船', '货船', '客船'][Math.floor(Math.random() * 3)],
    lat: 20.5 + Math.random() * 3,
    lng: 111 + Math.random() * 6,
    heading: Math.floor(Math.random() * 360),
    speed: Math.random() * 15,
    status: Math.random() > 0.2 ? 'normal' : 'warning',
}))

// ===== 导航菜单 =====
export const navItems = [
    { key: 'overview', label: '态势感知', path: '/' },
    { key: 'surge', label: '风暴潮', path: '/surge' },
    { key: 'wave', label: '海浪', path: '/wave' },
    { key: 'redtide', label: '赤潮', path: '/redtide' },
    { key: 'tsunami', label: '海啸', path: '/tsunami' },
    { key: 'saltwater', label: '咸潮入侵', path: '/saltwater' },
    { key: 'seawater', label: '海水入侵', path: '/seawater' },
    { key: 'sealevel', label: '海平面上升', path: '/sealevel' },
    { key: 'erosion', label: '海岸侵蚀', path: '/erosion' },
    { key: 'oilspill', label: '溢油', path: '/oilspill' },
]

// ===== 图层配置 =====
export const layerGroups = [
    {
        id: 'base',
        name: '基础图层',
        layers: [
            { id: 'coastline', name: '海岸线', checked: true },
            { id: 'district', name: '行政区划', checked: false },
        ]
    },
    {
        id: 'observe',
        name: '观测网络',
        layers: [
            { id: 'surge_stations', name: '风暴潮核定站', checked: true },
            { id: 'buoys', name: '浮标站', checked: true },
            { id: 'coastal_stations', name: '岸基观测站', checked: true },
            { id: 'tide_stations', name: '潮位站', checked: true },
            { id: 'other_stations', name: '其他站点', checked: false },
        ]
    },
    {
        id: 'realtime',
        name: '实时态势',
        layers: [
            { id: 'typhoon', name: '台风路径', checked: true },
            { id: 'vessels', name: '海上船舶', checked: true },
            { id: 'wind_particle', name: '风场粒子', checked: true },
            { id: 'wave_heatmap', name: '海浪热力图', checked: true },
        ]
    },
    {
        id: 'sim',
        name: '数值模拟',
        layers: [
            { id: 'wind', name: '精细化风场', checked: false },
            { id: 'wave_field', name: '海浪场', checked: false },
            { id: 'surge', name: '风暴增水', checked: false },
        ]
    },
]

// ===== 底图配置 =====
export const basemaps = [
    { id: 'dark', name: '深色', icon: 'fa-circle-half-stroke', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' },
    { id: 'satellite', name: '卫星', icon: 'fa-satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
    { id: 'ocean', name: '海图', icon: 'fa-water', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}' },
]

// ===== 风险评估数据 =====
export const mockRiskData = [
    { city: '珠海', value: 85 },
    { city: '深圳', value: 72 },
    { city: '惠州', value: 65 },
    { city: '汕头', value: 45 },
    { city: '湛江', value: 88 },
    { city: '阳江', value: 50 },
]

// ===== 实时监控数据 =====
export const mockRealtimeData = {
    // 数据概览卡片
    overview: {
        tideLevel: {
            label: '当前潮位',
            value: 2.85,
            unit: 'm',
            trend: 'up',  // up, down, stable
            station: '珠海香洲站',
            threshold: { warn: 2.5, alarm: 3.0 },
        },
        waveHeight: {
            label: '最大浪高',
            value: 4.2,
            unit: 'm',
            trend: 'up',
            station: '大万山岛',
            threshold: { warn: 3.5, alarm: 5.0 },
        },
        windSpeed: {
            label: '风速',
            value: 22.5,
            unit: 'm/s',
            direction: 'ESE',  // 风向
            trend: 'stable',
            station: '担杆岛',
            threshold: { warn: 17.0, alarm: 25.0 },
        },
        temperature: {
            label: '海温',
            value: 24.8,
            unit: '°C',
            trend: 'down',
            station: '珠江口浮标',
            threshold: { warn: 28.0, alarm: 30.0 },
        },
    },

    // 重点监测站点列表
    keyStations: [
        { id: 'st001', name: '珠海香洲站', type: 'tide', lat: 22.27, lng: 113.57 },
        { id: 'st002', name: '深圳蛇口站', type: 'tide', lat: 22.48, lng: 113.92 },
        { id: 'st003', name: '大万山岛', type: 'wave', lat: 21.90, lng: 113.70 },
        { id: 'st004', name: '担杆岛', type: 'wind', lat: 22.20, lng: 114.30 },
        { id: 'st005', name: '湛江港站', type: 'tide', lat: 21.27, lng: 110.35 },
    ],

    // 数据质量指标
    dataQuality: {
        completeness: 96.5,  // 数据完整率 %
        lastUpdate: new Date().toISOString(),
        activeStations: 186,
        totalStations: 220,
    },
}

// 生成多站点历史数据（用于对比图表）
export function generateMultiStationData(hours = 6) {
    const stations = mockRealtimeData.keyStations
    const now = Date.now()
    const interval = 600000  // 10分钟间隔

    return stations.map(station => {
        const data = []
        for (let i = hours * 6; i >= 0; i--) {
            const time = new Date(now - i * interval)
            // 根据站点类型生成不同范围的数据
            let baseValue, amplitude
            switch (station.type) {
                case 'tide':
                    baseValue = 2.0
                    amplitude = 1.2
                    break
                case 'wave':
                    baseValue = 2.5
                    amplitude = 2.0
                    break
                case 'wind':
                    baseValue = 15
                    amplitude = 10
                    break
                default:
                    baseValue = 20
                    amplitude = 5
            }
            // 添加周期性变化和随机波动
            const value = baseValue + amplitude * Math.sin(i / 6 * Math.PI / 2) + (Math.random() - 0.5) * amplitude * 0.3
            data.push({
                time: time.toISOString(),
                value: Math.max(0, Number(value.toFixed(2))),
            })
        }
        return {
            stationId: station.id,
            stationName: station.name,
            type: station.type,
            data,
        }
    })
}

// 异常警报数据
export const mockDataAlerts = [
    {
        id: 'DA001',
        type: 'threshold_exceed',
        level: 'high',
        station: '珠海香洲站',
        stationId: 'st001',
        element: '潮位',
        message: '潮位超过警戒值 0.35m',
        value: 2.85,
        threshold: 2.5,
        time: new Date(Date.now() - 5 * 60000).toISOString(),
    },
    {
        id: 'DA002',
        type: 'threshold_exceed',
        level: 'medium',
        station: '大万山岛',
        stationId: 'st003',
        element: '浪高',
        message: '浪高超过预警值 0.7m',
        value: 4.2,
        threshold: 3.5,
        time: new Date(Date.now() - 12 * 60000).toISOString(),
    },
    {
        id: 'DA003',
        type: 'rapid_change',
        level: 'medium',
        station: '担杆岛',
        stationId: 'st004',
        element: '风速',
        message: '风速快速上升 +5.2m/s/h',
        value: 22.5,
        changeRate: 5.2,
        time: new Date(Date.now() - 18 * 60000).toISOString(),
    },
    {
        id: 'DA004',
        type: 'data_gap',
        level: 'low',
        station: '阳江站',
        stationId: 'st006',
        element: '全要素',
        message: '数据中断超过15分钟',
        lastData: new Date(Date.now() - 20 * 60000).toISOString(),
        time: new Date(Date.now() - 20 * 60000).toISOString(),
    },
    {
        id: 'DA005',
        type: 'threshold_exceed',
        level: 'high',
        station: '湛江港站',
        stationId: 'st005',
        element: '潮位',
        message: '潮位超过警戒值 0.28m',
        value: 2.78,
        threshold: 2.5,
        time: new Date(Date.now() - 25 * 60000).toISOString(),
    },
    {
        id: 'DA006',
        type: 'sensor_fault',
        level: 'low',
        station: '茂名站',
        stationId: 'st007',
        element: '温度传感器',
        message: '传感器读数异常，可能需要校准',
        time: new Date(Date.now() - 35 * 60000).toISOString(),
    },
]

// ===== 重点关注区域 =====
export const mockFocusAreas = [
    {
        id: 'FA001',
        name: '珠江口海域',
        level: 'high',
        reason: '台风"摩羯"外围影响，预计风暴潮增水120-180cm',
        affectedCities: ['珠海', '深圳', '中山'],
        population: 285,  // 万人
        keyFacilities: ['珠海港', '蛇口港', '前海经济区'],
    },
    {
        id: 'FA002',
        name: '粤东沿海',
        level: 'medium',
        reason: '海浪预警橙色，近岸浪高4-5m',
        affectedCities: ['汕头', '汕尾', '揭阳'],
        population: 156,
        keyFacilities: ['汕头港', '海门渔港'],
    },
    {
        id: 'FA003',
        name: '湛江湾',
        level: 'medium',
        reason: '天文大潮叠加，潮位接近警戒线',
        affectedCities: ['湛江'],
        population: 98,
        keyFacilities: ['湛江港', '湛江钢铁'],
    },
]

// ===== 预测趋势 =====
export const mockPredictions = {
    summary: '未来24小时内，受台风外围影响，粤中、粤东沿海风浪较大，需重点防范。',
    items: [
        {
            time: '今日 18:00',
            event: '珠江口风暴潮峰值',
            level: 'high',
            detail: '预计最大增水150-180cm，与天文潮叠加',
        },
        {
            time: '今日 20:00',
            event: '粤东海域浪高峰值',
            level: 'medium',
            detail: '最大浪高可达5-6m，不宜出海',
        },
        {
            time: '明日 06:00',
            event: '风力减弱',
            level: 'low',
            detail: '沿海风力降至6-7级，海况逐步好转',
        },
        {
            time: '明日 12:00',
            event: '预警有望解除',
            level: 'low',
            detail: '各项指标回落至正常范围',
        },
    ],
}

// ===== 应急资源概览 =====
export const mockResources = {
    rescueTeams: {
        label: '救援队伍',
        total: 42,
        deployed: 18,
        unit: '支',
    },
    rescueBoats: {
        label: '救援船只',
        total: 156,
        available: 128,
        unit: '艘',
    },
    shelters: {
        label: '避险场所',
        total: 89,
        activated: 23,
        capacity: 12.5,  // 万人
        unit: '处',
    },
    evacuated: {
        label: '已转移人员',
        value: 3.2,
        unit: '万人',
    },
}

// ===== 历史数据生成函数 =====
export function generateHistoryData(deviceId, elementKey, startTime, endTime, interval = 'hour') {
    const data = []
    const start = new Date(startTime).getTime()
    const end = new Date(endTime).getTime()
    const step = interval === 'hour' ? 3600000 : interval === 'day' ? 86400000 : 600000

    for (let t = start; t <= end; t += step) {
        data.push({
            time: new Date(t).toISOString(),
            value: Math.random() * 100 + Math.sin(t / 86400000 * Math.PI * 2) * 20,
        })
    }

    return data
}
