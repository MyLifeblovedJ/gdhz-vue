export const GEOLOGY_FIELD_OPTIONS = [
  { key: 'mggid', label: 'MGGID' },
  { key: 'title', label: '数据集' },
  { key: 'institution', label: '机构' },
  { key: 'ship', label: '调查船' },
  { key: 'categoryGroup', label: '研究大类' },
  { key: 'category', label: '具体分类' },
  { key: 'device', label: '设备' },
  { key: 'yearmoda', label: '日期' },
]

export const GEOLOGY_FILTER_MODE_OPTIONS = [
  { key: 'single', label: '单选' },
  { key: 'multiple', label: '多选' },
]

export const GEOLOGY_COLOR_MODE_OPTIONS = [
  { key: 'linked', label: '联动' },
  { key: 'independent', label: '独立' },
]

export const GEOLOGY_DATASET_COLORS = {
  raw: '#0EA5E9',
  processed: '#F97316',
}

export const GEOLOGY_CATEGORY_GROUP_MAP = {
  sediment: {
    key: 'sediment',
    label: '沉积采样',
    color: '#0ea5e9',
    icon: 'fa-solid fa-layer-group',
  },
  rock_basement: {
    key: 'rock_basement',
    label: '岩石与基底',
    color: '#8b5cf6',
    icon: 'fa-solid fa-gem',
  },
  in_situ_geophysics: {
    key: 'in_situ_geophysics',
    label: '原位地球物理',
    color: '#ef4444',
    icon: 'fa-solid fa-temperature-half',
  },
}

export const GEOLOGY_CATEGORY_DEFINITIONS = {
  core_long: {
    key: 'core_long',
    label: '柱状岩心',
    groupKey: 'sediment',
    color: '#0ea5e9',
    icon: 'fa-solid fa-trowel',
  },
  core_surface: {
    key: 'core_surface',
    label: '表层短岩心',
    groupKey: 'sediment',
    color: '#38bdf8',
    icon: 'fa-solid fa-box-open',
  },
  surface_grab: {
    key: 'surface_grab',
    label: '表层抓样',
    groupKey: 'sediment',
    color: '#f59e0b',
    icon: 'fa-solid fa-hand',
  },
  dredged_rock: {
    key: 'dredged_rock',
    label: '疏浚岩石',
    groupKey: 'rock_basement',
    color: '#8b5cf6',
    icon: 'fa-solid fa-gem',
  },
  drilled_rock: {
    key: 'drilled_rock',
    label: '钻探岩芯',
    groupKey: 'rock_basement',
    color: '#7c3aed',
    icon: 'fa-solid fa-hill-rockslide',
  },
  heat_flow: {
    key: 'heat_flow',
    label: '热流原位',
    groupKey: 'in_situ_geophysics',
    color: '#ef4444',
    icon: 'fa-solid fa-temperature-half',
  },
}

export const GEOLOGY_DEVICE_CATEGORY_MAP = {
  'Piston Corer': 'core_long',
  'Gravity Corer': 'core_long',
  Vibracorer: 'core_long',
  'Box Corer': 'core_surface',
  'Multi Corer': 'core_surface',
  'Grab Sampler': 'surface_grab',
  Dredge: 'dredged_rock',
  'Rock Drill': 'drilled_rock',
  'Heat Probe': 'heat_flow',
}

const GEOLOGY_LEGACY_CATEGORY_ALIASES = {
  sediment: 'core_long',
  rock: 'dredged_rock',
  surface: 'surface_grab',
  geophys: 'heat_flow',
}

const GEOLOGY_LEGACY_GROUP_ALIASES = {
  sediment: 'sediment',
  rock: 'rock_basement',
  surface: 'sediment',
  geophys: 'in_situ_geophysics',
}

const GEOLOGY_CATEGORY_GROUP_FALLBACK = {
  key: 'other',
  label: '其他',
  color: '#94a3b8',
  icon: 'fa-solid fa-circle-question',
}

const GEOLOGY_CATEGORY_FALLBACK = {
  key: 'other',
  label: '其他',
  groupKey: 'other',
  color: '#94a3b8',
  icon: 'fa-solid fa-circle-question',
}

function resolveGeologyCategoryKey(record) {
  const explicitCategory = String(record?.category || '').trim()
  if (explicitCategory) {
    if (GEOLOGY_CATEGORY_DEFINITIONS[explicitCategory]) return explicitCategory
    if (GEOLOGY_LEGACY_CATEGORY_ALIASES[explicitCategory]) return GEOLOGY_LEGACY_CATEGORY_ALIASES[explicitCategory]
  }

  return GEOLOGY_DEVICE_CATEGORY_MAP[String(record?.device || '').trim()] || GEOLOGY_CATEGORY_FALLBACK.key
}

