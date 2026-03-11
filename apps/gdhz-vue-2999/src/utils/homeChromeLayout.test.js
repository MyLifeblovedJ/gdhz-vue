import { describe, expect, test } from 'vitest'
import {
  getHomeBannerBounds,
  getHomeLegendAnchor,
} from './homeChromeLayout'

describe('homeChromeLayout', () => {
  test('clamps banner width between safe minimum and maximum while avoiding side columns', () => {
    expect(getHomeBannerBounds({ viewportWidth: 1600, columnWidth: 380 })).toEqual({
      width: 768,
      maxWidth: 768,
      minWidth: 768,
    })

    expect(getHomeBannerBounds({ viewportWidth: 1280, columnWidth: 360 })).toEqual({
      width: 488,
      maxWidth: 488,
      minWidth: 488,
    })

    expect(getHomeBannerBounds({ viewportWidth: 2400, columnWidth: 420 })).toEqual({
      width: 1488,
      maxWidth: 1488,
      minWidth: 1488,
    })
  })

  test('anchors legend beside the left column and aligns its top edge with the decision block top', () => {
    expect(
      getHomeLegendAnchor({
        rootRect: { left: 0, top: 0, height: 900 },
        leftColumnRect: { right: 396 },
        decisionRect: { top: 82, bottom: 462 },
        legendRect: { height: 180 },
        leftOffset: 18,
      })
    ).toEqual({
      left: 414,
      top: 82,
    })
  })

  test('falls back to the decision block top edge when the legend height is unavailable', () => {
    expect(
      getHomeLegendAnchor({
        rootRect: { left: 0, top: 0, height: 900 },
        leftColumnRect: { right: 420 },
        decisionRect: { top: 118, bottom: 462 },
        leftOffset: 18,
      })
    ).toEqual({
      left: 438,
      top: 118,
    })
  })
})
