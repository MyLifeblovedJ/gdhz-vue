import { describe, expect, it } from 'vitest'
import { buildTyphoonSummaryCards } from './typhoonPanel'

describe('typhoonPanel', () => {
  it('builds a single landing summary card', () => {
    const cards = buildTyphoonSummaryCards({
      landfallPrediction: {
        location: '珠海到台山沿海',
        time: '2025-09-24 04:00:00',
      },
      formatTime: (value) => value === '2025-09-24 04:00:00' ? '09/24 04:00' : '--',
    })

    expect(cards).toEqual([
      {
        id: 'landfall',
        title: '预计登陆',
        accent: 'danger',
        rows: [
          { label: '地点', value: '珠海到台山沿海' },
          { label: '时间', value: '09/24 04:00', tone: 'danger' },
        ],
      },
    ])
  })

  it('returns placeholders when landfall data is missing', () => {
    const cards = buildTyphoonSummaryCards({
      landfallPrediction: null,
      formatTime: () => '--',
    })

    expect(cards[0].rows).toEqual([
      { label: '地点', value: '暂无预计登陆点信息', tone: 'muted' },
      { label: '时间', value: '--', tone: 'muted' },
    ])
  })
})
