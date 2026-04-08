/**
 * 台风真实数据解析器 — 桦加沙 (RAGASA, 202518)
 *
 * 从 typhoon202518.json 原始 JSON 中提取并转换数据，
 * 输出格式与 mockTyphoonData 兼容，供 store 和 MapContainer 直接使用。
 *
 * 目标时间：2025-09-23 22:00:00
 */

import rawData from './typhoon202518.json'

const TARGET_TIME = '2025-09-23 22:00:00'
const TARGET_TS = new Date('2025-09-23T22:00:00+08:00').getTime()

/**
 * 台风强度 → 颜色映射（中国标准）
 */
export const TYPHOON_CATEGORY_COLORS = {
    '热带低压': '#00bfff',
    '热带风暴': '#00ff00',
    '强热带风暴': '#ffff00',
    '台风': '#ff9900',
    '强台风': '#ff00ff',
    '超强台风': '#ff0000',
}

/**
 * 解析管道分隔的四象限风圈半径。
 * 格式：NE|NW|SW|SE（单位 km）
 * @param {string} str - 如 "380|350|320|300"
 * @returns {object|null} { ne, nw, sw, se } 或 null（空字符串时）
 */
function parseQuadrantRadii(str) {
    if (!str || str.trim() === '') return null
    const parts = str.split('|').map(Number)
    if (parts.length < 4 || parts.some(isNaN)) return null
    return { ne: parts[0], nw: parts[1], sw: parts[2], se: parts[3] }
}

/**
 * 解析时间字符串为时间戳（北京时间）
 */
function parseTime(timeStr) {
    // "2025-09-23 20:00:00" → ISO 格式
    return new Date(timeStr.replace(' ', 'T') + '+08:00').getTime()
}

/**
 * 从 points 数组中提取截至目标时间的历史轨迹
 */
function extractHistoryTrack(points) {
    return points
        .filter(p => parseTime(p.time) <= TARGET_TS)
        .map(p => ({
            time: p.time,
            lat: parseFloat(p.lat),
            lng: parseFloat(p.lng),
            strong: p.strong,
            power: parseInt(p.power, 10),
            windSpeed: parseInt(p.speed, 10),
            pressure: parseInt(p.pressure, 10),
            moveSpeed: p.movespeed ? parseInt(p.movespeed, 10) : null,
            moveDirection: p.movedirection || null,
            windCircle: {
                radius7: parseQuadrantRadii(p.radius7),
                radius10: parseQuadrantRadii(p.radius10),
                radius12: parseQuadrantRadii(p.radius12),
            },
        }))
}

/**
 * 从最后一个历史点的 forecast 中提取"中国"预报路径
 */
function extractForecast(points) {
    // 找最后一个 ≤ TARGET_TIME 的点
    const historyPoints = points.filter(p => parseTime(p.time) <= TARGET_TS)
    if (!historyPoints.length) return []

    const lastPoint = historyPoints[historyPoints.length - 1]
    const forecasts = lastPoint.forecast || []

    // 提取"中国"预报源
    const chinaForecast = forecasts.find(f => f.tm === '中国')
    if (!chinaForecast || !chinaForecast.forecastpoints) return []

    const lastPointTs = parseTime(lastPoint.time)

    return chinaForecast.forecastpoints
        .filter(fp => parseTime(fp.time) > lastPointTs)
        .map(fp => ({
            time: fp.time,
            lat: parseFloat(fp.lat),
            lng: parseFloat(fp.lng),
            strong: fp.strong || null,
            power: fp.power ? parseInt(fp.power, 10) : null,
            windSpeed: fp.speed ? parseInt(fp.speed, 10) : null,
            pressure: fp.pressure ? parseInt(fp.pressure, 10) : null,
        }))
}

/**
 * 主解析函数 — 输出与 mockTyphoonData 兼容的格式
 */
export function parseTyphoonData() {
    const track = extractHistoryTrack(rawData.points)
    const forecast = extractForecast(rawData.points)

    if (!track.length) {
        console.warn('[typhoonDataParser] 未找到目标时间范围内的路径点')
        return null
    }

    const latest = track[track.length - 1]
    const land = (rawData.land || []).map(l => ({
        address: l.landaddress,
        time: l.landtime,
        lat: parseFloat(l.lat),
        lng: parseFloat(l.lng),
        info: l.info,
    }))

    // 查找首个登陆点（时间 > 当前最新点时间 → 作为 landfallPrediction）
    const futureLandings = land.filter(l => parseTime(l.time) > parseTime(latest.time))

    return {
        id: rawData.tfid,
        name: rawData.name,
        enName: rawData.enname,
        status: rawData.isactive === '1' ? 'active' : 'inactive',
        category: latest.strong,
        movement: {
            direction: latest.moveDirection || '未知',
            speedKmh: latest.moveSpeed || 0,
        },
        landfallPrediction: futureLandings.length > 0
            ? {
                location: futureLandings[0].address,
                time: futureLandings[0].time,
                lat: futureLandings[0].lat,
                lng: futureLandings[0].lng,
            }
            : null,
        track,
        forecast,
        // 当前位置风圈（最后一个历史点的风圈）
        windCircle: {
            center: { lat: latest.lat, lng: latest.lng },
            ...latest.windCircle,
        },
        // 登陆信息
        land,
    }
}

/**
 * 预解析的台风数据 — 可直接导入使用
 */
export const typhoonParsedData = parseTyphoonData()
