import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const sourcePath = resolve(import.meta.dirname, 'MapToolRail.vue')
const source = readFileSync(sourcePath, 'utf8')

describe('MapToolRail structure', () => {
  it('keeps only the three vertical entry buttons', () => {
    expect(source).toMatch(/\$emit\('toggle-layer-panel'\)/)
    expect(source).toMatch(/\$emit\('toggle-device-panel'\)/)
    expect(source).toMatch(/\$emit\('toggle-ai-panel'\)/)

    expect(source).not.toMatch(/\$emit\('toggle-typhoon'\)/)
    expect(source).not.toMatch(/\$emit\('toggle-map-mode'\)/)
    expect(source).not.toMatch(/\$emit\('toggle-camera'\)/)
    expect(source).not.toMatch(/\$emit\('zoom-in'\)/)
    expect(source).not.toMatch(/\$emit\('zoom-out'\)/)
    expect(source).not.toMatch(/\$emit\('reset-view'\)/)
    expect(source).not.toMatch(/\$emit\('locate'\)/)
    expect(source).not.toMatch(/\$emit\('basemap-change'/)
  })

  it('defines only the layer, device, and AI toggle emits', () => {
    expect(source).toMatch(/defineEmits\(\[[^\]]*'toggle-layer-panel'/)
    expect(source).toMatch(/defineEmits\(\[[^\]]*'toggle-device-panel'/)
    expect(source).toMatch(/defineEmits\(\[[^\]]*'toggle-ai-panel'/)

    expect(source).not.toMatch(/defineEmits\(\[[^\]]*'toggle-typhoon'/)
    expect(source).not.toMatch(/defineEmits\(\[[^\]]*'zoom-in'/)
  })
})
