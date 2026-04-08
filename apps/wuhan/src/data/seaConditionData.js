/**
 * 风浪潮页面专用数据 - 静态风险研判、漫滩模拟、海堤监测等
 */

// ===== 静态风险研判数据（基于灾普数据库） =====
export const mockDisasterCensusData = {
    // 不同气压等级对应的淹没场景
    pressureScenarios: {
        '845-855': {
            label: '845-855 hPa (特强台风)',
            floodArea: 285,  // km²
            affectedTowns: 28,
            maxWaterDepth: 4.8, // m
            duration: 8, // hours
            description: '极端情景，百年一遇级别',
            concurrentRisks: [
                { name: '珠海情侣路', type: 'road', predictedDepth: 4.2, riskLevel: 'high', suggestion: '全线封闭，人员撤离至二线' },
                { name: '横琴新区', type: 'population', predictedDepth: 3.5, riskLevel: 'high', suggestion: '启动I级紧急疏散' },
                { name: '高栏港', type: 'port', predictedDepth: 4.5, riskLevel: 'high', suggestion: '停止所有作业，机械加固' }
            ]
        },
        '855-875': {
            label: '855-875 hPa (超强台风)',
            floodArea: 195,
            affectedTowns: 22,
            maxWaterDepth: 3.5,
            duration: 6,
            description: '重大情景，50年一遇级别',
            concurrentRisks: [
                { name: '珠海情侣路', type: 'road', predictedDepth: 3.0, riskLevel: 'high', suggestion: '全线封闭' },
                { name: '横琴新区', type: 'population', predictedDepth: 2.2, riskLevel: 'medium', suggestion: '低洼地区人员疏散' },
                { name: '高栏港', type: 'port', predictedDepth: 3.2, riskLevel: 'high', suggestion: '停止作业' }
            ]
        },
        '875-895': {
            label: '875-895 hPa (强台风)',
            floodArea: 125,
            affectedTowns: 15,
            maxWaterDepth: 2.8,
            duration: 5,
            description: '较大情景，20年一遇级别',
            concurrentRisks: [
                { name: '珠海海滨泳场', type: 'tourist', predictedDepth: 2.5, riskLevel: 'high', suggestion: '关闭并疏散游客' },
                { name: '香洲港', type: 'port', predictedDepth: 2.0, riskLevel: 'medium', suggestion: '渔船回港避风' }
            ]
        },
        '895-920': {
            label: '895-920 hPa (台风)',
            floodArea: 68,
            affectedTowns: 8,
            maxWaterDepth: 1.8,
            duration: 4,
            description: '一般情景，10年一遇级别',
            concurrentRisks: [
                { name: '淇澳岛低洼处', type: 'population', predictedDepth: 1.2, riskLevel: 'medium', suggestion: '转移安置' }
            ]
        },
        '920-950': {
            label: '920-950 hPa (强热带风暴)',
            floodArea: 32,
            affectedTowns: 4,
            maxWaterDepth: 1.2,
            duration: 3,
            description: '较小情景，5年一遇级别',
            concurrentRisks: []
        },
        '950-980': {
            label: '950-980 hPa (热带风暴)',
            floodArea: 12,
            affectedTowns: 2,
            maxWaterDepth: 0.8,
            duration: 2,
            description: '轻微情景，常见级别',
            concurrentRisks: []
        },
    },

    // 承灾体数据
    vulnerabilities: {
        populationCenters: [
            { id: 'PC001', name: '珠海横琴新区', type: 'population', population: 52000, lat: 22.13, lng: 113.53, evacuationRouteId: 'ER001' },
            { id: 'PC002', name: '深圳蛇口片区', type: 'population', population: 128000, lat: 22.48, lng: 113.92, evacuationRouteId: 'ER002' },
            { id: 'PC003', name: '中山坦洲镇', type: 'population', population: 86000, lat: 22.26, lng: 113.48, evacuationRouteId: 'ER003' },
            { id: 'PC004', name: '惠州大亚湾', type: 'population', population: 95000, lat: 22.72, lng: 114.53, evacuationRouteId: 'ER004' },
            { id: 'PC005', name: '湛江霞山区', type: 'population', population: 210000, lat: 21.19, lng: 110.40, evacuationRouteId: 'ER005' },
            { id: 'PC006', name: '汕头濠江区', type: 'population', population: 76000, lat: 23.28, lng: 116.73, evacuationRouteId: 'ER006' },
            { id: 'PC007', name: '阳江海陵岛', type: 'population', population: 35000, lat: 21.63, lng: 111.95, evacuationRouteId: 'ER007' },
            { id: 'PC008', name: '珠海金湾区', type: 'population', population: 68000, lat: 22.05, lng: 113.35, evacuationRouteId: 'ER008' },
        ],
        touristAreas: [
            { id: 'TA001', name: '珠海长隆海洋王国', type: 'tourist', dailyVisitors: 35000, lat: 22.10, lng: 113.55 },
            { id: 'TA002', name: '阳江海陵岛大角湾', type: 'tourist', dailyVisitors: 15000, lat: 21.65, lng: 111.98 },
            { id: 'TA003', name: '汕头南澳岛', type: 'tourist', dailyVisitors: 8000, lat: 23.42, lng: 117.02 },
        ],
        fishingPorts: [
            { id: 'FP001', name: '珠海万山渔港', type: 'fishingPort', vessels: 320, lat: 21.92, lng: 113.72 },
            { id: 'FP002', name: '深圳盐田渔港', type: 'fishingPort', vessels: 180, lat: 22.55, lng: 114.25 },
            { id: 'FP003', name: '湛江硇洲渔港', type: 'fishingPort', vessels: 450, lat: 21.05, lng: 110.55 },
            { id: 'FP004', name: '汕头海门渔港', type: 'fishingPort', vessels: 280, lat: 23.20, lng: 116.70 },
            { id: 'FP005', name: '阳江闸坡渔港', type: 'fishingPort', vessels: 520, lat: 21.58, lng: 111.82 },
        ],
        aquaculture: [
            { id: 'AQ001', name: '珠海斗门养殖区', type: 'aquaculture', area: 1800, lat: 22.20, lng: 113.30 },
            { id: 'AQ002', name: '湛江遂溪养殖区', type: 'aquaculture', area: 2500, lat: 21.38, lng: 110.25 },
            { id: 'AQ003', name: '阳江阳西养殖区', type: 'aquaculture', area: 1200, lat: 21.75, lng: 111.60 },
        ],
    },

    // 疏散路径数据
    evacuationRoutes: {
        'ER001': {
            id: 'ER001',
            name: '横琴→十字门疏散点',
            origin: { lat: 22.13, lng: 113.53, name: '珠海横琴新区' },
            destination: { lat: 22.18, lng: 113.52, name: '十字门商务区疏散点' },
            distance: 5.2,  // km
            estimatedTime: 15,  // 分钟
            capacity: 20000,  // 人
            path: [
                [113.53, 22.13],
                [113.52, 22.15],
                [113.52, 22.18],
            ],
        },
        'ER002': {
            id: 'ER002',
            name: '蛇口→南山疏散点',
            origin: { lat: 22.48, lng: 113.92, name: '深圳蛇口片区' },
            destination: { lat: 22.53, lng: 113.93, name: '南山区高地疏散点' },
            distance: 6.8,
            estimatedTime: 20,
            capacity: 50000,
            path: [
                [113.92, 22.48],
                [113.92, 22.50],
                [113.93, 22.53],
            ],
        },
        // ... 更多疏散路径
    },
}