function resolveGeologyCategoryGroupKey(record, categoryKey) {
  const explicitGroup = String(record?.categoryGroup || '').trim()
  if (explicitGroup) {
    if (GEOLOGY_CATEGORY_GROUP_MAP[explicitGroup]) return explicitGroup
    if (GEOLOGY_LEGACY_GROUP_ALIASES[explicitGroup]) return GEOLOGY_LEGACY_GROUP_ALIASES[explicitGroup]
  }

  return GEOLOGY_CATEGORY_DEFINITIONS[categoryKey]?.groupKey || GEOLOGY_CATEGORY_GROUP_FALLBACK.key
}

export function getGeologyCategoryGroup(record) {
  const categoryKey = resolveGeologyCategoryKey(record)
  const groupKey = resolveGeologyCategoryGroupKey(record, categoryKey)
  const groupDefinition = GEOLOGY_CATEGORY_GROUP_MAP[groupKey]

  if (!groupDefinition) {
    return {
      ...GEOLOGY_CATEGORY_GROUP_FALLBACK,
      label: String(record?.categoryGroup || GEOLOGY_CATEGORY_GROUP_FALLBACK.label),
    }
  }

  return groupDefinition
}

export function getGeologyCategory(record) {
  const categoryKey = resolveGeologyCategoryKey(record)
  const categoryDefinition = GEOLOGY_CATEGORY_DEFINITIONS[categoryKey]
  const group = getGeologyCategoryGroup({ ...record, category: categoryKey })

  if (!categoryDefinition) {
    return {
      ...GEOLOGY_CATEGORY_FALLBACK,
      label: String(record?.category || GEOLOGY_CATEGORY_FALLBACK.label),
      groupKey: group.key,
      groupLabel: group.label,
      groupColor: group.color,
      groupIcon: group.icon,
    }
  }

  return {
    ...categoryDefinition,
    groupKey: group.key,
    groupLabel: group.label,
    groupColor: group.color,
    groupIcon: group.icon,
  }
}

export function getGeologyCategorySummary(records = []) {
  const counts = new Map()
  for (const record of records) {
    const category = getGeologyCategory(record)
    if (!counts.has(category.key)) {
      counts.set(category.key, { ...category, count: 0 })
    }
    counts.get(category.key).count += 1
  }
  return Array.from(counts.values()).sort((a, b) => b.count - a.count)
}

export function getGeologyCategoryGroupSummary(records = []) {
  const counts = new Map()
  for (const record of records) {
    const group = getGeologyCategoryGroup(record)
    if (!counts.has(group.key)) {
      counts.set(group.key, { ...group, count: 0 })
    }
    counts.get(group.key).count += 1
  }
  return Array.from(counts.values()).sort((a, b) => b.count - a.count)
}

export function getGeologyFieldOption(field) {
  return GEOLOGY_FIELD_OPTIONS.find(item => item.key === field) || GEOLOGY_FIELD_OPTIONS[0]
}

