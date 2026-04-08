import { describe, expect, it } from 'vitest'
import { parseTyphoonData } from './typhoonDataParser'

describe('typhoonDataParser', () => {
  it('parses RAGASA 202518 into homepage typhoon data at 2025-09-23 22:00', () => {
    const result = parseTyphoonData()

    expect(result.id).toBe('202518')
    expect(result.name).toBe('桦加沙')
    expect(result.enName).toBe('RAGASA')
    expect(result.track.length).toBeGreaterThan(0)
    expect(result.track.at(-1)).toMatchObject({
      time: '2025-09-23 22:00:00',
      strong: '超强台风',
      moveDirection: '西北西',
      moveSpeed: 20,
      windSpeed: 55,
      pressure: 930,
    })
    expect(result.windCircle).toMatchObject({
      center: { lat: 20.9, lng: 115.6 },
      radius7: { ne: 350, nw: 380, sw: 320, se: 350 },
      radius10: { ne: 150, nw: 150, sw: 150, se: 150 },
      radius12: { ne: 90, nw: 90, sw: 90, se: 90 },
    })
  })

  it('keeps only the China forecast points after the target time', () => {
    const result = parseTyphoonData()

    expect(result.forecast.length).toBe(7)
    expect(result.forecast[0]).toMatchObject({
      time: '2025-09-24 04:00:00',
      strong: '超强台风',
      windSpeed: 55,
      pressure: 935,
    })
    expect(result.forecast.at(-1)).toMatchObject({
      time: '2025-09-26 10:00:00',
      strong: '热带低压',
    })
  })
})
