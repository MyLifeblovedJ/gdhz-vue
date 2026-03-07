import { describe, expect, test } from 'vitest'
import {
  getHomeBannerBounds,
  getHomeLegendAnchor,
} from './homeChromeLayout'

describe('homeChromeLayout', () => {
  test('clamps banner width between safe minimum and maximum while avoiding side columns', () => {
    expect(getHomeBannerBounds({ viewportWidth: 1600, columnWidth: 380 })).toEqual({
      width: 816,
      maxWidth: 816,
      minWidth: 816,
    })

    expect(getHomeBannerBounds({ viewportWidth: 1280, columnWidth: 360 })).toEqual({
      width: 536,
      maxWidth: 536,
      minWidth: 536,
    })

    expect(getHomeBannerBounds({ viewportWidth: 2400, columnWidth: 420 })).toEqual({
      width: 1536,
      maxWidth: 1536,
      minWidth: 1536,
    })
  })

  test('anchors legend beside the device block using measured rectangles', () => {
    expect(
      getHomeLegendAnchor({
        rootRect: { left: 0, top: 0, height: 900 },
        deviceRect: { right: 396, top: 82, bottom: 600 },
        viewportHeight: 900,
        leftOffset: 18,
      })
    ).toEqual({
      left: 414,
      bottom: 300,
    })
  })
})
