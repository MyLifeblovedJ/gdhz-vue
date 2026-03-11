const BANNER_SIDE_GUTTER = 72

export function getHomeBannerBounds({ viewportWidth = 0, columnWidth = 0 } = {}) {
  const safeViewportWidth = Number(viewportWidth) || 0
  const safeColumnWidth = Number(columnWidth) || 0
  const width = Math.max(0, safeViewportWidth - (safeColumnWidth * 2) - BANNER_SIDE_GUTTER)

  return {
    width,
    maxWidth: width,
    minWidth: width,
  }
}

export function getHomeLegendAnchor({ rootRect, leftColumnRect, decisionRect, legendRect, leftOffset = 18 } = {}) {
  if (!rootRect || !leftColumnRect) {
    return { left: 0, top: 0 }
  }

  const legendHeight = legendRect?.height || 0
  const decisionBottom = decisionRect?.bottom
  const top = decisionBottom && legendHeight
    ? Math.max(rootRect.top, Math.round(decisionBottom - legendHeight))
    : Math.round(decisionRect?.top ?? rootRect.top)

  return {
    left: Math.round(leftColumnRect.right - rootRect.left + leftOffset),
    top,
  }
}
