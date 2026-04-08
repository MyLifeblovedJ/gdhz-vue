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

  it('replays pending external viewport subscriptions when the 2D map finishes initializing', () => {
    expect(source).toMatch(/function ensureExternalViewportHandlers\(\)/)
    expect(source).toMatch(/function flushExternalViewportCallbacks[\s\S]*externalMoveCallbacks\.forEach\(fn => fn\(\)\)[\s\S]*externalZoomCallbacks\.forEach\(fn => fn\(zoom\)\)/)
    expect(source).toMatch(/function initMap\(\) \{[\s\S]*ensureExternalViewportHandlers\(\)[\s\S]*flushExternalViewportCallbacks\(\)/)
  })

  it('notifies external viewport subscribers after Cesium camera movement ends', () => {
    expect(source).toMatch(/viewerCameraMoveEndHandler = \(\) => \{[\s\S]*applyCountyBoundaryVisibility3D\(\)[\s\S]*flushExternalViewportCallbacks\(null\)/)
  })

  it('projects 3D screen coordinates through a Cesium helper that supports both window APIs', () => {
    expect(source).toMatch(/function projectCesiumToWindowCoordinates\(position\) \{[\s\S]*SceneTransforms\.worldToWindowCoordinates \|\| SceneTransforms\.wgs84ToWindowCoordinates/)
    expect(source).toMatch(/function latLngToScreenPoint\(lat, lng\) \{[\s\S]*const cartesian = Cartesian3\.fromDegrees\(lng, lat\)[\s\S]*const windowPos = projectCesiumToWindowCoordinates\(cartesian\)/)
    expect(source).not.toMatch(/function latLngToScreenPoint\(lat, lng\) \{[\s\S]*SceneTransforms\.wgs84ToWindowCoordinates/)
  })

  it('publishes main-map mouse coordinates for external readouts in both 2D and 3D modes', () => {
    expect(source).toMatch(/const externalMouseCoordinateCallbacks = new Set\(\)/)
    expect(source).toMatch(/function onMouseCoordinateChange\(cb\) \{[\s\S]*externalMouseCoordinateCallbacks\.add\(cb\)/)
    expect(source).toMatch(/function offMouseCoordinateChange\(cb\) \{[\s\S]*externalMouseCoordinateCallbacks\.delete\(cb\)/)
    expect(source).toMatch(/function resolveCesiumMouseCoordinate\(position\) \{[\s\S]*scene\.globe\.pick\(ray, scene\)[\s\S]*cartesianToCartographic/)
    expect(source).toMatch(/viewer\.screenSpaceEventHandler\.setInputAction\(\(movement\) => \{[\s\S]*emitMouseCoordinate\(resolveCesiumMouseCoordinate\(pendingCesiumHoverPosition\)\)[\s\S]*\}, ScreenSpaceEventType\.MOUSE_MOVE\)/)
    expect(source).toMatch(/viewer\.scene\.canvas\?\.addEventListener\('mouseleave', cesiumMouseLeaveHandler\)/)
    expect(source).toMatch(/leafletMouseMoveHandler = \(event\) => \{[\s\S]*emitMouseCoordinate\(formatMouseCoordinatePayload\(latlng\.lng, latlng\.lat, 0, '2D'\)\)/)
    expect(source).toMatch(/map\.getContainer\(\)\?\.addEventListener\('mouseleave', leafletMouseLeaveHandler\)/)
    expect(source).toMatch(/defineExpose\(\{[\s\S]*onMouseCoordinateChange,[\s\S]*offMouseCoordinateChange,/)
  })

  it('adds dedicated 2D and 3D geology render collections and reacts to geology spec changes', () => {
    expect(source).toMatch(/let geologyLayer2D = null/)
    expect(source).toMatch(/let geologyEntities3D = \[\]/)
    expect(source).toMatch(/function renderGeology2D\(\) \{[\s\S]*mapRenderSpec\.value\.geology\.forEach/)
    expect(source).toMatch(/function renderGeology3D\(\) \{[\s\S]*mapRenderSpec\.value\.geology\.forEach/)
    expect(source).toMatch(/function renderGeology\(\) \{[\s\S]*renderGeology2D\(\)[\s\S]*renderGeology3D\(\)/)
    expect(source).toMatch(/watch\(\(\) => mapRenderSpec\.value\.geology, \(\) => renderGeology\(\), \{ deep: true \}\)/)
  })

  it('tracks geology mggid linkage on point click and clears it on blank-map click', () => {
    expect(source).toMatch(/store\.setActiveGeologyPoint\(item\.sourceId\)/)
    expect(source).toMatch(/store\.clearActiveGeologySelection\(\)/)
    expect(source).toMatch(/const geologyPane = map\.createPane\('geology-pane'\)/)
    expect(source).toMatch(/geologyLayer2D = L\.layerGroup\(\)\.addTo\(map\)/)
  })
})
