import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const sourcePath = resolve(import.meta.dirname, 'SeaConditionHome.vue')
const source = readFileSync(sourcePath, 'utf8')

describe('SeaConditionHome defaults', () => {
  it('disables coastal base and tide stations by default on the sea condition page', () => {
    expect(source).toMatch(/const seaConditionLayers = \{[\s\S]*coastal_base: false,[\s\S]*tide_stations: false,/)
  })

  it('does not render the right-side coastal observation column', () => {
    expect(source).not.toContain('class="column right-column"')
    expect(source).not.toContain('<CoastalObservationPanel')
    expect(source).not.toContain("import CoastalObservationPanel from '../components/layout/CoastalObservationPanel.vue'")
  })

  it('anchors the tool rail to a fixed right edge gutter on the sea condition page', () => {
    expect(source).toContain('--tool-rail-safe-right: 12px;')
    expect(source).not.toContain('--tool-rail-safe-right: calc(12px + var(--home-column-width) + var(--toolbar-gap));')
  })

  it('uses a dedicated 35 percent left-column width resolver for the sea condition page', () => {
    expect(source).toContain('function resolveSeaConditionColumnWidth(width)')
    expect(source).toContain('const currentColumnWidth = computed(() => Math.round(resolveSeaConditionColumnWidth(viewportWidth.value)))')
    expect(source).not.toContain('const currentColumnWidth = computed(() => Math.round(resolveHomeColumnWidth(viewportWidth.value)))')
    expect(source).toContain('Math.min(500, Math.max(420, safeWidth * 0.35))')
    expect(source).toContain('Math.min(580, Math.max(460, safeWidth * 0.35))')
    expect(source).toContain('Math.min(680, Math.max(520, safeWidth * 0.35))')
  })

  it('adds page-scoped readability overrides for warning and seawall panels', () => {
    expect(source).toContain('.left-column {')
    expect(source).toContain('.left-column .block-title {')
    expect(source).toContain('.warning-body :deep(.panel-title)')
    expect(source).toContain('.warning-body :deep(.alert-title)')
    expect(source).toContain('.seawall-body :deep(.stat-value)')
    expect(source).toContain('.seawall-body :deep(.bp-name)')
  })

  it('adds page-scoped readability overrides for all right-side popup panels', () => {
    expect(source).toContain('.tool-rail-layer-panel {')
    expect(source).toContain('width: 400px;')
    expect(source).toContain('.tool-rail-typhoon-panel {')
    expect(source).toContain('width: 420px;')
    expect(source).toContain('.tool-rail-device-panel {')
    expect(source).toContain('width: 440px;')
    expect(source).toContain('.tool-rail-ai-panel {')
    expect(source).toContain('width: 500px;')
    expect(source).toContain('.tool-rail-layer-content :deep(.layer-item input[type="checkbox"])')
    expect(source).toContain('.tool-rail-typhoon-content :deep(.embedded .summary-row-value)')
    expect(source).toContain('.tool-rail-device-content :deep(.device-name)')
    expect(source).toContain('.tool-rail-ai-content :deep(.ai-hero-title)')
  })
})