export function getGeologyFieldValue(record, field) {
  if (field === 'categoryGroup') return getGeologyCategoryGroup(record).label
  if (field === 'category') return getGeologyCategory(record).label

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

function mixBits(h) {
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0
  return (h ^ (h >>> 16)) >>> 0
}

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

export function buildGeologyHighlightState(
  record,
  {
    activeRecord = null,
    activePointId = null,
    colorMode = 'independent',
    colorBy = 'ship',
    rawColorBy = 'ship',
    processedColorBy = 'ship',
  } = {},
) {
  if (!activeRecord) return 'normal'
  if (record?.pointId === activePointId) return 'selected'

  const isProcessed = record?.datasetType === 'processed'
  const targetField = colorMode === 'linked'
    ? colorBy
    : (isProcessed ? processedColorBy : rawColorBy)

  if (getGeologyFieldValue(record, targetField) === getGeologyFieldValue(activeRecord, targetField)) {
    return 'linked'
  }
  return 'dimmed'
}

export function extractYearFromYearmoda(yearmoda) {
  const str = String(yearmoda ?? '').trim()
  return str.length >= 4 ? str.slice(0, 4) : ''
}

export function getUniqueFieldValues(records = [], field) {
  const counts = getFieldCounts(records, field)
  return Object.entries(counts)
    .sort(([left], [right]) => left.localeCompare(right, 'zh-CN'))
    .map(([value, count]) => ({ value, count }))
}

export function filterByTopFilters(records = [], filters = {}) {
  const {
    mggid,
    title,
    institution,
    ship,
    cruise,
    categoryGroup,
    category,
    device,
    yearStart,
    yearEnd,
  } = filters

  return records.filter((record) => {
    if (mggid && getGeologyFieldValue(record, 'mggid') !== mggid) return false
    if (title && getGeologyFieldValue(record, 'title') !== title) return false
    if (institution && getGeologyFieldValue(record, 'institution') !== institution) return false
    if (ship && getGeologyFieldValue(record, 'ship') !== ship) return false
    if (cruise && getGeologyFieldValue(record, 'cruise') !== cruise) return false
    if (categoryGroup && getGeologyCategoryGroup(record).key !== categoryGroup) return false
    if (category && getGeologyCategory(record).key !== category) return false
    if (device && getGeologyFieldValue(record, 'device') !== device) return false

    if (yearStart || yearEnd) {
      const dateStr = String(record?.yearmoda ?? '').trim()
      if (yearStart && dateStr < yearStart) return false
      if (yearEnd && dateStr > yearEnd) return false
    }

    return true
  })
}

export function buildGeologyHierarchicalTree(records = [], topFilters = {}) {
  const filtered = filterByTopFilters(records, topFilters)
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

  return Array.from(institutionMap.entries())
    .sort(([left], [right]) => left.localeCompare(right, 'zh-CN'))
    .map(([instValue, shipMap]) => {
      const instChildren = Array.from(shipMap.entries())
        .sort(([left], [right]) => left.localeCompare(right, 'zh-CN'))
        .map(([shipValue, cruiseMap]) => {
          const shipChildren = Array.from(cruiseMap.entries())
            .sort(([left], [right]) => left.localeCompare(right, 'zh-CN'))
            .map(([cruiseValue, cruiseRecords]) => {
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

function sortByLocale(left, right) {
  return String(left).localeCompare(String(right), 'zh-CN')
}

function buildSampleNode(record) {
  return {
    id: `sample-${record.mggid || record.pointId || ''}`,
    type: 'sample',
    label: getGeologyFieldValue(record, 'title'),
    datasetType: record.datasetType || 'raw',
    record,
  }
}

function buildDatasetCountSummary(records = []) {
  const rawCount = records.filter(record => record.datasetType !== 'processed').length
  return {
    rawCount,
    processedCount: records.length - rawCount,
  }
}

export function buildGeologyCategoryTree(records = [], topFilters = {}) {
  const filtered = filterByTopFilters(records, topFilters)
  const groupMap = new Map()

  for (const record of filtered) {
    const group = getGeologyCategoryGroup(record)
    const category = getGeologyCategory(record)

    if (!groupMap.has(group.key)) {
      groupMap.set(group.key, {
        group,
        categories: new Map(),
      })
    }

    const categoryMap = groupMap.get(group.key).categories
    if (!categoryMap.has(category.key)) {
      categoryMap.set(category.key, {
        category,
        records: [],
      })
    }

    categoryMap.get(category.key).records.push(record)
  }

  return Array.from(groupMap.values())
    .sort((left, right) => sortByLocale(left.group.label, right.group.label))
    .map(({ group, categories }) => {
      const categoryChildren = Array.from(categories.values())
        .sort((left, right) => sortByLocale(left.category.label, right.category.label))
        .map(({ category, records: categoryRecords }) => {
          const summary = buildDatasetCountSummary(categoryRecords)
          const sampleChildren = [...categoryRecords]
            .sort((left, right) => sortByLocale(
              getGeologyFieldValue(left, 'title'),
              getGeologyFieldValue(right, 'title'),
            ))
            .map(record => buildSampleNode(record))

          return {
            id: `category-${group.key}-${category.key}`,
            type: 'category',
            label: category.label,
            count: categoryRecords.length,
            rawCount: summary.rawCount,
            processedCount: summary.processedCount,
            categoryKey: category.key,
            categoryGroupKey: group.key,
            children: sampleChildren,
          }
        })

      const groupRecords = categoryChildren.flatMap(child =>
        child.children.map(sampleNode => sampleNode.record),
      )
      const summary = buildDatasetCountSummary(groupRecords)

      return {
        id: `category-group-${group.key}`,
        type: 'categoryGroup',
        label: group.label,
        count: groupRecords.length,
        rawCount: summary.rawCount,
        processedCount: summary.processedCount,
        categoryGroupKey: group.key,
        children: categoryChildren,
      }
    })
}
