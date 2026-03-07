import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const sourcePath = resolve(import.meta.dirname, 'MapToolRail.vue')
const source = readFileSync(sourcePath, 'utf8')

describe('MapToolRail structure', () => {
  it('places the layer button above the map mode button', () => {
    const layerIndex = source.indexOf("title=\"图层控制\"")
    const modeIndex = source.indexOf('class="tool-btn mode"')

    expect(layerIndex).toBeGreaterThanOrEqual(0)
    expect(modeIndex).toBeGreaterThanOrEqual(0)
    expect(layerIndex).toBeLessThan(modeIndex)
  })

  it('emits a dedicated toggle event for the layer panel', () => {
    expect(source).toMatch(/defineEmits\(\[[^\]]*'toggle-layer-panel'/)
    expect(source).toMatch(/\$emit\('toggle-layer-panel'\)/)
  })
})
