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
    expect(source).toMatch(/--header-collapsed-height:\s*92px;/)
    expect(source).toMatch(/--header-expanded-height:\s*340px;/)
    expect(source).toMatch(/\.header-surface\.is-expanded\s*\{/)
    expect(source).toMatch(/\.brand-logo\s*\{/)
    expect(source).toMatch(/width:\s*60px;/)
    expect(source).toMatch(/height:\s*60px;/)
    expect(source).toMatch(/\.brand-title\s*\{/)
    expect(source).toMatch(/font-size:\s*28px;/)
    expect(source).toMatch(/\.header-nav\s*\{/)
    expect(source).toMatch(/column-gap:\s*20px;/)
    expect(source).toMatch(/\.nav-text\s*\{/)
    expect(source).toMatch(/font-size:\s*20px;/)
    expect(source).toMatch(/\.nav-btn\.active \.nav-text\s*\{/)
    expect(source).toMatch(/font-size:\s*22px;/)
  })

  it('keeps the header fixed while the integrated surface expands as one piece', () => {
    expect(source).toMatch(/class="header-surface"/)
    expect(source).toMatch(/class="header-nav-area"/)
    expect(source).toMatch(/class="nav-shell"/)
    expect(source).toMatch(/class="header-nav"/)
    expect(source).toMatch(/class="mega-menu-band"/)
    expect(source).toMatch(/class="mega-menu-grid"/)
    expect(source).toMatch(/@mouseenter="openMegaMenu/)
    expect(source).toMatch(/@mouseleave="closeMegaMenu"/)
    expect(source).toMatch(/v-for="item in navItems"/)
    expect(source).toMatch(/v-if="isMegaMenuOpen"/)
    expect(source).toMatch(/v-for="child in item\.children"/)
    expect(source).toMatch(/class="mega-menu-section"/)
    expect(source).toMatch(/class="mega-menu-links"/)
    expect(source).toMatch(/class="mega-menu-link"/)
    expect(source).toMatch(/class="mega-menu-placeholder"/)
    expect(source).toMatch(/buildSubmenuLocation\(item,\s*child\)/)
    expect(source).toMatch(/const navGridStyle = computed\(\(\) => \(\{/)
    expect(source).toMatch(/'--nav-column-count': navItems\.length/)
    expect(source).toMatch(/grid-template-columns:\s*repeat\(var\(--nav-column-count\),\s*minmax\(0,\s*1fr\)\);/)
    expect(source).toMatch(/\.app-header\s*\{[\s\S]*overflow:\s*visible;/)
    expect(source).toMatch(/\.header-surface\s*\{[\s\S]*position:\s*absolute;/)
    expect(source).toMatch(/\.header-surface\.is-expanded\s*\{[\s\S]*height:\s*var\(--header-expanded-height\);/)
    expect(source).toMatch(/\.nav-shell\s*\{[\s\S]*position:\s*relative;/)
    expect(source).toMatch(/\.mega-menu-band\s*\{[\s\S]*position:\s*absolute;/)
    expect(source).toMatch(/\.mega-menu-band\s*\{[\s\S]*top:\s*calc\(100%\s*\+\s*2px\);/)
    expect(source).toMatch(/\.mega-menu-band\s*\{[\s\S]*left:\s*0;/)
    expect(source).toMatch(/\.mega-menu-band\s*\{[\s\S]*right:\s*0;/)
    expect(source).toMatch(/\.mega-menu-grid\s*\{[\s\S]*padding-top:\s*4px;/)
  })

  it('keeps submenu columns aligned to the nav grid and removes fly-in motion', () => {
    expect(source).toMatch(/\.header-nav\s*\{[\s\S]*width:\s*100%;/)
    expect(source).toMatch(/\.mega-menu-band\s*\{[\s\S]*width:\s*100%;/)
    expect(source).not.toMatch(/\.mega-menu-enter-from,\s*\.mega-menu-leave-to\s*\{[\s\S]*transform:/)
  })

  it('uses symmetric side columns so the navigation stays on the header center line', () => {
    expect(source).toMatch(/\.header-top-row\s*\{[\s\S]*grid-template-columns:\s*minmax\(max-content,\s*1fr\)\s+minmax\(0,\s*1080px\)\s+minmax\(max-content,\s*1fr\);/)
    expect(source).toMatch(/\.header-brand\s*\{[\s\S]*justify-self:\s*start;/)
    expect(source).toMatch(/\.header-tools\s*\{[\s\S]*justify-self:\s*end;/)
  })

  it('opens the shared submenu rail for every top-level nav item, even without children', () => {
    expect(source).toMatch(/function openMegaMenu\(key\)\s*\{[\s\S]*isMegaMenuOpen\.value = true/)
    expect(source).not.toMatch(/item\?\.\s*children\?\.\s*length/)
  })
})
