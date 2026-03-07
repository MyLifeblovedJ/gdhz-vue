const SVG_NS = 'http://www.w3.org/2000/svg'
const DEVICE_TEXTURE_SCALE = 4
const VESSEL_TEXTURE_SCALE = 6
const TYPHOON_POINT_TEXTURE_SCALE = 4
const TYPHOON_MARKER_TEXTURE_SCALE = 2

function svgToDataUri(svg) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function getDeviceGlyph(iconName, color) {
  const glyphs = {
    'fa-water': `
      <path d="M12 4.2C9.2 7.3 7.5 10 7.5 12.9A4.5 4.5 0 0 0 12 17.5A4.5 4.5 0 0 0 16.5 12.9C16.5 10 14.8 7.3 12 4.2Z" fill="${color}" />
    `,
    'fa-tower-observation': `
      <path d="M9 18.2h6l-1-6.2h-4z" fill="${color}" />
      <path d="M12 6.2l4 4.1H8z" fill="${color}" />
      <rect x="11.1" y="9.7" width="1.8" height="2.4" rx="0.4" fill="rgba(10,22,38,0.92)" />
    `,
    'fa-chart-line': `
      <rect x="7.4" y="15.3" width="9.2" height="1.7" rx="0.85" fill="${color}" />
      <path d="M8.1 13.6l2.5-2.2 2.1 1.2 3.2-3.9 1.2 1.1-3.9 4.8-2.2-1.2-1.9 1.7z" fill="${color}" />
    `,
    'fa-bullseye': `
      <circle cx="12" cy="12" r="5.4" fill="none" stroke="${color}" stroke-width="2.2" />
      <circle cx="12" cy="12" r="2.5" fill="${color}" />
    `,
    'fa-circle': `
      <circle cx="12" cy="12" r="4.6" fill="${color}" />
    `,
    'fa-circle-dot': `
      <circle cx="12" cy="12" r="5.2" fill="none" stroke="${color}" stroke-width="2" />
      <circle cx="12" cy="12" r="2.1" fill="${color}" />
    `,
    'fa-video': `
      <rect x="6.8" y="8.4" width="7.8" height="7.2" rx="1.8" fill="${color}" />
      <path d="M14.1 10.2l3.2-1.8v7.2l-3.2-1.8z" fill="${color}" />
    `,
    'fa-location-dot': `
      <path d="M12 4.5a4.2 4.2 0 0 0-4.2 4.2c0 2.9 2.5 5.7 4.2 7.9 1.7-2.2 4.2-5 4.2-7.9A4.2 4.2 0 0 0 12 4.5Z" fill="${color}" />
      <circle cx="12" cy="8.8" r="1.8" fill="rgba(10,22,38,0.92)" />
    `,
    'fa-helicopter': `
      <rect x="8.2" y="10.6" width="7.6" height="3.3" rx="1.4" fill="${color}" />
      <rect x="6.4" y="8.5" width="11.2" height="1.6" rx="0.8" fill="${color}" />
      <rect x="10.9" y="6.4" width="2.2" height="1.8" rx="0.6" fill="${color}" />
      <rect x="7.5" y="14.6" width="9" height="1.4" rx="0.7" fill="${color}" />
    `,
    'fa-ship': `
      <path d="M8.1 14.2h7.8l-1.2 2.6H9.3z" fill="${color}" />
      <path d="M9.4 10.1h5.2v4.1H9.4z" fill="${color}" />
      <rect x="10.5" y="8.3" width="3" height="1.8" rx="0.5" fill="${color}" />
    `,
  }

  return glyphs[iconName] || `<circle cx="12" cy="12" r="3.8" fill="${color}" />`
}

function buildMarkerShell({ size, color, glyph }) {
  const viewBox = 24
  const outerRadius = 11
  const innerRadius = 10.2

  return svgToDataUri(`
    <svg xmlns="${SVG_NS}" width="${size}" height="${size}" viewBox="0 0 ${viewBox} ${viewBox}">
      <defs>
        <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.2" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <circle cx="12" cy="12" r="${outerRadius}" fill="rgba(10,22,38,0.92)" stroke="${color}" stroke-width="1.2" filter="url(#glow)"/>
      <circle cx="12" cy="12" r="${innerRadius}" fill="rgba(10,22,38,0.92)" />
      <g filter="url(#glow)">
        ${glyph}
      </g>
    </svg>
  `)
}

export function createDeviceIcon({ iconName, color, size = 14 }) {
  const textureSize = size * DEVICE_TEXTURE_SCALE
  return buildMarkerShell({
    size: textureSize,
    color,
    glyph: getDeviceGlyph(iconName, color),
  })
}

export function createVesselIcon({ color, size = 8 }) {
  const textureSize = size * VESSEL_TEXTURE_SCALE
  return svgToDataUri(`
    <svg xmlns="${SVG_NS}" width="${textureSize}" height="${textureSize}" viewBox="0 0 16 16">
      <path d="M8 2.2 13.2 8H10v4.5H6V8H2.8L8 2.2Z" fill="${color}" />
      <path d="M3.8 12.8c1.4.8 2.8.8 4.2 0 1.4.8 2.8.8 4.2 0" stroke="${color}" stroke-width="1.6" fill="none" stroke-linecap="round" />
    </svg>
  `)
}

export function createTyphoonIcon({ size = 60 }) {
  const textureSize = size * TYPHOON_MARKER_TEXTURE_SCALE
  return svgToDataUri(`
    <svg xmlns="${SVG_NS}" viewBox="0 0 1024 1024" width="${textureSize}" height="${textureSize}">
      <path d="M512 512m-320 0a320 320 0 1 0 640 0 320 320 0 1 0-640 0Z" fill="#d81e06"/>
      <path d="M512 512m-128 0a128 128 0 1 0 256 0 128 128 0 1 0-256 0Z" fill="#e6e6e6"/>
      <path d="M688 112c-145.6 96.992-286.816 244.352-304 304-16.512 57.312-58.432 111.136-118 108-22.016-1.152-63.216-52.256-42-108A497.6 497.6 0 0 1 688 112z" fill="#d81e06"/>
      <path d="M330.496 924c145.6-96.992 286.816-244.352 304-304 16.512-57.312 58.432-111.136 118-108 22.016 1.152 63.216 52.256 42 108a497.6 497.6 0 0 1-464 304z" fill="#d81e06"/>
    </svg>
  `)
}

export function createTyphoonPointIcon({ color, size = 12 }) {
  const textureSize = size * TYPHOON_POINT_TEXTURE_SCALE
  return svgToDataUri(`
    <svg xmlns="${SVG_NS}" width="${textureSize}" height="${textureSize}" viewBox="0 0 12 12">
      <circle cx="6" cy="6" r="4" fill="#ffffff" stroke="${color}" stroke-width="2" />
    </svg>
  `)
}

export function decodeSvgDataUri(uri) {
  return decodeURIComponent(String(uri || '').replace('data:image/svg+xml;utf8,', ''))
}

export function buildDeviceIconUri(options = {}) {
  return createDeviceIcon({
    iconName: options.iconName || options.iconGlyph,
    color: options.color,
    size: options.size,
  })
}

export function buildVesselIconUri(options = {}) {
  const color = options.color || (options.status === 'warning' ? '#d9973a' : '#53b07e')
  return createVesselIcon({
    color,
    size: options.size,
  })
}

export function buildTyphoonIconUri(options = {}) {
  return createTyphoonIcon({ size: options.size || 60 })
}