// ===== 动态漫滩模拟数据 =====
export const mockFloodSimulation = {
    metadata: {
        source: '广东省海洋预报台',
        createTime: '2026-01-27 10:00',
        typhoonName: '苏拉',
        simulationPeriod: {
            start: '2026-01-27 14:00',
            end: '2026-01-27 20:00',
        },
    },

    // 模拟结果摘要
    summary: {
        maxFloodArea: 85,  // km²
        maxWaterDepth: 2.3,  // m
        maxDepthLocation: '珠海香洲',
        peakTime: '2026-01-27 16:30',
        duration: 4,  // 小时
        affectedPopulation: 156000,
    },

    // 并发风险（与承灾体叠加）
    concurrentRisks: [
        {
            id: 'CR001',
            vulnerabilityId: 'FP001',
            type: 'fishingPort',
            name: '珠海万山渔港',
            predictedDepth: 1.8,
            riskLevel: 'high',
            suggestion: '所有渔船需提前转移至安全区域',
        },
        {
            id: 'CR002',
            vulnerabilityId: 'PC001',
            type: 'population',
            name: '珠海横琴新区',
            affectedPopulation: 21000,
            predictedDepth: 1.2,
            riskLevel: 'high',
            suggestion: '建议立即启动人员疏散',
        },
        {
            id: 'CR003',
            vulnerabilityId: 'TA001',
            type: 'tourist',
            name: '珠海长隆海洋王国',
            predictedDepth: 0.8,
            riskLevel: 'medium',
            suggestion: '建议临时关闭，疏散游客',
        },
    ],

    // 时序数据（简化版，实际为GeoJSON）
    timeSeriesData: [
        { time: '2026-01-27 14:00', floodArea: 12, maxDepth: 0.5 },
        { time: '2026-01-27 14:30', floodArea: 28, maxDepth: 0.9 },
        { time: '2026-01-27 15:00', floodArea: 45, maxDepth: 1.3 },
        { time: '2026-01-27 15:30', floodArea: 62, maxDepth: 1.7 },
        { time: '2026-01-27 16:00', floodArea: 78, maxDepth: 2.1 },
        { time: '2026-01-27 16:30', floodArea: 85, maxDepth: 2.3 },  // 峰值
        { time: '2026-01-27 17:00', floodArea: 76, maxDepth: 2.0 },
        { time: '2026-01-27 17:30', floodArea: 58, maxDepth: 1.6 },
        { time: '2026-01-27 18:00', floodArea: 42, maxDepth: 1.2 },
        { time: '2026-01-27 18:30', floodArea: 28, maxDepth: 0.8 },
        { time: '2026-01-27 19:00', floodArea: 15, maxDepth: 0.5 },
        { time: '2026-01-27 19:30', floodArea: 8, maxDepth: 0.3 },
        { time: '2026-01-27 20:00', floodArea: 3, maxDepth: 0.1 },
    ],
}

