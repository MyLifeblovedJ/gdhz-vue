import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const sourcePath = resolve(import.meta.dirname, 'SeaConditionHome.vue')
const source = readFileSync(sourcePath, 'utf8')

describe('SeaConditionHome geology sampling sidebar', () => {
  it('renders geology sampling under 图层 as a legend-style panel with two independent checkbox rows', () => {
    expect(source).toContain('<div class="legend-panel" :class="{ collapsed: geologyCollapsed }">')
    expect(source).toContain('<div class="legend-content geology-layer-options" v-show="!geologyCollapsed">')
    expect(source).toContain('class="geology-layer-option" :class="{ active: geologyRawVisible }"')
    expect(source).toContain('class="geology-layer-option" :class="{ active: geologyProcessedVisible }"')
    expect(source).toContain('v-model="geologyRawVisible"')
    expect(source).toContain('v-model="geologyProcessedVisible"')
    expect(source).toContain('<span class="geology-layer-option-label">原始数据</span>')
    expect(source).toContain('<span class="geology-layer-option-label">处理后数据</span>')
  })

  it('keeps the geology layer panel styled to match the embedded legend panels', () => {
    expect(source).toContain("import MapLegend from '../components/map/MapLegend.vue'")
    expect(source).toContain('<MapLegend :embedded="true" />')
    expect(source).toContain('.geology-sidebar :deep(.legend-header),')
    expect(source).toContain('.geology-sidebar :deep(.legend-content),')
    expect(source).toContain('.geology-layer-options {')
    expect(source).toContain('grid-template-columns: minmax(0, 1fr);')
    expect(source).toContain('.geology-layer-option.active {')
  })

  it('preserves the minimap mouse readout and sidebar width offsets while restoring the historical left sidebar node', () => {
    expect(source).toContain('class="geology-sidebar"')
    expect(source).toContain(':style="{ marginLeft: `${sidebarWidth}px` }"')
    expect(source).toContain('<div ref="mouseReadoutRef" class="map-mouse-readout" aria-live="polite">')
    expect(source).toContain("import { attachLiquidGlass } from '../utils/liquidGlass'")
    expect(source).toContain('mapRef.value?.onMouseCoordinateChange?.(handleMouseCoordinateChange)')
    expect(source).toContain('mapRef.value?.offMouseCoordinateChange?.(handleMouseCoordinateChange)')
  })
})
