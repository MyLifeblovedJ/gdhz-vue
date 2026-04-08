export const GEOLOGY_FIELD_OPTIONS = [
  { key: 'ship', label: '调查船' },
  { key: 'cruise', label: '航次' },
  { key: 'device', label: '设备' },
  { key: 'yearmoda', label: '日期' },
  { key: 'title', label: '标题' },
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

const GEOLOGY_CATEGORY_PALETTE = [
  '#0EA5E9',
  '#22C55E',
  '#F97316',
  '#8B5CF6',
  '#EF4444',
  '#EAB308',
  '#14B8A6',
  '#EC4899',
  '#6366F1',
  '#84CC16',
  '#F59E0B',
  '#06B6D4',
]

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

export function createStableCategoryColorMap(records = [], field = 'ship') {
  const counts = getFieldCounts(records, field)
  return Object.keys(counts)
    .sort((left, right) => left.localeCompare(right, 'zh-CN'))
    .reduce((accumulator, value) => {
      accumulator[value] = GEOLOGY_CATEGORY_PALETTE[hashString(`${field}:${value}`) % GEOLOGY_CATEGORY_PALETTE.length]
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
