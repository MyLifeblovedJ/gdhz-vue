import { describe, expect, it } from 'vitest'
import {
  GEOLOGY_FIELD_KEYS,
  buildMockGeologySamplingPayload,
} from './geologySamplingMock'

describe('buildMockGeologySamplingPayload', () => {
  it('returns raw and processed records with shared mggid groups', () => {
    const payload = buildMockGeologySamplingPayload()

    expect(payload.raw.length).toBeGreaterThan(0)
    expect(payload.processed.length).toBeGreaterThan(0)
    expect(payload.raw[0]).toEqual(expect.objectContaining({
      datasetType: 'raw',
      pointId: expect.any(String),
      mggid: expect.any(String),
      ship: expect.any(String),
      cruise: expect.any(String),
      device: expect.any(String),
      latitude: expect.any(Number),
      longitude: expect.any(Number),
    }))
    expect(payload.processed[0]).toEqual(expect.objectContaining({
      datasetType: 'processed',
      folderPath: expect.any(String),
      pdfCount: expect.any(Number),
      excelCount: expect.any(Number),
      parseStatus: expect.any(String),
    }))
  })

  it('keeps every configured business field on both raw and processed records', () => {
    const payload = buildMockGeologySamplingPayload()

    GEOLOGY_FIELD_KEYS.forEach((field) => {
      expect(payload.raw[0]).toHaveProperty(field)
      expect(payload.processed[0]).toHaveProperty(field)
    })
  })

  it('creates one-to-many mggid groups across point records', () => {
    const payload = buildMockGeologySamplingPayload()
    const counts = payload.all.reduce((acc, item) => {
      acc[item.mggid] = (acc[item.mggid] || 0) + 1
      return acc
    }, {})

    expect(Object.values(counts).some(count => count > 1)).toBe(true)
  })
})
