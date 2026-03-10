import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const sourcePath = resolve(import.meta.dirname, 'MapContainer.vue')
const source = readFileSync(sourcePath, 'utf8')

describe('MapContainer coastal city label layering', () => {
  it('renders 2D coastal city labels in a dedicated pane above city warning polygons', () => {
    expect(source).toMatch(/const COASTAL_CITY_LABEL_PANE = 'coastal-city-label-pane'/)
    expect(source).toMatch(/const cityWarningPane = map\.createPane\(CITY_WARNING_PANE\)[\s\S]*cityWarningPane\.style\.zIndex = 805/)
    expect(source).toMatch(/const coastalCityLabelPane = map\.createPane\(COASTAL_CITY_LABEL_PANE\)[\s\S]*coastalCityLabelPane\.style\.zIndex = 825/)
    expect(source).toMatch(/L\.marker\(\[item\.lat, item\.lng\], \{[\s\S]*pane: COASTAL_CITY_LABEL_PANE[\s\S]*icon: L\.divIcon/)
  })
})
