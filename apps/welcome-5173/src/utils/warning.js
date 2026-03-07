const DEFAULT_PRIORITY = ['storm-surge', 'tsunami', 'wave', 'red-tide', 'other']
const LEVEL_WEIGHT = {
  red: 5,
  orange: 4,
  yellow: 3,
  blue: 2,
  info: 1
}

// 仅保留生效中的预警，撤销状态会被立即过滤。
export function getActiveWarnings(warningFeed) {
  const items = warningFeed?.items || []
  return items.filter((item) => item?.status === 'active')
}

function toPriorityMap(priorityList) {
  const source = Array.isArray(priorityList) && priorityList.length ? priorityList : DEFAULT_PRIORITY
  return source.reduce((acc, type, index) => {
    acc[type] = index
    return acc
  }, {})
}

function getLevelWeight(level) {
  return LEVEL_WEIGHT[level] || 0
}

function compareByLevelDesc(a, b) {
  return getLevelWeight(b?.level) - getLevelWeight(a?.level)
}

// 同市规则：优先风暴潮等级；否则按“海啸 > 海浪 > 赤潮 > 其他”选择主灾种，再按等级取最高。
export function pickDominantWarning(cityWarnings, priorityList) {
  if (!cityWarnings.length) {
    return null
  }

  const stormWarnings = cityWarnings
    .filter((item) => item.disasterType === 'storm-surge')
    .sort(compareByLevelDesc)

  if (stormWarnings.length) {
    return stormWarnings[0]
  }

  const priorityMap = toPriorityMap(priorityList)
  const sorted = cityWarnings.slice().sort((a, b) => {
    const typeA = priorityMap[a.disasterType] ?? Number.MAX_SAFE_INTEGER
    const typeB = priorityMap[b.disasterType] ?? Number.MAX_SAFE_INTEGER
    if (typeA !== typeB) {
      return typeA - typeB
    }

    return compareByLevelDesc(a, b)
  })

  return sorted[0]
}

// 预警按城市聚合，输出地图和摘要都可直接消费的结构。
export function buildCityWarningStates({ warningFeed, cityOverlays, priorityList }) {
  const activeWarnings = getActiveWarnings(warningFeed)
  const cityMap = new Map()

  for (const warning of activeWarnings) {
    if (!warning.cityCode) {
      continue
    }

    const current = cityMap.get(warning.cityCode) || []
    current.push(warning)
    cityMap.set(warning.cityCode, current)
  }

  const overlayMap = new Map((cityOverlays || []).map((item) => [item.cityCode, item]))
  const states = []

  for (const [cityCode, warnings] of cityMap.entries()) {
    const overlay = overlayMap.get(cityCode)
    const dominantWarning = pickDominantWarning(warnings, priorityList)
    if (!dominantWarning) {
      continue
    }

    states.push({
      cityCode,
      cityName: overlay?.cityName || dominantWarning.cityName || cityCode,
      center: overlay?.center || null,
      boundary: overlay?.boundary || [],
      warnings,
      dominantWarning
    })
  }

  return states
}
