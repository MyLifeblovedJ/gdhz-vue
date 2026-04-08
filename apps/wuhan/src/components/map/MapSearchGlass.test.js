import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const sourcePath = resolve(import.meta.dirname, 'MapSearchGlass.vue')
const hasSource = existsSync(sourcePath)
const source = hasSource ? readFileSync(sourcePath, 'utf8') : ''

describe('MapSearchGlass source contract', () => {
  it('defines a dedicated search pill component', () => {
    expect(hasSource).toBe(true)
  })

  it('renders only a search icon and placeholder-led field', () => {
    expect(source).toContain('fa-magnifying-glass')
    expect(source).toContain('placeholder=')
    expect(source).not.toContain('send-btn')
    expect(source).not.toContain('fa-paper-plane')
  })

  it('uses a long oval frosted-glass shell', () => {
    expect(source).toContain('border-radius: 999px;')
    expect(source).toContain('backdrop-filter:')
    expect(source).toContain('min(640px, calc(100vw - 220px))')
  })

  it('builds the same liquid-glass displacement filter instead of a plain transparent shell', () => {
    expect(source).toContain("import { attachLiquidGlass } from '../../utils/liquidGlass'")
    expect(source).toContain('border: 1px solid rgba(255, 255, 255, 0.5);')
    expect(source).toContain("attachLiquidGlass(glassEl.value, { idPrefix: 'map-search-glass' })")
    expect(source).toContain('new ResizeObserver')
    expect(source).toContain('text-shadow:')
  })

  it('keeps search accessibility and placeholder copy readable in Chinese', () => {
    expect(source).toContain('aria-label="地图搜索"')
    expect(source).toContain('aria-label="搜索监测点、站点或海域"')
    expect(source).toContain("default: '搜索监测点、站点或海域'")
  })
})
