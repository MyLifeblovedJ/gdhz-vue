export const HOME_VIEWPORT_PROFILE = {
  SPACIOUS: 'spacious',
  STANDARD: 'standard',
  COMPACT: 'compact',
}

export const HOME_VIEWPORT_SPACIOUS_MIN = 1280
export const HOME_VIEWPORT_STANDARD_MIN = 980

const HOME_PROFILE_METRICS = {
  [HOME_VIEWPORT_PROFILE.SPACIOUS]: {
    profile: HOME_VIEWPORT_PROFILE.SPACIOUS,
    coastalVisibleRows: 4,
    coastalCardHeight: 112,
    coastalGridGap: 8,
    warningVisibleRows: 4,
    warningBodyMaxHeight: 252,
    deviceListMaxHeight: 468,
    seawallPanelMinHeight: 340,
    typhoonBodyMaxHeight: 420,
    dockHeight: 148,
    dockBottomSafeArea: 24,
    legendLeftOffset: 24,
    legendBottomOffset: 24,
  },
  [HOME_VIEWPORT_PROFILE.STANDARD]: {
    profile: HOME_VIEWPORT_PROFILE.STANDARD,
    coastalVisibleRows: 3,
    coastalCardHeight: 104,
    coastalGridGap: 6,
    warningVisibleRows: 3,
    warningBodyMaxHeight: 196,
    deviceListMaxHeight: 388,
    seawallPanelMinHeight: 420,
    typhoonBodyMaxHeight: 340,
    dockHeight: 148,
    dockBottomSafeArea: 24,
    legendLeftOffset: 24,
    legendBottomOffset: 24,
  },
  [HOME_VIEWPORT_PROFILE.COMPACT]: {
    profile: HOME_VIEWPORT_PROFILE.COMPACT,
    coastalVisibleRows: 2,
    coastalCardHeight: 96,
    coastalGridGap: 4,
    warningVisibleRows: 2,
    warningBodyMaxHeight: 148,
    deviceListMaxHeight: 320,
    seawallPanelMinHeight: 224,
    typhoonBodyMaxHeight: 260,
    dockHeight: 132,
    dockBottomSafeArea: 28,
    legendLeftOffset: 20,
    legendBottomOffset: 20,
  },
}

export function getHomeViewportProfile(height) {
  const safeHeight = Number.isFinite(height) ? height : 0

  if (safeHeight >= HOME_VIEWPORT_SPACIOUS_MIN) {
    return HOME_VIEWPORT_PROFILE.SPACIOUS
  }

  if (safeHeight >= HOME_VIEWPORT_STANDARD_MIN) {
    return HOME_VIEWPORT_PROFILE.STANDARD
  }

  return HOME_VIEWPORT_PROFILE.COMPACT
}

export function getHomeViewportMetrics(height) {
  const profile = getHomeViewportProfile(height)
  return HOME_PROFILE_METRICS[profile]
}
