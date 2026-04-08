import { describe, expect, it } from 'vitest'
import { buildGeologyHighlightState, getGeologyDatasetColor } from './geologySampling'

const records = [
  {
    pointId: 'raw-1',
    datasetType: 'raw',
    mggid: 'MGG-1',
  },
  {
    pointId: 'raw-2',
    datasetType: 'raw',
    mggid: 'MGG-2',
  },
  {
    pointId: 'processed-1',
    datasetType: 'processed',
    mggid: 'MGG-1',
  },
]

describe('geologySampling utils', () => {
  it('returns stable default colors for raw and processed point datasets', () => {
    expect(getGeologyDatasetColor(records[0])).toBe('#0EA5E9')
    expect(getGeologyDatasetColor(records[2])).toBe('#F97316')
  })

  it('marks selected, linked and dimmed states for mggid highlighting', () => {
    expect(buildGeologyHighlightState(records[0], {
      activeMggid: 'MGG-1',
      activePointId: 'raw-1',
    })).toBe('selected')
    expect(buildGeologyHighlightState(records[2], {
      activeMggid: 'MGG-1',
      activePointId: 'raw-1',
    })).toBe('linked')
    expect(buildGeologyHighlightState(records[1], {
      activeMggid: 'MGG-1',
      activePointId: 'raw-1',
    })).toBe('dimmed')
  })
})
