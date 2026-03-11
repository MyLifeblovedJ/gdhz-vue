export function buildSeawallRiskItems(data) {
  const { stations = [], segments = [], seawalls = [] } = data || {}

  const stationBySegment = {}
  for (const station of stations) {
    for (const segmentId of station.segmentIds || []) {
      stationBySegment[segmentId] = station
    }
  }

  const segmentMap = {}
  for (const segment of segments) {
    segmentMap[segment.id] = segment
  }

  const items = []

  for (const seawall of seawalls) {
    const segment = segmentMap[seawall.segmentId]
    const station = stationBySegment[seawall.segmentId]

    for (const breakpoint of seawall.breakpoints || []) {
      const diff = breakpoint.forecastTideLevel - breakpoint.crestElevation
      const isOverflow = diff > 0

      let riskCls = 'safe'
      let riskText = '安全'

      if (isOverflow) {
        riskCls = 'danger'
        riskText = '漫堤风险'
      } else if (diff > -0.15) {
        riskCls = 'warn'
        riskText = '接近警戒'
      }

      items.push({
        id: breakpoint.id,
        name: breakpoint.name,
        seawallName: seawall.name,
        headline: `${seawall.name} · ${breakpoint.name} · ${segment?.city || '--'}`,
        crestElevation: breakpoint.crestElevation,
        forecastTideLevel: breakpoint.forecastTideLevel,
        stationName: station?.name || '--',
        city: segment?.city || '--',
        isOverflow,
        diff,
        riskCls,
        riskText,
      })
    }
  }

  items.sort((a, b) => {
    if (a.isOverflow !== b.isOverflow) return a.isOverflow ? -1 : 1
    return b.diff - a.diff
  })

  return items
}

export function buildSeawallRiskStats(items) {
  const list = Array.isArray(items) ? items : []
  const overflow = list.filter(item => item.isOverflow).length
  const warn = list.filter(item => item.riskCls === 'warn').length

  return [
    { label: '漫堤风险', value: overflow, cls: overflow > 0 ? 'danger' : '' },
    { label: '接近警戒', value: warn, cls: warn > 0 ? 'warn' : '' },
    { label: '断面总数', value: list.length, cls: '' },
  ]
}
