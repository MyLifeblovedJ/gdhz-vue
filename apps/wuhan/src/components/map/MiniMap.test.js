import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const sourcePath = resolve(import.meta.dirname, 'MiniMap.vue')
const source = readFileSync(sourcePath, 'utf8')

describe('MiniMap basemap and viewport behavior', () => {
  it('falls back to a satellite imagery provider when Tianditu token is unavailable', () => {
    expect(source).toMatch(/function createSatelliteLayer\(\) \{[\s\S]*if \(tdtToken\)[\s\S]*t\{s\}\.tianditu\.gov\.cn\/img_w\/wmts[\s\S]*server\.arcgisonline\.com\/ArcGIS\/rest\/services\/World_Imagery\/MapServer\/tile\/\{z\}\/\{y\}\/\{x\}/)
  })

  it('keeps the viewport rectangle above the minimap basemap after bounds updates', () => {
    expect(source).toMatch(/if \(viewportRect\) \{[\s\S]*viewportRect\.setBounds\(rectBounds\)[\s\S]*\} else \{[\s\S]*viewportRect = L\.rectangle/)
    expect(source).toMatch(/if \(viewportRect\) viewportRect\.bringToFront\(\)/)
  })

  it('fits the minimap extent around the current viewport rectangle so the full bounds stay visible while the main map zoom changes', () => {
    expect(source).toMatch(/function syncViewportCoverage\(rectBounds\) \{[\s\S]*minimap\.fitBounds\(rectBounds\.pad\(/)
    expect(source).toMatch(/function updateViewportRect\(\) \{[\s\S]*syncViewportCoverage\(rectBounds\)/)
    expect(source).toMatch(/watch\(isCollapsed, \(collapsed\) => \{[\s\S]*syncViewportCoverage\(/)
    expect(source).toMatch(/const VIEWPORT_PADDING_RATIO = 0\.[1-4]\d?/)
    expect(source).toMatch(/const VIEWPORT_FIT_MAX_ZOOM = 1[1-2]/)
  })

  it('renders the minimap with a full visible border instead of dropping the left and bottom edges', () => {
    expect(source).toContain('.minimap-container {')
    expect(source).not.toContain('border-left: none;')
    expect(source).not.toContain('border-bottom: none;')
    expect(source).toMatch(/border:\s*2px solid rgba\(56,\s*189,\s*248,\s*0\.4[0-9]\)/)
  })

  it('uses a thicker brighter viewport rectangle so the current map position is easier to pick out', () => {
    expect(source).toMatch(/viewportRect = L\.rectangle\(rectBounds,\s*\{[\s\S]*color: '#7dd3fc'[\s\S]*weight: 2\.[2-9][\s\S]*fillOpacity: 0\.2[0-9]/)
    expect(source).toMatch(/dashArray: '6 4'/)
  })
})
