/**
 * AI态势摘要 Mock 数据
 * 用于前端开发阶段，模拟AI接口返回
 */

// AI态势摘要数据
export const mockAISummaryData = {
    // 元数据
    meta: {
        source: '广东省海洋预报台',
        updateTime: '2026-02-06T10:45:00+08:00',
        generatedAt: '2026-02-06T10:46:12+08:00',
        typhoonName: '苏拉',
        typhoonCode: '2309'
    },

    // AI研判摘要
    summary: {
        level: 'orange',  // red, orange, yellow, blue
        levelText: '橙色预警',
        levelIcon: 'fa-solid fa-circle-exclamation',

        // AI生成的摘要段落
        situationSummary: '受台风"苏拉"(编号2309)影响，珠海香洲站潮位持续上升中，当前潮位3.8m，预计今日05:30达峰值4.2m，超警戒潮位0.7m。',
        impactAreas: '珠海香洲区、斗门区可能出现风暴潮漫滩，最大淹没面积预计达28km²，淹没持续时间约3-4小时。',
        riskHighlight: '需重点关注3处海堤溢堤风险，其中珠江口南岸海堤风险最高，预计超设计潮位0.8m。',
        actionSuggestion: '建议启动III级应急响应，组织低洼地区群众转移，加强海堤巡查频次。'
    },

    // 历史灾害对比
    historicalComparison: {
        matchName: '2018年台风"山竹"',
        matchYear: 2018,
        similarity: 0.93,
        matchFactors: {
            path: '高度相似',
            intensity: '略弱于山竹',
            landingPoint: '登陆点相近',
            pressure: '气压接近'
        },
        historicalImpact: {
            economicLoss: 38.2,        // 亿元
            collapsedHouses: 1200,     // 间
            affectedPopulation: 320000, // 人
            maxTideLevel: 4.5,         // m
            floodArea: 42              // km²
        },
        comparisonNote: '当前台风"苏拉"预计影响略小于"山竹"，但仍需高度警惕，重点防范香洲区沿海低洼地区。'
    },

    // 潮位趋势分析（支持多站点）
    tideAnalysis: {
        stations: [
            {
                id: 'zhuhai',
                name: '珠海香洲站',
                district: '香洲区',
                warningLevel: 3.5,
                isAtRisk: true
            },
            {
                id: 'dawan',
                name: '大万山岛站',
                district: '香洲区',
                warningLevel: 3.2,
                isAtRisk: true
            },
            {
                id: 'doumen',
                name: '斗门站',
                district: '斗门区',
                warningLevel: 3.3,
                isAtRisk: false
            }
        ],
        selectedStation: 'zhuhai',

        // 珠海香洲站数据
        stationData: {
            zhuhai: {
                observation: [
                    { time: '02:00', value: 2.8 },
                    { time: '03:00', value: 3.1 },
                    { time: '04:00', value: 3.4 },
                    { time: '04:30', value: 3.6 },
                    { time: '05:00', value: 3.8 }  // 当前
                ],
                prediction: [
                    { time: '05:00', value: 3.8 },
                    { time: '05:30', value: 4.2 },  // 峰值
                    { time: '06:00', value: 4.0 },
                    { time: '06:30', value: 3.7 },
                    { time: '07:00', value: 3.3 },
                    { time: '08:00', value: 2.9 }
                ],
                peakInfo: {
                    value: 4.2,
                    time: '05:30',
                    overWarning: 0.7
                },
                affectedDistricts: ['香洲区', '斗门区']
            },
            dawan: {
                observation: [
                    { time: '02:00', value: 2.5 },
                    { time: '03:00', value: 2.8 },
                    { time: '04:00', value: 3.0 },
                    { time: '04:30', value: 3.2 },
                    { time: '05:00', value: 3.4 }
                ],
                prediction: [
                    { time: '05:00', value: 3.4 },
                    { time: '05:30', value: 3.8 },
                    { time: '06:00', value: 3.6 },
                    { time: '06:30', value: 3.3 },
                    { time: '07:00', value: 2.9 }
                ],
                peakInfo: {
                    value: 3.8,
                    time: '05:30',
                    overWarning: 0.6
                },
                affectedDistricts: ['香洲区']
            },
            doumen: {
                observation: [
                    { time: '02:00', value: 2.2 },
                    { time: '03:00', value: 2.5 },
                    { time: '04:00', value: 2.8 },
                    { time: '04:30', value: 3.0 },
                    { time: '05:00', value: 3.1 }
                ],
                prediction: [
                    { time: '05:00', value: 3.1 },
                    { time: '05:30', value: 3.4 },
                    { time: '06:00', value: 3.2 },
                    { time: '06:30', value: 2.9 }
                ],
                peakInfo: {
                    value: 3.4,
                    time: '05:30',
                    overWarning: 0.1
                },
                affectedDistricts: ['斗门区']
            }
        }
    },

    // TOP风险热点（含漫滩模拟+站点关联）
    riskHotspots: [
        {
            rank: 1,
            id: 'risk-001',
            name: '珠江口南岸海堤',
            level: 'high',
            riskType: '溢堤风险',
            overDesign: 0.8,           // 超设计潮位(m)

            // 关联站点（因果关系）
            relatedStation: {
                id: 'zhuhai',
                name: '珠海香洲站',
                currentLevel: 3.8,
                peakLevel: 4.2,
                peakTime: '05:30'
            },

            // 漫滩模拟信息
            floodSimulation: {
                floodArea: 12.5,          // 淹没面积 km²
                maxDepth: 1.8,            // 最大水深 m
                duration: 3.5,            // 持续时间 小时
                affectedPopulation: 15000 // 影响人口
            },

            // 行政区（支持多个）
            districts: ['珠海市香洲区', '珠海市斗门区'],

            // 风险时间窗口
            riskTimeRange: {
                start: '05:00',
                end: '07:00'
            },

            // 地理位置
            lat: 22.25,
            lng: 113.47
        },
        {
            rank: 2,
            id: 'risk-002',
            name: '大亚湾海堤',
            level: 'medium',
            riskType: '漫顶风险',
            overDesign: 0.3,

            relatedStation: {
                id: 'dawan',
                name: '大万山岛站',
                currentLevel: 3.4,
                peakLevel: 3.8,
                peakTime: '05:30'
            },

            floodSimulation: {
                floodArea: 8.2,
                maxDepth: 1.2,
                duration: 2.5,
                affectedPopulation: 8000
            },

            districts: ['惠州市惠东县', '惠州市大亚湾区'],

            riskTimeRange: {
                start: '05:15',
                end: '06:45'
            },

            lat: 22.68,
            lng: 114.52
        },
        {
            rank: 3,
            id: 'risk-003',
            name: '阳江渔港',
            level: 'medium',
            riskType: '浪损风险',
            overDesign: 0.0,  // 无溢堤，主要是浪损

            relatedStation: {
                id: 'zhuhai',  // 参考站点
                name: '珠海香洲站',
                currentLevel: 3.8,
                peakLevel: 4.2,
                peakTime: '05:30'
            },

            floodSimulation: {
                floodArea: 2.1,
                maxDepth: 0.8,
                duration: 2.0,
                affectedPopulation: 3500
            },

            districts: ['阳江市江城区'],

            riskTimeRange: {
                start: '04:30',
                end: '06:00'
            },

            lat: 21.87,
            lng: 111.97
        }
    ]
}

/**
 * 模拟AI接口调用
 * @returns {Promise<object>}
 */
export async function fetchAISummary() {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500))

    return {
        success: true,
        data: mockAISummaryData
    }
}

/**
 * 格式化时间显示
 */
export function formatUpdateTime(isoString) {
    const date = new Date(isoString)
    return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
    })
}
