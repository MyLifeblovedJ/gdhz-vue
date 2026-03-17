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
    // Tooltip appears via opacity transition, no layout shift
    expect(source).toMatch(/\.dock-btn-tooltip[\s\S]*opacity:\s*0/)
    expect(source).toMatch(/\.dock-btn:hover\s+\.dock-btn-tooltip[\s\S]*opacity:\s*1/)
  })

  it('renders the first row actions in the required order', () => {
    const expectedOrder = [
      "label: '放大'",
      "label: '缩小'",
      "label: '3D/2D'",
      "label: '重置视角'",
      "label: '底图切换'",
      "label: '台风'",
      "label: '全屏'",
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
      "label: '摄像头'",
      "label: '船舶'",
      "label: '风速'",
      "label: '温度'",
      "label: '降水'",
      "label: '海平面气压'",
      "label: '地形'",
    ]

    let lastIndex = -1
    expectedOrder.forEach((token) => {
      const currentIndex = source.indexOf(token)
      expect(currentIndex).toBeGreaterThan(lastIndex)
      lastIndex = currentIndex
    })
  })

  it('keeps unavailable topics in a disabled state and uses a continuous gradient legend', () => {
    expect(source).toMatch(/label: '温度'[\s\S]*disabled: true/)
    expect(source).toMatch(/label: '降水'[\s\S]*disabled: true/)
    expect(source).toMatch(/label: '海平面气压'[\s\S]*disabled: true/)
    expect(source).toMatch(/label: '地形'[\s\S]*disabled: true/)
    expect(source).toMatch(/class="wave-legend wave-legend-bar"/)
    expect(source).toMatch(/class="wave-legend-gradient"/)
    expect(source).toMatch(/class="wave-legend-tick"/)
  })
})
