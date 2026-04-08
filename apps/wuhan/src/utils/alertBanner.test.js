import { describe, expect, test } from 'vitest'
import {
  parseAlertBannerMessage,
  duplicateAlertBannerMessages,
} from './alertBanner'

describe('alertBanner', () => {
  test('extracts bracket title, body text, and alert level from marquee message', () => {
    expect(
      parseAlertBannerMessage('【风暴潮红色警报】23日22时：珠江口沿岸将出现120-300cm风暴增水。')
    ).toEqual({
      title: '风暴潮红色警报',
      body: '23日22时：珠江口沿岸将出现120-300cm风暴增水。',
      level: 'red',
    })

    expect(
      parseAlertBannerMessage('【海浪橙色警报】广东西部近岸3.5-5.5米橙色预警。')
    ).toEqual({
      title: '海浪橙色警报',
      body: '广东西部近岸3.5-5.5米橙色预警。',
      level: 'orange',
    })

    expect(
      parseAlertBannerMessage('【风暴潮分区提示】粤东沿岸80-150cm。')
    ).toEqual({
      title: '风暴潮分区提示',
      body: '粤东沿岸80-150cm。',
      level: null,
    })
  })

  test('duplicates parsed marquee items for seamless scrolling', () => {
    expect(
      duplicateAlertBannerMessages([
        '【风暴潮红色警报】消息A',
        '【风暴潮分区提示】消息B',
      ])
    ).toEqual([
      { title: '风暴潮红色警报', body: '消息A', level: 'red' },
      { title: '风暴潮分区提示', body: '消息B', level: null },
      { title: '风暴潮红色警报', body: '消息A', level: 'red' },
      { title: '风暴潮分区提示', body: '消息B', level: null },
    ])
  })
})
