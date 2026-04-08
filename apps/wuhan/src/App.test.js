import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const sourcePath = resolve(import.meta.dirname, 'App.vue')
const source = readFileSync(sourcePath, 'utf8')

describe('App header backdrop integration', () => {
  it('renders a global blurred backdrop below the header and above the app view', () => {
    expect(source).toMatch(/<AppHeader @mega-menu-toggle="handleMegaMenuToggle" \/>/)
    expect(source).toMatch(/<Transition name="app-backdrop">/)
    expect(source).toMatch(/v-if="isMegaMenuOpen"/)
    expect(source).toMatch(/class="app-backdrop"/)
    expect(source).toMatch(/backdrop-filter:\s*blur\(18px\);/)
    expect(source).toMatch(/z-index:\s*1299;/)
  })
})
