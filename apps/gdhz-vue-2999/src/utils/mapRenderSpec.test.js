import { describe, expect, it } from 'vitest'
import { parseTyphoonData } from '../data/typhoonDataParser'
import { buildTyphoonRenderSpec } from './mapRenderSpec'

describe('mapRenderSpec probability range', () => {
  it('matches the 3000 overview smooth cone geometry for typhoon probability range', () => {
    const typhoon = parseTyphoonData()
    const spec = buildTyphoonRenderSpec(typhoon, {
      typhoon: true,
      typhoon_probability_range: true,
    })

    const polygon = spec.polygons.find(item => item.id === 'typhoon-probability-cone')
    expect(polygon).toBeTruthy()
    expect(polygon.points.length).toBeGreaterThan(20)

    const currentCenter = {
      lat: typhoon.track.at(-1).lat,
      lng: typhoon.track.at(-1).lng,
    }
    expect(polygon.points[0]).toEqual(currentCenter)
    expect(polygon.points.some(point => point.lat === currentCenter.lat && point.lng === currentCenter.lng)).toBe(true)

    const endCenter = typhoon.forecast.at(-1)
    expect(polygon.points.some(point => point.lat > endCenter.lat + 1)).toBe(true)
    expect(polygon.points.some(point => point.lat < endCenter.lat - 1)).toBe(true)
  })
})
