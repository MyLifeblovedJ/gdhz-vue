export const GEOLOGY_FIELD_OPTIONS = [
  { key: 'mggid', label: 'MGGID' },
  { key: 'title', label: '数据集' },
  { key: 'institution', label: '机构' },
  { key: 'ship', label: '调查船' },
  { key: 'device', label: '设备' },
  { key: 'yearmoda', label: '日期' },
]

export const GEOLOGY_FILTER_MODE_OPTIONS = [
  { key: 'single', label: '单选' },
  { key: 'multiple', label: '复选' },
]

export const GEOLOGY_DATASET_COLORS = {
  raw: '#0EA5E9',
  processed: '#F97316',
}

export function getGeologyFieldOption(field) {
  return GEOLOGY_FIELD_OPTIONS.find(item => item.key === field) || GEOLOGY_FIELD_OPTIONS[0]
}

export function getGeologyFieldValue(record, field) {
  const rawValue = record?.[field]
  if (rawValue === null || rawValue === undefined) return '未标注'
  const value = String(rawValue).trim()
  return value || '未标注'
}

function getFieldCounts(records = [], field = 'ship') {
  return records.reduce((accumulator, record) => {
    const value = getGeologyFieldValue(record, field)
    accumulator[value] = (accumulator[value] || 0) + 1
    return accumulator
  }, {})
}

function hashString(input = '') {
  return Array.from(String(input)).reduce((hash, character) => {
    return (hash * 31 + character.charCodeAt(0)) >>> 0
  }, 7)
}

/** MurmurHash3 终态混淆，将相近哈希值打散到完全不同的输出 */
function mixBits(h) {
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0
  return (h ^ (h >>> 16)) >>> 0
}

/**
 * 将色相标准化到 0~360，避免后续计算出现负值或超界。
 */
function normalizeHue(hue) {
  return ((hue % 360) + 360) % 360
}

function formatHslColor({ h, s, l }) {
  return `hsl(${normalizeHue(h).toFixed(1)}, ${Math.round(s)}%, ${Math.round(l)}%)`
}

function hslToRgb({ h, s, l }) {
  const hue = normalizeHue(h)
  const saturation = s / 100
  const lightness = l / 100
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
  const huePrime = hue / 60
  const x = chroma * (1 - Math.abs((huePrime % 2) - 1))

  let red = 0
  let green = 0
  let blue = 0

  if (huePrime >= 0 && huePrime < 1) {
    red = chroma
    green = x
  } else if (huePrime < 2) {
    red = x
    green = chroma
  } else if (huePrime < 3) {
    green = chroma
    blue = x
  } else if (huePrime < 4) {
    green = x
    blue = chroma
  } else if (huePrime < 5) {
    red = x
    blue = chroma
  } else {
    red = chroma
    blue = x
  }

  const match = lightness - chroma / 2
  return [red + match, green + match, blue + match].map(value => Math.round(value * 255))
}

function getRgbDistance(left, right) {
  return Math.sqrt(
    ((left[0] - right[0]) ** 2)
      + ((left[1] - right[1]) ** 2)
      + ((left[2] - right[2]) ** 2),
  )
}

function buildStableColorCandidate(field, value, attempt = 0) {
  const hash = hashString(`${field}:${value}`)
  const hue = normalizeHue((mixBits(hash) % 360) + attempt * 137.508)
  const saturationBands = [74, 66, 82, 58, 70]
  const lightnessBands = [48, 58, 40, 64, 34]
  const saturationSeed = mixBits(hash ^ 0x9E3779B9)
  const lightnessSeed = mixBits(hash ^ 0x517CC1B7)
  const saturation = saturationBands[(saturationSeed + attempt) % saturationBands.length]
  const lightness = lightnessBands[(lightnessSeed + Math.floor(attempt / saturationBands.length)) % lightnessBands.length]

  return { h: hue, s: saturation, l: lightness }
}

function getMinimumColorDistance(categoryCount) {
  if (categoryCount <= 8) return 42
  if (categoryCount <= 20) return 34
  if (categoryCount <= 40) return 28
  if (categoryCount <= 80) return 22
  return 18
}

function pickDistinctStableColor(field, value, assignedColors, minimumDistance) {
  let bestCandidate = null

  for (let attempt = 0; attempt < 96; attempt += 1) {
    const candidate = buildStableColorCandidate(field, value, attempt)
    const rgb = hslToRgb(candidate)
    const nearestDistance = assignedColors.length
      ? Math.min(...assignedColors.map(assigned => getRgbDistance(rgb, assigned.rgb)))
      : Number.POSITIVE_INFINITY

    if (nearestDistance >= minimumDistance) {
      return { ...candidate, rgb }
    }

    if (!bestCandidate || nearestDistance > bestCandidate.nearestDistance) {
      bestCandidate = { ...candidate, rgb, nearestDistance }
    }
  }

  return bestCandidate || {
    ...buildStableColorCandidate(field, value, 0),
    rgb: hslToRgb(buildStableColorCandidate(field, value, 0)),
  }
}

