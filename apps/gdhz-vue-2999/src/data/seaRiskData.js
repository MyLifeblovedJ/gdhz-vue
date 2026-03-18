/**
 * 海上风险评估 — Mock API 数据
 * 后续替换为真实接口调用即可，组件不直接引用这些数据
 */

// ===== 数值预报源列表 =====
const _waveForecastSources = [
    { id: 'SWAN_24h', name: 'SWAN 24h预报', time: '2026-03-18 08:00', model: 'SWAN' },
    { id: 'WW3_48h', name: 'WW3 48h预报', time: '2026-03-18 02:00', model: 'WW3' },
    { id: 'SWAN_72h', name: 'SWAN 72h预报', time: '2026-03-17 20:00', model: 'SWAN' },
]

// ===== 承灾体 =====
const _seaAssets = [
    // 海上风电
    { id: 'WF001', name: '珠海桂山海上风电场', type: 'wind_farm', lat: 22.08, lng: 113.78, capacity: '120MW', operator: '南方电网' },
    { id: 'WF002', name: '阳江沙扒海上风电场', type: 'wind_farm', lat: 21.48, lng: 111.72, capacity: '300MW', operator: '中广核' },
    { id: 'WF003', name: '汕头南澳海上风电场', type: 'wind_farm', lat: 23.32, lng: 117.18, capacity: '200MW', operator: '华能' },
    { id: 'WF004', name: '惠州港口海上风电场', type: 'wind_farm', lat: 22.85, lng: 114.92, capacity: '400MW', operator: '国电投' },
    { id: 'WF005', name: '湛江外罗海上风电场', type: 'wind_farm', lat: 20.92, lng: 110.38, capacity: '150MW', operator: '三峡集团' },
    // 海洋牧场
    { id: 'MR001', name: '珠海万山海洋牧场', type: 'marine_ranch', lat: 21.92, lng: 113.72, area: '5000亩', species: '金鲳鱼、石斑鱼' },
    { id: 'MR002', name: '阳江海陵湾海洋牧场', type: 'marine_ranch', lat: 21.58, lng: 111.85, area: '3200亩', species: '鲍鱼、海参' },
    { id: 'MR003', name: '汕尾红海湾海洋牧场', type: 'marine_ranch', lat: 22.68, lng: 115.42, area: '4500亩', species: '对虾、牡蛎' },
    { id: 'MR004', name: '湛江徐闻海洋牧场', type: 'marine_ranch', lat: 20.35, lng: 110.22, area: '6000亩', species: '珍珠贝、龙虾' },
    // 船舶
    { id: 'VS001', name: '粤珠海渔01288', type: 'vessel', lat: 22.12, lng: 113.62, vesselType: '渔船', tonnage: '120t' },
    { id: 'VS002', name: '粤阳江渔03456', type: 'vessel', lat: 21.35, lng: 111.55, vesselType: '渔船', tonnage: '85t' },
    { id: 'VS003', name: '深圳港拖168', type: 'vessel', lat: 22.52, lng: 114.35, vesselType: '拖轮', tonnage: '2000t' },
    { id: 'VS004', name: '南海救115', type: 'vessel', lat: 21.85, lng: 112.45, vesselType: '救助船', tonnage: '3500t' },
    { id: 'VS005', name: '粤汕头渔05789', type: 'vessel', lat: 23.18, lng: 116.95, vesselType: '渔船', tonnage: '60t' },
    { id: 'VS006', name: '粤湛江渔00123', type: 'vessel', lat: 20.78, lng: 110.55, vesselType: '渔船', tonnage: '95t' },
    { id: 'VS007', name: '惠州港集运208', type: 'vessel', lat: 22.72, lng: 114.82, vesselType: '集装箱', tonnage: '15000t' },
    { id: 'VS008', name: '粤惠州渔02567', type: 'vessel', lat: 22.65, lng: 114.65, vesselType: '渔船', tonnage: '75t' },
]

