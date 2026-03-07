import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const sourcePath = resolve(import.meta.dirname, 'DetailPopup.vue')
const source = readFileSync(sourcePath, 'utf8')

describe('DetailPopup clarity structure', () => {
  it('keeps a dedicated center chart stage and uses a compact realtime note', () => {
    expect(source).toMatch(/class="mode-panel-shell"/)
    expect(source).toMatch(/class="realtime-inline-note"/)
    expect(source).toMatch(/class="chart-stage"/)
  })

  it('uses a standardized legend row for thresholds', () => {
    expect(source).toMatch(/class="legend-chip-row"/)
    expect(source).toMatch(/class="legend-chip"/)
  })

  it('uses a vertical value-card list on the right rail', () => {
    expect(source).toMatch(/class="reading-card-list"/)
    expect(source).toMatch(/class="reading-value-card"/)
    expect(source).toMatch(/class="value-card-reading"/)
  })
})