// ===== 海堤风险监测数据 =====
export const mockSeawallData = {
    totalLength: 1248,  // km
    highRiskCount: 6,

    seawalls: [
        {
            id: 'SW001',
            name: '珠海横琴段',
            length: 3.2,  // km
            designStandard: '50年一遇',
            crestElevation: 3.5,  // m
            predictedTideLevel: 3.8,
            overtopping: 0.3,  // 超堤顶高度
            riskLevel: 'high',
            riskType: '越浪/溃堤',
            lat: 22.12,
            lng: 113.52,
            historicalIncidents: 2,
            lastInspection: '2025-12-15',
        },
        {
            id: 'SW002',
            name: '深圳蛇口段',
            length: 2.1,
            designStandard: '100年一遇',
            crestElevation: 4.2,
            predictedTideLevel: 3.7,
            overtopping: -0.5,  // 负值表示未超
            riskLevel: 'medium',
            riskType: '需关注',
            lat: 22.48,
            lng: 113.93,
            historicalIncidents: 0,
            lastInspection: '2025-11-20',
        },
        {
            id: 'SW003',
            name: '中山坦洲段',
            length: 4.5,
            designStandard: '30年一遇',
            crestElevation: 3.2,
            predictedTideLevel: 3.5,
            overtopping: 0.3,
            riskLevel: 'high',
            riskType: '越浪风险',
            lat: 22.25,
            lng: 113.47,
            historicalIncidents: 3,
            lastInspection: '2025-10-08',
        },
        {
            id: 'SW004',
            name: '惠州大亚湾段',
            length: 5.8,
            designStandard: '50年一遇',
            crestElevation: 3.8,
            predictedTideLevel: 3.4,
            overtopping: -0.4,
            riskLevel: 'low',
            riskType: '正常',
            lat: 22.70,
            lng: 114.52,
            historicalIncidents: 1,
            lastInspection: '2025-12-01',
        },
        {
            id: 'SW005',
            name: '湛江霞山段',
            length: 3.6,
            designStandard: '50年一遇',
            crestElevation: 3.6,
            predictedTideLevel: 3.9,
            overtopping: 0.3,
            riskLevel: 'high',
            riskType: '越浪/溃堤',
            lat: 21.18,
            lng: 110.42,
            historicalIncidents: 4,
            lastInspection: '2025-11-10',
        },
        {
            id: 'SW006',
            name: '汕头濠江段',
            length: 2.8,
            designStandard: '50年一遇',
            crestElevation: 3.5,
            predictedTideLevel: 3.6,
            overtopping: 0.1,
            riskLevel: 'high',
            riskType: '越浪风险',
            lat: 23.27,
            lng: 116.72,
            historicalIncidents: 2,
            lastInspection: '2025-09-25',
        },
        {
            id: 'SW007',
            name: '阳江海陵段',
            length: 4.2,
            designStandard: '30年一遇',
            crestElevation: 3.0,
            predictedTideLevel: 3.2,
            overtopping: 0.2,
            riskLevel: 'high',
            riskType: '越浪风险',
            lat: 21.62,
            lng: 111.93,
            historicalIncidents: 5,
            lastInspection: '2025-10-20',
        },
        {
            id: 'SW008',
            name: '茂名电白段',
            length: 6.2,
            designStandard: '50年一遇',
            crestElevation: 3.8,
            predictedTideLevel: 3.3,
            overtopping: -0.5,
            riskLevel: 'low',
            riskType: '正常',
            lat: 21.45,
            lng: 111.02,
            historicalIncidents: 1,
            lastInspection: '2025-12-05',
        },
    ],
}

