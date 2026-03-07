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

export function getHomeLegendAnchor({ rootRect, deviceRect, viewportHeight, leftOffset = 18 } = {}) {
  if (!rootRect || !deviceRect) {
    return { left: 0, bottom: 0 }
  }

  const safeViewportHeight = viewportHeight || rootRect.height || window.innerHeight

  return {
    left: Math.round(deviceRect.right - rootRect.left + leftOffset),
    bottom: Math.round(safeViewportHeight - deviceRect.bottom),
  }
}
