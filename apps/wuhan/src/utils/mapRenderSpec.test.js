import { describe, expect, it } from 'vitest'
import { parseTyphoonData } from '../data/typhoonDataParser'
import { buildMapRenderSpec, buildTyphoonRenderSpec } from './mapRenderSpec'

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

  it('builds geology point specs with dataset-specific shapes and linked mggid emphasis', () => {
    const spec = buildMapRenderSpec({
      geologyRecords: [
        {
          pointId: 'raw-1',
          datasetType: 'raw',
          latitude: 20,
          longitude: 110,
          ship: 'Ship A',
          cruise: 'Cruise 1',
          sample: 'S-001',
          device: 'Gravity Corer',
          yearmoda: '20240301',
          title: 'Sample Set 1',
          fgdcid: 'FGDC-1',
          institution: 'NOAA',
          objectid: 'OBJ-1',
          fid: 'FID-1',
          mggid: 'MGG-1',
        },
        {
          pointId: 'processed-1',
          datasetType: 'processed',
          latitude: 20.1,
          longitude: 110.1,
          ship: 'Ship A',
          cruise: 'Cruise 1',
          sample: 'S-002',
          device: 'Gravity Corer',
          yearmoda: '20240301',
          title: 'Sample Set 1',
          fgdcid: 'FGDC-2',
          institution: 'NOAA',
          objectid: 'OBJ-2',
          fid: 'FID-2',
          mggid: 'MGG-1',
        },
      ],
      geologyStyle: {
        colorBy: 'ship',
        activeMggid: 'MGG-1',
        activePointId: 'raw-1',
      },
    })

    expect(spec.geology).toHaveLength(2)
    expect(spec.geology[0]).toEqual(expect.objectContaining({
      sourceType: 'geology',
      visualVariant: 'raw',
      highlightState: 'selected',
      lat: 20,
      lng: 110,
    }))
    expect(spec.geology[1]).toEqual(expect.objectContaining({
      visualVariant: 'processed',
      highlightState: 'linked',
    }))
  })
})
