import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const sourcePath = resolve(import.meta.dirname, 'HomeOverview.vue')
const source = readFileSync(sourcePath, 'utf8')

describe('HomeOverview structure', () => {
  it('removes the floating toolbar from the home page chrome', () => {
    expect(source).not.toMatch(/<FloatingToolbar\b/)
    expect(source).not.toMatch(/import FloatingToolbar/)
  })

  it('restores the original home-only map tool rail and avoids the sea-condition dock', () => {
    expect(source).toMatch(/import HomeMapToolRail from '\.\.\/components\/layout\/HomeMapToolRail\.vue'/)
    expect(source).toMatch(/<HomeMapToolRail\b/)
    expect(source).not.toMatch(/import MapActionDock/)
    expect(source).not.toMatch(/<MapActionDock\b/)
  })

  it('keeps the original home map tool handlers wired on the vertical rail', () => {
    expect(source).toMatch(/:map-mode="store\.mapMode"/)
    expect(source).toMatch(/:camera-active="showCameraOverlay"/)
    expect(source).toMatch(/:typhoon-panel-open="showTyphoonPanel"/)
    expect(source).toMatch(/@zoom-in="handleZoomIn"/)
    expect(source).toMatch(/@zoom-out="handleZoomOut"/)
    expect(source).toMatch(/@toggle-map-mode="handleToggleMapMode"/)
    expect(source).toMatch(/@basemap-change="handleBasemapChange"/)
    expect(source).toMatch(/@toggle-typhoon="toggleTyphoonPanel"/)
  })

  it('renders a dedicated right-side layer panel with LayerControl', () => {
    expect(source).toMatch(/class="tool-rail-layer-shell"/)
    expect(source).toMatch(/<LayerControl @layer-toggle="handleLayerToggle" \/>/)
  })

  it('gives the seawall block an explicit flex basis from the viewport metrics', () => {
    expect(source).toMatch(/--home-seawall-panel-min-height/)
    expect(source).toMatch(/flex:\s*1 0 var\(--home-seawall-panel-min-height\)/)
  })
})