// ===== 风暴潮监测数据 (新增) =====
export const mockSurgeData = {
    station: '珠海横琴站',
    currentLevel: 2.85, // 当前增水 (m)
    warningLevel: 2.50, // 警戒值
    trend: 'rising', // rising, falling, stable
    maxSurge: 3.2, // 预计最大增水
    peakTime: '16:00',
    riskLevel: 'high'
}

// ===== 海浪监测数据 (新增) =====
export const mockWaveData = {
    station: '万山浮标',
    significantHeight: 4.5, // 有效波高 (m)
    direction: 'SE', // 波向
    trend: 'steady',
    maxHeight: 5.2, // 预计最大波高
    warningState: 'orange', // yellow, orange, red
    period: 8.5 // 周期 (s)
}

// ===== AI智能摘要数据 (更新：逻辑链版) =====
export const mockAISummary = {
    lastUpdate: '2026-01-27 10:15',
    overallRisk: 'critical', // critical, high, medium, low
    riskTitle: 'I级 红色预警',

    // 1. 发生背景 (Context): 台风动态
    typhoonContext: {
        name: '苏拉',
        id: '2609',
        level: '超强台风级',
        location: '珠海东南方向约180km海面',
        centerPressure: 955, // hPa
        maxWind: 45, // m/s
        trend: '西北方向移动',
        landfallPrediction: '预计于今日夜间在珠海到台山一带沿海登陆'
    },

    // 2. 发展趋势 (Trend): 叠加效应分析
    tideAnalysis: {
        astronomicalState: '天文大潮期',
        superimposition: '严重', // slight, moderate, severe
        description: '台风登陆时间恰逢天文高潮位（预计16:00-18:00），将形成“风、浪、潮”三碰头的极端不利局面。'
    },

    // 3. 重点影响 (Impact): 极值预报
    impactData: {
        surge: {
            maxStation: '横琴站',
            maxLevel: 3.2, // m
            overAlert: 0.8, // 超警戒值
            peakTime: '16:30'
        },
        wave: {
            maxArea: '万山群岛海域',
            maxHeight: 6.5, // m
            direction: '东南浪'
        }
    },

    // 4. 重点关注 (Identify): 脆弱承灾体
    vulnerableObjects: [
        {
            name: '横琴海堤',
            type: 'seawall', // seawall, port, vessel
            risk: '漫堤风险',
            detail: '预计最高潮位超堤顶0.3m'
        },
        {
            name: '港珠澳大桥人工岛',
            type: 'infrastructure',
            risk: '强浪冲击',
            detail: '需防范6米巨浪主要冲击面'
        },
        {
            name: '香洲港',
            type: 'port',
            risk: '海水倒灌',
            detail: '低洼作业区需提前清空'
        }
    ]
}

