import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const sourcePath = resolve(import.meta.dirname, 'MapActionDock.vue')
const source = readFileSync(sourcePath, 'utf8')

describe('MapActionDock structure', () => {
  it('uses two separate pill bars plus a standalone wave legend bar', () => {
    expect(source).toMatch(/class="action-pill-bar primary-bar"/)
    expect(source).toMatch(/class="action-pill-bar secondary-bar"/)
    expect(source).toMatch(/class="wave-legend wave-legend-bar"/)
    expect(source).not.toMatch(/mode-switch-bar/)
  })

  it('shows label as a floating tooltip on hover', () => {
    expect(source).toMatch(/class="dock-btn-tooltip"/)
    expect(source).toMatch(/\.dock-btn-tooltip[\s\S]*opacity:\s*0/)
    expect(source).toMatch(/\.dock-btn:hover\s+\.dock-btn-tooltip[\s\S]*opacity:\s*1/)
  })

  it('renders the first row actions in the required order', () => {
    const expectedOrder = [
      "key: 'zoom-in'",
      "key: 'zoom-out'",
      "key: 'map-mode'",
      "key: 'reset-view'",
      "key: 'basemap'",
      "key: 'typhoon'",
      "key: 'fullscreen'",
    ]

    let lastIndex = -1
    expectedOrder.forEach((token) => {
      const currentIndex = source.indexOf(token)
      expect(currentIndex).toBeGreaterThan(lastIndex)
      lastIndex = currentIndex
    })
  })

  it('renders the second row actions in the required order', () => {
    const expectedOrder = [
      "key: 'camera'",
      "key: 'vessels'",
      "key: 'wind'",
      "key: 'temperature'",
      "key: 'precipitation'",
      "key: 'pressure'",
      "key: 'terrain'",
    ]

    let lastIndex = -1
    expectedOrder.forEach((token) => {
      const currentIndex = source.indexOf(token)
      expect(currentIndex).toBeGreaterThan(lastIndex)
      lastIndex = currentIndex
    })
  })

  it('keeps unavailable topics in a disabled state and uses a continuous gradient legend', () => {
    expect(source).toMatch(/key: 'temperature'[\s\S]*disabled: true/)
    expect(source).toMatch(/key: 'precipitation'[\s\S]*disabled: true/)
    expect(source).toMatch(/key: 'pressure'[\s\S]*disabled: true/)
    expect(source).toMatch(/key: 'terrain'[\s\S]*disabled: true/)
    expect(source).toMatch(/class="wave-legend wave-legend-bar"/)
    expect(source).toMatch(/class="wave-legend-gradient"/)
    expect(source).toMatch(/class="wave-legend-tick"/)
  })

  it('keeps action tooltip copy readable in Chinese', () => {
    expect(source).toContain("label: '放大'")
    expect(source).toContain("label: '缩小'")
    expect(source).toContain("label: '重置视角'")
    expect(source).toContain("label: '底图切换'")
    expect(source).toContain("label: '台风'")
    expect(source).toContain("label: '全屏'")
    expect(source).toContain("label: '摄像头'")
    expect(source).toContain("label: '船舶'")
    expect(source).toContain("label: '风场'")
    expect(source).toContain("label: '温度'")
    expect(source).toContain("label: '降水'")
    expect(source).toContain("label: '海平面气压'")
    expect(source).toContain("label: '地形'")
  })
})
