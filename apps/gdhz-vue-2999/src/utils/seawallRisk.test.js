import { describe, expect, it } from 'vitest'
import { homeMonitoringMockData } from '../data/homeMonitoringData'
import { buildSeawallRiskItems, buildSeawallRiskStats } from './seawallRisk'

describe('seawallRisk', () => {
  it('builds sorted breakpoint items with city folded into the headline', () => {
    const items = buildSeawallRiskItems(homeMonitoringMockData)

    expect(items[0]).toMatchObject({
      id: 'bp-zj-1',
      isOverflow: true,
      riskCls: 'danger',
      riskText: '漫堤风险',
      headline: '东海岛南部海堤 · D4断点 · 湛江市',
    })

    expect(items[1].id).toBe('bp-zh-1')
    expect(items.at(-1)?.headline).toBe('大亚湾东部海堤 · Y1断点 · 惠州市')
  })

  it('builds summary stats from the shaped items', () => {
    const items = buildSeawallRiskItems(homeMonitoringMockData)
    expect(buildSeawallRiskStats(items)).toEqual([
      { label: '漫堤风险', value: 2, cls: 'danger' },
      { label: '接近警戒', value: 4, cls: 'warn' },
      { label: '断面总数', value: 8, cls: '' },
    ])
  })
})