// ===== 风险评估结果（按预报源索引）=====
const _riskResults = {
    SWAN_24h: [
        { assetId: 'WF001', waveHeight: 4.8, riskLevel: 'high' },
        { assetId: 'WF002', waveHeight: 5.2, riskLevel: 'high' },
        { assetId: 'WF003', waveHeight: 3.6, riskLevel: 'medium' },
        { assetId: 'WF004', waveHeight: 4.1, riskLevel: 'high' },
        { assetId: 'WF005', waveHeight: 2.8, riskLevel: 'medium' },
        { assetId: 'MR001', waveHeight: 4.5, riskLevel: 'high' },
        { assetId: 'MR002', waveHeight: 3.2, riskLevel: 'medium' },
        { assetId: 'MR003', waveHeight: 2.6, riskLevel: 'medium' },
        { assetId: 'MR004', waveHeight: 1.8, riskLevel: 'low' },
        { assetId: 'VS001', waveHeight: 4.6, riskLevel: 'high' },
        { assetId: 'VS002', waveHeight: 5.0, riskLevel: 'high' },
        { assetId: 'VS003', waveHeight: 3.8, riskLevel: 'medium' },
        { assetId: 'VS004', waveHeight: 3.5, riskLevel: 'medium' },
        { assetId: 'VS005', waveHeight: 3.2, riskLevel: 'medium' },
        { assetId: 'VS006', waveHeight: 2.2, riskLevel: 'low' },
        { assetId: 'VS007', waveHeight: 4.3, riskLevel: 'high' },
        { assetId: 'VS008', waveHeight: 3.9, riskLevel: 'medium' },
    ],
    WW3_48h: [
        { assetId: 'WF001', waveHeight: 5.5, riskLevel: 'high' },
        { assetId: 'WF002', waveHeight: 6.1, riskLevel: 'high' },
        { assetId: 'WF003', waveHeight: 4.2, riskLevel: 'high' },
        { assetId: 'WF004', waveHeight: 4.8, riskLevel: 'high' },
        { assetId: 'WF005', waveHeight: 3.5, riskLevel: 'medium' },
        { assetId: 'MR001', waveHeight: 5.2, riskLevel: 'high' },
        { assetId: 'MR002', waveHeight: 3.8, riskLevel: 'medium' },
        { assetId: 'MR003', waveHeight: 3.1, riskLevel: 'medium' },
        { assetId: 'MR004', waveHeight: 2.4, riskLevel: 'low' },
        { assetId: 'VS001', waveHeight: 5.3, riskLevel: 'high' },
        { assetId: 'VS002', waveHeight: 5.8, riskLevel: 'high' },
        { assetId: 'VS003', waveHeight: 4.5, riskLevel: 'high' },
        { assetId: 'VS004', waveHeight: 4.1, riskLevel: 'high' },
        { assetId: 'VS005', waveHeight: 3.8, riskLevel: 'medium' },
        { assetId: 'VS006', waveHeight: 2.8, riskLevel: 'medium' },
        { assetId: 'VS007', waveHeight: 5.0, riskLevel: 'high' },
        { assetId: 'VS008', waveHeight: 4.6, riskLevel: 'high' },
    ],
    SWAN_72h: [
        { assetId: 'WF001', waveHeight: 3.2, riskLevel: 'medium' },
        { assetId: 'WF002', waveHeight: 3.8, riskLevel: 'medium' },
        { assetId: 'WF003', waveHeight: 2.5, riskLevel: 'medium' },
        { assetId: 'WF004', waveHeight: 2.8, riskLevel: 'medium' },
        { assetId: 'WF005', waveHeight: 1.9, riskLevel: 'low' },
        { assetId: 'MR001', waveHeight: 3.0, riskLevel: 'medium' },
        { assetId: 'MR002', waveHeight: 2.2, riskLevel: 'low' },
        { assetId: 'MR003', waveHeight: 1.8, riskLevel: 'low' },
        { assetId: 'MR004', waveHeight: 1.2, riskLevel: 'low' },
        { assetId: 'VS001', waveHeight: 3.1, riskLevel: 'medium' },
        { assetId: 'VS002', waveHeight: 3.5, riskLevel: 'medium' },
        { assetId: 'VS003', waveHeight: 2.6, riskLevel: 'medium' },
        { assetId: 'VS004', waveHeight: 2.3, riskLevel: 'low' },
        { assetId: 'VS005', waveHeight: 2.0, riskLevel: 'low' },
        { assetId: 'VS006', waveHeight: 1.5, riskLevel: 'low' },
        { assetId: 'VS007', waveHeight: 2.9, riskLevel: 'medium' },
        { assetId: 'VS008', waveHeight: 2.4, riskLevel: 'low' },
    ],
}

// ===== 承灾体类型配置 =====
export const ASSET_TYPES = {
    wind_farm: { label: '海上风电', icon: 'fa-solid fa-wind', color: '#0ea5e9' },
    marine_ranch: { label: '海洋牧场', icon: 'fa-solid fa-fish', color: '#10b981' },
    vessel: { label: '船舶', icon: 'fa-solid fa-ship', color: '#8b5cf6' },
}

export const RISK_LEVELS = {
    high: { label: '高风险', cls: 'danger', threshold: 4.0 },
    medium: { label: '中风险', cls: 'warn', threshold: 2.5 },
    low: { label: '低风险', cls: 'safe', threshold: 0 },
}

// ===== Mock API 函数 =====

/** 获取数值预报源列表 */
export async function fetchWaveForecastSources() {
    // 模拟网络延迟
    await new Promise(r => setTimeout(r, 120))
    return [..._waveForecastSources]
}

/** 获取海上风险评估结果 */
export async function fetchSeaRiskAssessment(forecastId) {
    await new Promise(r => setTimeout(r, 200))
    const results = _riskResults[forecastId] || _riskResults.SWAN_24h
    const assetMap = Object.fromEntries(_seaAssets.map(a => [a.id, a]))

    return results
        .map(r => {
            const asset = assetMap[r.assetId]
            if (!asset) return null
            return {
                ...r,
                ...asset,
                typeLabel: ASSET_TYPES[asset.type]?.label || asset.type,
                typeIcon: ASSET_TYPES[asset.type]?.icon || 'fa-solid fa-circle-question',
                typeColor: ASSET_TYPES[asset.type]?.color || '#94a3b8',
                riskLabel: RISK_LEVELS[r.riskLevel]?.label || r.riskLevel,
                riskCls: RISK_LEVELS[r.riskLevel]?.cls || '',
            }
        })
        .filter(Boolean)
        .sort((a, b) => b.waveHeight - a.waveHeight) // 按浪高降序
}
