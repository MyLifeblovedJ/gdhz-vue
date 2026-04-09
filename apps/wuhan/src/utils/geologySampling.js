export const GEOLOGY_FIELD_OPTIONS = [
  { key: 'title', label: '项目标题' },
  { key: 'ship', label: '调查船' },
  { key: 'cruise', label: '航次' },
  { key: 'yearmoda', label: '日期' },
  { key: 'institution', label: '机构' },
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
 * 根据字符串哈希生成稳定且高区分度的 HSL 颜色
 *
 * 三个维度使用独立混淆种子：
 * - 色相：哈希选槽位，再用黄金角（≈137.508°）映射，
 *   相邻槽位的色相间隔 ~137.5 度，视觉区分极大
 * - 饱和度 / 明度：独立种子散列，即使色相偶然接近也有额外差异
 */
function stableHslColor(field, value) {
  const hash = hashString(`${field}:${value}`)
  const mSlot = mixBits(hash)
  const mSat = mixBits(hash ^ 0x9E3779B9)
  const mLit = mixBits(hash ^ 0x517CC1B7)
  const hue = ((mSlot % 360) * 137.508) % 360
  const saturation = 52 + (mSat % 26)
  const lightness = 38 + (mLit % 22)
  return `hsl(${hue.toFixed(1)}, ${saturation}%, ${lightness}%)`
}

export function createStableCategoryColorMap(records = [], field = 'ship') {
  const counts = getFieldCounts(records, field)
  return Object.keys(counts)
    .sort((left, right) => left.localeCompare(right, 'zh-CN'))
    .reduce((accumulator, value) => {
      accumulator[value] = stableHslColor(field, value)
      return accumulator
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
  const { mggid, institution, ship, cruise, device, yearStart, yearEnd } = filters

  return records.filter((record) => {
    if (mggid && getGeologyFieldValue(record, 'mggid') !== mggid) return false
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
