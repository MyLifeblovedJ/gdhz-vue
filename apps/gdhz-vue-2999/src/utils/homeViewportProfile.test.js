import { describe, expect, it } from 'vitest'
import { getHomeViewportMetrics, getHomeViewportProfile } from './homeViewportProfile'

describe('home viewport profile', () => {
  it('maps 1280 height to spacious profile', () => {
    expect(getHomeViewportProfile(1280)).toBe('spacious')
  })

  it('maps 1100 height to standard profile', () => {
    expect(getHomeViewportProfile(1100)).toBe('standard')
  })

  it('maps 979 height to compact profile', () => {
    expect(getHomeViewportProfile(979)).toBe('compact')
  })

  it('returns visible coastal rows per profile', () => {
    expect(getHomeViewportMetrics(1280).coastalVisibleRows).toBe(4)
    expect(getHomeViewportMetrics(1100).coastalVisibleRows).toBe(3)
    expect(getHomeViewportMetrics(979).coastalVisibleRows).toBe(2)
  })

  it('returns compacted typhoon height and larger coastal cards per profile', () => {
    expect(getHomeViewportMetrics(1280).typhoonBodyMaxHeight).toBe(420)
    expect(getHomeViewportMetrics(1100).typhoonBodyMaxHeight).toBe(340)
    expect(getHomeViewportMetrics(979).typhoonBodyMaxHeight).toBe(260)
    expect(getHomeViewportMetrics(1280).coastalCardHeight).toBe(112)
    expect(getHomeViewportMetrics(979).coastalCardHeight).toBe(104)
  })

  it('returns legend offsets for the device-side note position', () => {
    expect(getHomeViewportMetrics(1280).legendLeftOffset).toBe(24)
    expect(getHomeViewportMetrics(1280).legendBottomOffset).toBe(24)
    expect(getHomeViewportMetrics(979).legendLeftOffset).toBe(20)
    expect(getHomeViewportMetrics(979).legendBottomOffset).toBe(20)
  })

  it('reserves extra bottom safe padding for the dock area', () => {
    expect(getHomeViewportMetrics(1280).dockHeight).toBe(148)
    expect(getHomeViewportMetrics(1100).dockHeight).toBe(148)
    expect(getHomeViewportMetrics(979).dockHeight).toBe(132)
    expect(getHomeViewportMetrics(1280).dockBottomSafeArea).toBe(24)
    expect(getHomeViewportMetrics(1100).dockBottomSafeArea).toBe(24)
    expect(getHomeViewportMetrics(979).dockBottomSafeArea).toBe(28)
  })
})