// ===== 天文潮信息 =====
export const mockAstronomicalTide = {
    currentType: '大潮期',  // 大潮期/中潮期/小潮期
    tidalRange: 2.8,  // 当前潮差 (m)

    // 今明两天高低潮时间
    tideTable: [
        { date: '今日', type: 'high', time: '04:23', level: 2.65 },
        { date: '今日', type: 'low', time: '10:45', level: 0.38 },
        { date: '今日', type: 'high', time: '16:52', level: 2.82 },
        { date: '今日', type: 'low', time: '23:15', level: 0.42 },
        { date: '明日', type: 'high', time: '05:08', level: 2.58 },
        { date: '明日', type: 'low', time: '11:32', level: 0.45 },
        { date: '明日', type: 'high', time: '17:38', level: 2.72 },
        { date: '明日', type: 'low', time: '23:58', level: 0.48 },
    ],

    // 下一个最高潮位 (用于重点显示)
    nextHighTide: {
        time: '16:52',
        level: 2.82,
        label: '今日下午'
    },

    // 叠加风险
    superimpositionRisk: {
        level: 'high',
        description: '天文大潮与风暴潮叠加，潮位可能超历史极值',
    },
}

// ===== 重点潮位站预报（含四色预警和预报/观测双状态） =====
export const mockTideForecastStations = [
    {
        name: '南水站', maxLevel: 3.12, time: '17:15', surgeHeight: 0.72,
        warningColor: 'red', forecastWarning: true, observedWarning: true,
        currentLevel: 3.05, observedTime: '14:30', state: '超警',
        warningLevel: 2.50,
        trendData: [1.8, 1.6, 1.5, 1.6, 1.8, 2.0, 2.2, 2.1, 1.9, 2.0, 2.3, 2.5, 2.7, 2.9, 3.05, 3.10, 3.12, 3.08, 2.95, 2.80, 2.60, 2.40, 2.20, 2.00]
    },
    {
        name: '赤湾站', maxLevel: 3.05, time: '17:00', surgeHeight: 0.65,
        warningColor: 'red', forecastWarning: true, observedWarning: false,
        currentLevel: 2.78, observedTime: '14:30', state: '超警',
        warningLevel: 2.45,
        trendData: [1.7, 1.5, 1.4, 1.5, 1.7, 1.9, 2.1, 2.0, 1.8, 1.9, 2.2, 2.4, 2.6, 2.78, 2.90, 3.02, 3.05, 3.00, 2.88, 2.70, 2.50, 2.30, 2.10, 1.90]
    },
    {
        name: '珠海站', maxLevel: 2.95, time: '16:45', surgeHeight: 0.63,
        warningColor: 'orange', forecastWarning: true, observedWarning: true,
        currentLevel: 2.85, observedTime: '14:30', state: '超警',
        warningLevel: 2.40,
        trendData: [1.6, 1.5, 1.4, 1.5, 1.6, 1.8, 2.0, 1.9, 1.7, 1.8, 2.1, 2.3, 2.5, 2.7, 2.85, 2.92, 2.95, 2.90, 2.78, 2.60, 2.40, 2.25, 2.05, 1.85]
    },
    {
        name: '横门站', maxLevel: 2.92, time: '17:40', surgeHeight: 0.55,
        warningColor: 'orange', forecastWarning: true, observedWarning: false,
        currentLevel: 2.60, observedTime: '14:30', state: '需关注',
        warningLevel: 2.35,
        trendData: [1.5, 1.4, 1.3, 1.4, 1.5, 1.7, 1.9, 1.8, 1.6, 1.7, 2.0, 2.2, 2.4, 2.60, 2.75, 2.85, 2.92, 2.88, 2.72, 2.55, 2.35, 2.15, 1.95, 1.80]
    },
    {
        name: '三灶站', maxLevel: 2.88, time: '16:30', surgeHeight: 0.48,
        warningColor: 'yellow', forecastWarning: true, observedWarning: false,
        currentLevel: 2.45, observedTime: '14:30', state: '正常',
        warningLevel: 2.30,
        trendData: [1.5, 1.3, 1.2, 1.3, 1.5, 1.7, 1.9, 1.8, 1.6, 1.7, 1.9, 2.1, 2.3, 2.45, 2.65, 2.80, 2.88, 2.82, 2.70, 2.50, 2.30, 2.10, 1.95, 1.75]
    },
    {
        name: '黄埔站', maxLevel: 2.76, time: '18:20', surgeHeight: 0.36,
        warningColor: 'blue', forecastWarning: true, observedWarning: false,
        currentLevel: 2.30, observedTime: '14:30', state: '正常',
        warningLevel: 2.20,
        trendData: [1.4, 1.3, 1.2, 1.3, 1.4, 1.6, 1.8, 1.7, 1.5, 1.6, 1.8, 2.0, 2.2, 2.30, 2.45, 2.60, 2.72, 2.76, 2.70, 2.55, 2.35, 2.15, 1.95, 1.80]
    }
]

