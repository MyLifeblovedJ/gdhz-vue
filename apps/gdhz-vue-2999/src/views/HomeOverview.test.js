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

  it('passes layer panel state into the map tool rail', () => {
    expect(source).toMatch(/:layer-panel-open="showLayerPanel"/)
    expect(source).toMatch(/@toggle-layer-panel="toggleLayerPanel"/)
  })

  it('renders a dedicated right-side layer panel with LayerControl', () => {
    expect(source).toMatch(/class="tool-rail-layer-shell"/)
    expect(source).toMatch(/<LayerControl @layer-toggle="handleLayerToggle" \/>/)
  })
})