export function createStableCategoryColorMap(records = [], field = 'ship') {
  const counts = getFieldCounts(records, field)
  const keys = Object.keys(counts).sort((a, b) => a.localeCompare(b, 'zh-CN'))
  const minimumDistance = getMinimumColorDistance(keys.length)
  const assignedColors = []

  return keys.reduce((map, value) => {
    const color = pickDistinctStableColor(field, value, assignedColors, minimumDistance)
    assignedColors.push(color)
    map[value] = formatHslColor(color)
    return map
  }, {})
}

export function filterGeologyRecords(
  records = [],
  {
    filterField = 'ship',
    selectedValues = [],
  } = {},
) {
  if (!filterField || !selectedValues?.length) return records
  const allowedValues = new Set(selectedValues.map(value => String(value)))
  return records.filter(record => allowedValues.has(getGeologyFieldValue(record, filterField)))
}

export function buildGeologyFilterTreeItems(records = [], filterField = 'ship', selectedValues = []) {
  const fieldOption = getGeologyFieldOption(filterField)
  const selected = new Set(selectedValues.map(value => String(value)))
  const counts = getFieldCounts(records, filterField)

  return [
    {
      id: `filter-group-${fieldOption.key}`,
      type: 'group',
      key: fieldOption.key,
      label: fieldOption.label,
      children: Object.entries(counts)
        .sort(([left], [right]) => left.localeCompare(right, 'zh-CN'))
        .map(([value, count]) => ({
          id: `${fieldOption.key}-${value}`,
          type: 'value',
          value,
          label: value,
          count,
          checked: selected.has(value),
        })),
    },
  ]
}

export function buildGeologyColorLegendItems(records = [], colorBy = 'ship') {
  const fieldOption = getGeologyFieldOption(colorBy)
  const counts = getFieldCounts(records, colorBy)
  const colorMap = createStableCategoryColorMap(records, colorBy)

  return [
    {
      id: `color-group-${fieldOption.key}`,
      type: 'group',
      key: fieldOption.key,
      label: fieldOption.label,
      children: Object.entries(counts)
        .sort(([left], [right]) => left.localeCompare(right, 'zh-CN'))
        .map(([value, count]) => ({
          id: `${fieldOption.key}-color-${value}`,
          type: 'value',
          value,
          label: value,
          count,
          color: colorMap[value],
        })),
    },
  ]
}

export function getGeologyDatasetColor(record) {
  return record?.datasetType === 'processed'
    ? GEOLOGY_DATASET_COLORS.processed
    : GEOLOGY_DATASET_COLORS.raw
}

export function buildGeologyHighlightState(record, { activeMggid = null, activePointId = null } = {}) {
  if (!activeMggid) return 'normal'
  if (record?.pointId === activePointId) return 'selected'
  if (record?.mggid === activeMggid) return 'linked'
  return 'dimmed'
}

/**
 * 从 '20240315' 格式的日期字符串中提取年份
 * @param {string} yearmoda - 日期字符串，格式为 YYYYMMDD
 * @returns {string} 年份字符串，无效时返回空字符串
 */
export function extractYearFromYearmoda(yearmoda) {
  const str = String(yearmoda ?? '').trim()
  return str.length >= 4 ? str.slice(0, 4) : ''
}

/**
 * 获取指定字段的所有唯一值及其记录数，按中文排序
 * @param {Array} records - 采样记录数组
 * @param {string} field - 字段名
 * @returns {Array<{value: string, count: number}>} 唯一值列表
 */
export function getUniqueFieldValues(records = [], field) {
  const counts = getFieldCounts(records, field)
  return Object.entries(counts)
    .sort(([left], [right]) => left.localeCompare(right, 'zh-CN'))
    .map(([value, count]) => ({ value, count }))
}

/**
 * 根据顶部筛选条件过滤记录，所有条件为 AND 关系
 * @param {Array} records - 采样记录数组
 * @param {Object} filters - 筛选条件
 * @param {string} [filters.institution] - 机构
 * @param {string} [filters.ship] - 调查船
 * @param {string} [filters.cruise] - 航次
 * @param {string} [filters.device] - 设备
 * @param {string} [filters.yearStart] - 起始年份
 * @param {string} [filters.yearEnd] - 结束年份
 * @returns {Array} 过滤后的记录数组
 */
