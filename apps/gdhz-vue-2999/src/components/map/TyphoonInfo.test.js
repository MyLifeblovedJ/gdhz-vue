import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const typhoonInfoSource = readFileSync(
  resolve(__dirname, 'TyphoonInfo.vue'),
  'utf8',
)

describe('TyphoonInfo template', () => {
  it('does not render the typhoon id label in the embedded header', () => {
    expect(typhoonInfoSource).not.toContain('<span>{{ typhoon.id }}</span>')
    expect(typhoonInfoSource).toContain('class="typhoon-id-meta">更新时间 {{ formatTime(currentPoint?.time) }}</span>')
  })
})