// ===== 近岸海浪重点数据 =====
export const mockNearshoreWave = {
    station: '香洲港近岸',
    height: 3.5, // m
    appearTime: '15:30',
    direction: 'SE'
}

// ===== 浪高预报站（与潮位站同构） =====
export const mockWaveForecastStations = [
    {
        name: '万山岛浮标', maxHeight: 6.5, time: '16:00',
        warningColor: 'red', forecastWarning: true, observedWarning: true,
        currentHeight: 5.8, observedTime: '14:20', direction: 'SE',
        state: '超警',
        warningLevel: 4.0,
        trendData: [2.0, 2.2, 2.5, 2.8, 3.2, 3.6, 4.0, 4.3, 4.8, 5.2, 5.5, 5.8, 6.0, 6.3, 6.5, 6.3, 6.0, 5.5, 5.0, 4.5, 4.0, 3.5, 3.0, 2.5]
    },
    {
        name: '担杆岛浮标', maxHeight: 5.2, time: '16:30',
        warningColor: 'orange', forecastWarning: true, observedWarning: true,
        currentHeight: 4.5, observedTime: '14:20', direction: 'SE',
        state: '超警',
        warningLevel: 3.5,
        trendData: [1.5, 1.8, 2.0, 2.3, 2.6, 3.0, 3.3, 3.6, 3.9, 4.2, 4.5, 4.8, 5.0, 5.2, 5.1, 4.8, 4.5, 4.0, 3.5, 3.0, 2.7, 2.4, 2.0, 1.8]
    },
    {
        name: '香洲港近岸', maxHeight: 3.8, time: '15:45',
        warningColor: 'orange', forecastWarning: true, observedWarning: false,
        currentHeight: 3.2, observedTime: '14:20', direction: 'ESE',
        state: '需关注',
        warningLevel: 2.5,
        trendData: [1.2, 1.4, 1.5, 1.8, 2.0, 2.3, 2.5, 2.8, 3.0, 3.2, 3.5, 3.8, 3.7, 3.5, 3.2, 2.9, 2.6, 2.3, 2.0, 1.8, 1.6, 1.4, 1.3, 1.2]
    },
    {
        name: '大亚湾浮标', maxHeight: 3.5, time: '17:00',
        warningColor: 'yellow', forecastWarning: true, observedWarning: false,
        currentHeight: 2.8, observedTime: '14:20', direction: 'SE',
        state: '正常',
        warningLevel: 2.5,
        trendData: [1.0, 1.2, 1.3, 1.5, 1.8, 2.0, 2.2, 2.5, 2.6, 2.8, 3.0, 3.2, 3.3, 3.5, 3.4, 3.2, 3.0, 2.7, 2.4, 2.1, 1.8, 1.5, 1.3, 1.1]
    },
    {
        name: '阳江近岸', maxHeight: 4.0, time: '15:30',
        warningColor: 'yellow', forecastWarning: true, observedWarning: false,
        currentHeight: 3.0, observedTime: '14:10', direction: 'S',
        state: '需关注',
        warningLevel: 2.8,
        trendData: [1.5, 1.7, 2.0, 2.3, 2.6, 2.8, 3.0, 3.3, 3.6, 3.8, 4.0, 3.9, 3.7, 3.4, 3.1, 2.8, 2.5, 2.2, 2.0, 1.8, 1.6, 1.5, 1.4, 1.3]
    },
    {
        name: '汕头近岸', maxHeight: 2.5, time: '18:00',
        warningColor: 'blue', forecastWarning: true, observedWarning: false,
        currentHeight: 1.8, observedTime: '14:10', direction: 'SE',
        state: '正常',
        warningLevel: 2.0,
        trendData: [0.8, 0.9, 1.0, 1.2, 1.3, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.4, 2.5, 2.4, 2.2, 2.0, 1.8, 1.5, 1.3, 1.1, 0.9]
    }
]
