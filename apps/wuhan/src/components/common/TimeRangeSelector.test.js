import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const sourcePath = resolve(import.meta.dirname, 'TimeRangeSelector.vue')
const source = readFileSync(sourcePath, 'utf8')

describe('TimeRangeSelector clarity structure', () => {
  it('uses a dedicated shell and quick range row', () => {
    expect(source).toMatch(/class="time-range-shell"/)
    expect(source).toMatch(/class="quick-range-row"/)
  })

  it('keeps custom range inputs and the timeline strip', () => {
    expect(source).toMatch(/class="custom-range-shell"/)
    expect(source).toMatch(/class="timeline-shell"/)
    expect(source).toMatch(/class="timeline-labels"/)
  })
})
