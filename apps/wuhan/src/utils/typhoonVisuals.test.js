import { describe, expect, it } from 'vitest'
import { parseTyphoonData } from '../data/typhoonDataParser'
import {
  buildQuadrantWindCirclePolygon,
  buildTyphoonVisualModel,
  getTyphoonCategoryColor,
} from './typhoonVisuals'

function radialDistanceKm(center, point) {
  const latKm = (point.lat - center.lat) * 111.32
  const lngKm = (point.lng - center.lng) * 111.32 * Math.cos(center.lat * Math.PI / 180)
  return Math.sqrt(latKm ** 2 + lngKm ** 2)
}

describe('typhoonVisuals', () => {
  it('maps typhoon categories to stable colors', () => {
    expect(getTyphoonCategoryColor('超强台风')).toBe('#ff0000')
    expect(getTyphoonCategoryColor('台风')).toBe('#ff9900')
  })

  it('builds a non-circular quadrant wind polygon from asymmetric radii', () => {
    const center = { lat: 20.9, lng: 115.6 }
    const polygon = buildQuadrantWindCirclePolygon(center, {
      ne: 350,
      nw: 380,
      sw: 320,
      se: 350,
    }, 8)

    expect(polygon.length).toBeGreaterThan(20)
    expect(polygon[0]).toEqual(polygon.at(-1))

    const distances = polygon.slice(0, -1).map(point => Math.round(radialDistanceKm(center, point)))
    expect(Math.max(...distances) - Math.min(...distances)).toBeGreaterThan(40)
  })

  it('builds a visual model for real typhoon 202518 with history, forecast, and wind circles', () => {
    const typhoon = parseTyphoonData()
    const model = buildTyphoonVisualModel(typhoon)

    expect(model.historySegments.length).toBe(typhoon.track.length - 1)
    expect(model.forecastPoints.length).toBe(typhoon.forecast.length + 1)
    expect(model.currentPoint).toMatchObject({
      lat: 20.9,
      lng: 115.6,
      strong: '超强台风',
    })
    expect(model.windCircles.map(item => item.key)).toEqual(['radius7', 'radius10', 'radius12'])
    expect(model.windCircles[0].polygon.length).toBeGreaterThan(40)
  })
})
