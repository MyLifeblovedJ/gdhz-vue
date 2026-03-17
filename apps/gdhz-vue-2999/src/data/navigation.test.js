import { describe, expect, it } from 'vitest'
import { findSubmenuItem, navItems, navMegaSections } from './navigation'

describe('navigation mega menu config', () => {
  it('defines submenu groups for the required disaster modules', () => {
    expect(navItems.find(item => item.key === 'sea-condition')?.children?.map(item => item.label)).toEqual([
      '漫堤风险',
      '影响评估',
      '应急疏散',
      '应急方案',
    ])
    expect(navItems.find(item => item.key === 'tsunami')?.children?.map(item => item.label)).toEqual([
      '灾情预警',
      '近岸三维模拟',
      '灾害模拟',
      '影响评估',
    ])
    expect(navItems.find(item => item.key === 'saltwater')?.children?.map(item => item.label)).toEqual([
      '咸潮观测',
      '咸潮预测',
    ])
    expect(navItems.find(item => item.key === 'seawater')?.children?.map(item => item.label)).toEqual([
      '入侵现状',
      '入侵预测',
    ])
    expect(navItems.find(item => item.key === 'sealevel')?.children?.map(item => item.label)).toEqual([
      '潮位及概况',
      '灾害模拟',
      '影响评估',
      '数据预测',
    ])
    expect(navItems.find(item => item.key === 'erosion')?.children?.map(item => item.label)).toEqual([
      '灾害预警',
      '影像分析',
      '侵蚀岸段',
      '下蚀计算',
      '侵蚀分析',
    ])
  })

  it('collects only menu items with children into the mega menu sections', () => {
    expect(navMegaSections.map(section => section.key)).toEqual([
      'sea-condition',
      'tsunami',
      'saltwater',
      'seawater',
      'sealevel',
      'erosion',
    ])
  })

  it('resolves submenu metadata by page key and submenu key', () => {
    expect(findSubmenuItem('sea-condition', 'overflow-risk')).toMatchObject({
      label: '漫堤风险',
    })
    expect(findSubmenuItem('erosion', 'erosion-analysis')).toMatchObject({
      label: '侵蚀分析',
    })
    expect(findSubmenuItem('redtide', 'anything')).toBeNull()
    expect(findSubmenuItem('tsunami', 'missing')).toBeNull()
  })
})
