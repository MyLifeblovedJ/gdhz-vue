import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const sourcePath = resolve(import.meta.dirname, 'SeaConditionHome.vue')
const source = readFileSync(sourcePath, 'utf8')

describe('SeaConditionHome defaults', () => {
  it('imports nextTick before using it for the initial minimap viewport sync', () => {
    expect(source).toMatch(/import\s*\{[^}]*nextTick[^}]*\}\s*from 'vue'/)
    expect(source).toMatch(/nextTick\(\(\) => \{\s*updateViewBounds\(\)/)
  })

  it('disables coastal base and tide stations by default on the sea condition page', () => {
    expect(source).toMatch(/const seaConditionLayers = \{[\s\S]*coastal_base: false,[\s\S]*tide_stations: false,/)
  })

  it('renders the left geology sidebar as an accordion with resize support', () => {
    expect(source).toContain('class="geology-sidebar"')
    expect(source).toContain('class="sidebar-accordion"')
    expect(source).toContain('class="sidebar-section-title"')
    expect(source).toContain("function toggleSidebarMenu(menuId)")
    expect(source).toContain('function startSidebarResize(event)')
    expect(source).toContain('function stopSidebarResize()')
    expect(source).toMatch(/const SIDEBAR_MIN_WIDTH = \d+/)
    expect(source).toMatch(/const SIDEBAR_MAX_WIDTH = \d+/)
  })

  it('keeps the standalone right-side layer popup alongside the restored left accordion', () => {
    expect(source).toContain('class="tool-rail-layer-shell"')
    expect(source).toContain('function toggleRightLayerPanel()')
    expect(source).toContain('function closeRightLayerPanel()')
  })

  it('renders a fixed map search glass and minimap with sidebar width offsets', () => {
    expect(source).toContain("import MapSearchGlass from '../components/map/MapSearchGlass.vue'")
    expect(source).toContain('<MapSearchGlass')
    expect(source).toContain('class="map-search-glass-anchor"')
    expect(source).toContain('class="minimap-anchor"')
    expect(source).toContain(':style="{ marginLeft: `${sidebarWidth}px` }"')
    expect(source).toContain(':style="{ left: `${sidebarWidth + 28}px` }"')
    expect(source).toContain(':style="{ left: `${sidebarWidth + 16}px` }"')
  })

  it('adds page-scoped readability overrides for the remaining right-side popup panels', () => {
    expect(source).toContain('.tool-rail-typhoon-panel {')
    expect(source).toContain('width: 480px;')
    expect(source).toContain('.tool-rail-device-panel {')
    expect(source).toContain('width: 480px;')
    expect(source).toContain('.tool-rail-ai-panel {')
    expect(source).toContain('width: 500px;')
    expect(source).toContain('.tool-rail-typhoon-content :deep(.typhoon-info-panel.embedded)')
    expect(source).toContain('.tool-rail-device-content {')
    expect(source).toContain('.tool-rail-ai-content :deep(.ai-decision-panel)')
  })
})
