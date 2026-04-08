import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const sourcePath = resolve(import.meta.dirname, 'AlertBanner.vue')
const source = readFileSync(sourcePath, 'utf8')

describe('AlertBanner structure', () => {
  it('keeps the collapse button in a dedicated action slot outside the marquee content', () => {
    expect(source).toMatch(/<div class="marquee-action-slot">[\s\S]*?<button class="marquee-collapse-btn"/)
    expect(source).toMatch(/\.marquee-action-slot\s*\{/)
    const collapseBtnBlock = source.match(/\.marquee-collapse-btn\s*\{[^}]*\}/)

    expect(collapseBtnBlock?.[0]).toBeTruthy()
    expect(collapseBtnBlock?.[0]).not.toMatch(/position:\s*absolute;/)
  })

  it('avoids mask-image on marquee content and uses a regular fade overlay instead', () => {
    expect(source).not.toMatch(/mask-image:/)
    expect(source).toMatch(/\.alert-marquee-content::after\s*\{/)
  })
})
