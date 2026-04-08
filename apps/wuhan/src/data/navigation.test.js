import { describe, expect, it } from 'vitest'
import { findSubmenuItem, navItems, navMegaSections } from './navigation'

describe('navigation mega menu config', () => {
  it('defines the correct primary navigation items', () => {
    expect(navItems.map(item => item.label)).toEqual([
      '首页',
      '海洋地质',
      '海洋测绘',
      '被动声学',
    ])
  })

  it('defines submenu groups for items with children', () => {
    expect(navItems.find(item => item.key === 'ocean-geology')?.children?.map(item => item.label)).toEqual([
      '地质采样',
    ])
    expect(navItems.find(item => item.key === 'ocean-survey')?.children?.map(item => item.label)).toEqual([
      '多波束水柱',
      '多波束测深',
    ])
    expect(navItems.find(item => item.key === 'passive-acoustics')?.children?.map(item => item.label)).toEqual([
      '水听器',
    ])
  })

  it('collects only menu items with children into the mega menu sections', () => {
    expect(navMegaSections.map(section => section.key)).toEqual([
      'ocean-geology',
      'ocean-survey',
      'passive-acoustics',
    ])
  })

  it('resolves submenu metadata by page key and submenu key', () => {
    expect(findSubmenuItem('ocean-geology', 'geological-sampling')).toMatchObject({ label: '地质采样' })
    expect(findSubmenuItem('ocean-survey', 'water-column')).toMatchObject({ label: '多波束水柱' })
    expect(findSubmenuItem('passive-acoustics', 'hydrophone')).toMatchObject({ label: '水听器' })
    expect(findSubmenuItem('home', 'anything')).toBeNull()
    expect(findSubmenuItem('ocean-survey', 'missing')).toBeNull()
  })
})
