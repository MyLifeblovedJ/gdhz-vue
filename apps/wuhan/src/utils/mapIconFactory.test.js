import { describe, expect, it } from 'vitest'
import {
  createDeviceIcon,
  createTyphoonIcon,
  createTyphoonPointIcon,
  createVesselIcon,
  decodeSvgDataUri,
} from './mapIconFactory'

describe('mapIconFactory', () => {
  it('creates stable device icons with the expected shell and glyph color', () => {
    const iconUri = createDeviceIcon({
      iconName: 'fa-water',
      color: '#ef4444',
      size: 14,
    })

    const decoded = decodeSvgDataUri(iconUri)
    expect(iconUri).toBe(createDeviceIcon({
      iconName: 'fa-water',
      color: '#ef4444',
      size: 14,
    }))
    expect(decoded).toContain('rgba(10,22,38,0.92)')
    expect(decoded).toContain('#ef4444')
    expect(decoded).toContain('<path')
    expect(decoded).toContain('width="56"')
  })

  it('creates vessel icons as the same compact ship glyph used by both map adapters', () => {
    const decoded = decodeSvgDataUri(createVesselIcon({
      color: '#d9973a',
      size: 8,
    }))

    expect(decoded).toContain('viewBox="0 0 16 16"')
    expect(decoded).toContain('fill="#d9973a"')
    expect(decoded).toContain('stroke="#d9973a"')
  })

  it('creates the shared typhoon marker and history point icons', () => {
    const typhoonDecoded = decodeSvgDataUri(createTyphoonIcon({ size: 60 }))
    const pointDecoded = decodeSvgDataUri(createTyphoonPointIcon({ color: '#ff0000', size: 12 }))

    expect(typhoonDecoded).toContain('viewBox="0 0 1024 1024"')
    expect(typhoonDecoded).toContain('width="120"')
    expect(typhoonDecoded).toContain('#d81e06')
    expect(pointDecoded).toContain('fill="#ffffff"')
    expect(pointDecoded).toContain('stroke="#ff0000"')
    expect(pointDecoded).toContain('width="48"')
  })
})
