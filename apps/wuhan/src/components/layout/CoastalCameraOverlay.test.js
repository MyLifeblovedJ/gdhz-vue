import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const sourcePath = resolve(import.meta.dirname, 'CoastalCameraOverlay.vue')
const source = readFileSync(sourcePath, 'utf8')

describe('CoastalCameraOverlay presentation', () => {
  it('uses matched coastal images instead of the old video mock', () => {
    expect(source).toMatch(/backgroundImage: `url\(\$\{item\.snapshotUrl \|\| `\/images\/coastal\/\$\{item\.id\}\.png`\}\)`/)
  })

  it('shows station status dot and relative update text, without risk bar or erosion rate', () => {
    expect(source).toMatch(/class="station-status-dot"/)
    expect(source).toMatch(/class="frame-top-row"/)
    expect(source).toMatch(/class="frame-bottom-row"/)
    expect(source).toMatch(/class="frame-update-time"/)
    expect(source).toMatch(/class="frame-station-name"/)
    expect(source).not.toMatch(/class="anchor-arrow"/)
    expect(source).not.toMatch(/class="card-info"/)
    expect(source).not.toMatch(/risk-bar/)
    expect(source).not.toMatch(/erosion-val/)
  })
})
