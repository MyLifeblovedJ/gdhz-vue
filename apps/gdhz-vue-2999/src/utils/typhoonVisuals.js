const TYPHOON_CATEGORY_COLORS = {
  '热带低压': '#00bfff',
  '热带风暴': '#00ff00',
  '强热带风暴': '#ffff00',
  '台风': '#ff9900',
  '强台风': '#ff00ff',
  '超强台风': '#ff0000',
}

function clampCosLatitude(lat) {
  return Math.max(Math.cos(lat * Math.PI / 180), 0.01)
}

export function getTyphoonCategoryColor(strong) {
  return TYPHOON_CATEGORY_COLORS[strong] || '#ef4444'
}

export function buildQuadrantWindCirclePolygon(center, radii, stepsPerQuadrant = 24) {
  if (!center || !radii) return []

  const centerLat = Number(center.lat)
  const centerLng = Number(center.lng)
  if (!Number.isFinite(centerLat) || !Number.isFinite(centerLng)) return []

  const quadrants = [
    { radius: radii.ne, start: 0, end: Math.PI / 2 },
    { radius: radii.nw, start: Math.PI / 2, end: Math.PI },
    { radius: radii.sw, start: Math.PI, end: Math.PI * 1.5 },
    { radius: radii.se, start: Math.PI * 1.5, end: Math.PI * 2 },
  ]
  const cosLat = clampCosLatitude(centerLat)
  const kmToLat = 1 / 111.32
  const points = []

  quadrants.forEach((quadrant) => {
    const radiusKm = Number(quadrant.radius)
    if (!Number.isFinite(radiusKm) || radiusKm <= 0) return

    const radiusLatDeg = radiusKm * kmToLat
    for (let step = 0; step <= stepsPerQuadrant; step += 1) {
      const angle = quadrant.start + (quadrant.end - quadrant.start) * (step / stepsPerQuadrant)
      const lat = centerLat + radiusLatDeg * Math.cos(angle)
      const lng = centerLng + (radiusLatDeg / cosLat) * Math.sin(angle)
      points.push({
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
      })
    }
  })

  if (!points.length) return []
  return [...points, { ...points[0] }]
}

export function buildTyphoonVisualModel(typhoonData) {
  const track = Array.isArray(typhoonData?.track) ? typhoonData.track : []
  const forecast = Array.isArray(typhoonData?.forecast) ? typhoonData.forecast : []
  const windCircle = typhoonData?.windCircle || null
  const currentPoint = track.length ? track[track.length - 1] : null

  const historySegments = track.slice(0, -1).map((point, index) => ({
    start: point,
    end: track[index + 1],
    color: getTyphoonCategoryColor(point.strong),
  }))

  const forecastPoints = currentPoint ? [currentPoint, ...forecast] : [...forecast]

  const windCircleConfigs = [
    { key: 'radius7', color: '#3B82F6', fillOpacity: 0.08, outlineOpacity: 0.7 },
    { key: 'radius10', color: '#F97316', fillOpacity: 0.12, outlineOpacity: 0.78 },
    { key: 'radius12', color: '#EF4444', fillOpacity: 0.18, outlineOpacity: 0.85 },
  ]

  const windCircles = windCircleConfigs
    .map((config) => {
      const polygon = buildQuadrantWindCirclePolygon(windCircle?.center, windCircle?.[config.key])
      if (!polygon.length) return null
      return {
        ...config,
        polygon,
      }
    })
    .filter(Boolean)

  return {
    currentPoint,
    historySegments,
    forecastPoints,
    forecast,
    windCircles,
  }
}

export { TYPHOON_CATEGORY_COLORS }
