import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const sourcePath = resolve(import.meta.dirname, 'AppHeader.vue')
const source = readFileSync(sourcePath, 'utf8')

describe('AppHeader global emphasis', () => {
  it('keeps the navigation centered and removes the page-specific home emphasis state', () => {
    expect(source).not.toMatch(/home-emphasis/)
    expect(source).not.toMatch(/resolveHomeHeaderBrandWidth/)
    expect(source).not.toMatch(/--header-brand-width/)
    expect(source).toMatch(/justify-content:\s*center;/)
  })

  it('enlarges the global brand and nav sizing', () => {
    expect(source).toMatch(/\.app-header\s*\{/)
    expect(source).toMatch(/height:\s*92px;/)
    expect(source).toMatch(/\.brand-logo\s*\{/)
    expect(source).toMatch(/width:\s*60px;/)
    expect(source).toMatch(/height:\s*60px;/)
    expect(source).toMatch(/\.brand-title\s*\{/)
    expect(source).toMatch(/font-size:\s*28px;/)
    expect(source).toMatch(/\.header-nav\s*\{/)
    expect(source).toMatch(/gap:\s*36px;/)
    expect(source).toMatch(/\.nav-text\s*\{/)
    expect(source).toMatch(/font-size:\s*20px;/)
    expect(source).toMatch(/\.nav-btn\.active \.nav-text\s*\{/)
    expect(source).toMatch(/font-size:\s*22px;/)
  })

  it('renders a unified hover mega menu with grouped vertical submenu lists', () => {
    expect(source).toMatch(/class="header-nav-area"/)
    expect(source).toMatch(/@mouseenter="openMegaMenu"/)
    expect(source).toMatch(/@mouseleave="closeMegaMenu"/)
    expect(source).toMatch(/v-for="section in navMegaSections"/)
    expect(source).toMatch(/v-for="child in section\.children"/)
    expect(source).toMatch(/class="mega-menu-section"/)
    expect(source).toMatch(/class="mega-menu-links"/)
    expect(source).toMatch(/class="mega-menu-link"/)
    expect(source).toMatch(/buildSubmenuLocation\(section, child\)/)
    expect(source).toMatch(/flex-direction:\s*column;/)
  })
})
