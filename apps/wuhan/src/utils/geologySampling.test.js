import { describe, expect, it } from 'vitest'
import { filterByTopFilters } from './geologySampling'

describe('filterByTopFilters', () => {
  it('keeps all records under the selected mggid', () => {
    const records = [
      { mggid: 'MGG-001', institution: 'A', ship: 'S1', device: 'D1', yearmoda: '20240101' },
      { mggid: 'MGG-001', institution: 'A', ship: 'S1', device: 'D2', yearmoda: '20240102' },
      { mggid: 'MGG-002', institution: 'B', ship: 'S2', device: 'D3', yearmoda: '20240103' },
    ]

    expect(filterByTopFilters(records, { mggid: 'MGG-001' })).toEqual([
      records[0],
      records[1],
    ])
  })
})