export function filterByTopFilters(records = [], filters = {}) {
  const { mggid, title, institution, ship, cruise, device, yearStart, yearEnd } = filters

  return records.filter((record) => {
    if (mggid && getGeologyFieldValue(record, 'mggid') !== mggid) return false
    if (title && getGeologyFieldValue(record, 'title') !== title) return false
    if (institution && getGeologyFieldValue(record, 'institution') !== institution) return false
    if (ship && getGeologyFieldValue(record, 'ship') !== ship) return false
    if (cruise && getGeologyFieldValue(record, 'cruise') !== cruise) return false
    if (device && getGeologyFieldValue(record, 'device') !== device) return false

    if (yearStart || yearEnd) {
      const dateStr = String(record?.yearmoda ?? '').trim()
      if (yearStart && dateStr < yearStart) return false
      if (yearEnd && dateStr > yearEnd) return false
    }

    return true
  })
}

/**
 * 构建层级筛选树（机构 → 船只 → 航次 → 样品）
 * @param {Array} records - 采样记录数组
 * @param {Object} [topFilters] - 顶部筛选条件，同 filterByTopFilters 的 filters 参数
 * @returns {Array} 层级树节点数组
 */
export function buildGeologyHierarchicalTree(records = [], topFilters = {}) {
  // 先根据顶部筛选条件过滤记录
  const filtered = filterByTopFilters(records, topFilters)

  // 按 institution → ship → cruise 三级分组
  const institutionMap = new Map()

  for (const record of filtered) {
    const instValue = getGeologyFieldValue(record, 'institution')
    const shipValue = getGeologyFieldValue(record, 'ship')
    const cruiseValue = getGeologyFieldValue(record, 'cruise')

    if (!institutionMap.has(instValue)) {
      institutionMap.set(instValue, new Map())
    }
    const shipMap = institutionMap.get(instValue)

    if (!shipMap.has(shipValue)) {
      shipMap.set(shipValue, new Map())
    }
    const cruiseMap = shipMap.get(shipValue)

    if (!cruiseMap.has(cruiseValue)) {
      cruiseMap.set(cruiseValue, [])
    }
    cruiseMap.get(cruiseValue).push(record)
  }

  // 构建树形结构
  return Array.from(institutionMap.entries())
    .sort(([left], [right]) => left.localeCompare(right, 'zh-CN'))
    .map(([instValue, shipMap]) => {
      const instChildren = Array.from(shipMap.entries())
        .sort(([left], [right]) => left.localeCompare(right, 'zh-CN'))
        .map(([shipValue, cruiseMap]) => {
          const shipChildren = Array.from(cruiseMap.entries())
            .sort(([left], [right]) => left.localeCompare(right, 'zh-CN'))
            .map(([cruiseValue, cruiseRecords]) => {
              // 取该航次下第一条记录的年份作为航次年份
              const year = extractYearFromYearmoda(cruiseRecords[0]?.yearmoda)

              const sampleChildren = cruiseRecords.map(record => ({
                id: `sample-${record.mggid || record.pointId || ''}`,
                type: 'sample',
                label: getGeologyFieldValue(record, 'title'),
                datasetType: record.datasetType || 'raw',
                record,
              }))

              const rawCount = cruiseRecords.filter(r => r.datasetType !== 'processed').length
              const processedCount = cruiseRecords.length - rawCount

              return {
                id: `cruise-${instValue}-${shipValue}-${cruiseValue}`,
                type: 'cruise',
                label: cruiseValue,
                year,
                count: cruiseRecords.length,
                rawCount,
                processedCount,
                children: sampleChildren,
              }
            })

          const shipCount = shipChildren.reduce((sum, child) => sum + child.count, 0)
          const shipRawCount = shipChildren.reduce((sum, child) => sum + child.rawCount, 0)
          const shipProcessedCount = shipChildren.reduce((sum, child) => sum + child.processedCount, 0)

          return {
            id: `ship-${instValue}-${shipValue}`,
            type: 'ship',
            label: shipValue,
            count: shipCount,
            rawCount: shipRawCount,
            processedCount: shipProcessedCount,
            children: shipChildren,
          }
        })

      const instCount = instChildren.reduce((sum, child) => sum + child.count, 0)
      const instRawCount = instChildren.reduce((sum, child) => sum + child.rawCount, 0)
      const instProcessedCount = instChildren.reduce((sum, child) => sum + child.processedCount, 0)

      return {
        id: `inst-${instValue}`,
        type: 'institution',
        label: instValue,
        count: instCount,
        rawCount: instRawCount,
        processedCount: instProcessedCount,
        children: instChildren,
      }
    })
}
