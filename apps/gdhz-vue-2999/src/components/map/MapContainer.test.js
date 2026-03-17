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

  it('renders city surge warnings as glow boundaries instead of filled polygons in 2D and 3D', () => {
    expect(source).toMatch(/const WARNING_LEVEL_STYLE = \{[\s\S]*red: \{ color: '#FF4D4F'[\s\S]*glowOpacity:[\s\S]*lineOpacity:/)
    expect(source).toMatch(/L\.polyline\(outerRing, \{[\s\S]*weight: style\.glowWeight[\s\S]*opacity: style\.glowOpacity/)
    expect(source).toMatch(/L\.polyline\(outerRing, \{[\s\S]*weight: style\.lineWeight[\s\S]*opacity: style\.lineOpacity/)
    expect(source).toMatch(/viewer\.entities\.add\(\{[\s\S]*polyline: \{[\s\S]*width: style\.glowWidth[\s\S]*material: Color\.fromCssColorString\(style\.color\)\.withAlpha\(style\.glowOpacity\)/)
    expect(source).toMatch(/viewer\.entities\.add\(\{[\s\S]*polyline: \{[\s\S]*width: style\.lineWidth[\s\S]*material: Color\.fromCssColorString\(style\.color\)\.withAlpha\(style\.lineOpacity\)/)
    expect(source).not.toMatch(/fillOpacity: 0\.55/)
    expect(source).not.toMatch(/polygon:\s*\{[\s\S]*material: fillColor\.withAlpha\(style\.fillOpacity\)/)
  })

  it('uses separated orange and yellow warning colors and a light blue province border', () => {
    expect(source).toMatch(/orange: \{ color: '#FF8A3D'/)
    expect(source).toMatch(/yellow: \{ color: '#FFD84A'/)
    expect(source).toMatch(/const PROVINCE_BOUNDARY_COLOR = '#CFE8FF'/)
    expect(source).toMatch(/color: PROVINCE_BOUNDARY_COLOR/)
    expect(source).toMatch(/material: Color\.fromCssColorString\(PROVINCE_BOUNDARY_COLOR\)/)
  })
})
