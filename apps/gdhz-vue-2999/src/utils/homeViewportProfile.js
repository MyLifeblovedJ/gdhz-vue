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
    deviceListMaxHeight: 420,
    typhoonBodyMaxHeight: 420,
    warningBodyMaxHeight: 324,
    dockHeight: 148,
    dockBottomSafeArea: 24,
    legendLeftOffset: 24,
    legendBottomOffset: 24,
  },
  [HOME_VIEWPORT_PROFILE.STANDARD]: {
    profile: HOME_VIEWPORT_PROFILE.STANDARD,
    coastalVisibleRows: 3,
    coastalCardHeight: 108,
    deviceListMaxHeight: 360,
    typhoonBodyMaxHeight: 340,
    warningBodyMaxHeight: 324,
    dockHeight: 148,
    dockBottomSafeArea: 24,
    legendLeftOffset: 24,
    legendBottomOffset: 24,
  },
  [HOME_VIEWPORT_PROFILE.COMPACT]: {
    profile: HOME_VIEWPORT_PROFILE.COMPACT,
    coastalVisibleRows: 2,
    coastalCardHeight: 104,
    deviceListMaxHeight: 300,
    typhoonBodyMaxHeight: 260,
    warningBodyMaxHeight: 324,
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
