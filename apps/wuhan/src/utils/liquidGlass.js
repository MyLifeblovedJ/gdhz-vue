function smoothStep(a, b, t) {
  t = Math.max(0, Math.min(1, (t - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

function len(x, y) {
  return Math.sqrt(x * x + y * y)
}

function roundedRectSDF(x, y, w, h, r) {
  const qx = Math.abs(x) - w + r
  const qy = Math.abs(y) - h + r
  return Math.min(Math.max(qx, qy), 0) + len(Math.max(qx, 0), Math.max(qy, 0)) - r
}

function texture(x, y) {
  return { type: 't', x, y }
}

export function attachLiquidGlass(el, options = {}) {
  if (!el) {
    return { destroy() {} }
  }

  const rect = el.getBoundingClientRect()
  const width = Math.max(1, Math.round(rect.width))
  const height = Math.max(1, Math.round(rect.height))
  const dpi = 1
  const idPrefix = options.idPrefix || 'liquid-glass'
  const id = `${idPrefix}-` + Math.random().toString(36).slice(2, 8)
  const borderRadius = options.borderRadius ?? `${Math.floor(height / 2)}px`
  const border = options.border ?? '1px solid rgba(255, 255, 255, 0.5)'
  const boxShadow = options.boxShadow ?? '0 4px 8px rgba(0, 0, 0, 0.15), 0 -10px 25px inset rgba(0, 0, 0, 0.05)'

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', '0')
  svg.setAttribute('height', '0')
  svg.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:9998;'

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
  const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter')
  filter.setAttribute('id', `${id}_filter`)
  filter.setAttribute('filterUnits', 'userSpaceOnUse')
  filter.setAttribute('colorInterpolationFilters', 'sRGB')
  filter.setAttribute('x', '0')
  filter.setAttribute('y', '0')
  filter.setAttribute('width', String(width))
  filter.setAttribute('height', String(height))

  const feImage = document.createElementNS('http://www.w3.org/2000/svg', 'feImage')
  feImage.setAttribute('id', `${id}_map`)
  feImage.setAttribute('width', String(width))
  feImage.setAttribute('height', String(height))

  const feDisplacementMap = document.createElementNS('http://www.w3.org/2000/svg', 'feDisplacementMap')
  feDisplacementMap.setAttribute('in', 'SourceGraphic')
  feDisplacementMap.setAttribute('in2', `${id}_map`)
  feDisplacementMap.setAttribute('xChannelSelector', 'R')
  feDisplacementMap.setAttribute('yChannelSelector', 'G')

  filter.appendChild(feImage)
  filter.appendChild(feDisplacementMap)
  defs.appendChild(filter)
  svg.appendChild(defs)
  document.body.appendChild(svg)

  const canvas = document.createElement('canvas')
  canvas.width = width * dpi
  canvas.height = height * dpi
  canvas.style.display = 'none'
  const context = canvas.getContext('2d')

  function fragment(uv) {
    const ix = uv.x - 0.5
    const iy = uv.y - 0.5
    const aspect = width / height
    const scaledX = ix * aspect
    const distanceToEdge = roundedRectSDF(scaledX, iy, aspect * 0.48, 0.23, 0.6)
    const displacement = smoothStep(0.8, 0, distanceToEdge - 0.15)
    const scaled = smoothStep(0, 1, displacement)
    return texture((scaledX * scaled) / aspect + 0.5, iy * scaled + 0.5)
  }

  const pixelWidth = width * dpi
  const pixelHeight = height * dpi
  const data = new Uint8ClampedArray(pixelWidth * pixelHeight * 4)
  let maxScale = 0
  const rawValues = []

  for (let i = 0; i < data.length; i += 4) {
    const x = (i / 4) % pixelWidth
    const y = Math.floor(i / 4 / pixelWidth)
    const pos = fragment({ x: x / pixelWidth, y: y / pixelHeight })
    const dx = pos.x * pixelWidth - x
    const dy = pos.y * pixelHeight - y
    maxScale = Math.max(maxScale, Math.abs(dx), Math.abs(dy))
    rawValues.push(dx, dy)
  }

  maxScale *= 0.5
  let rawIndex = 0

  for (let i = 0; i < data.length; i += 4) {
    const r = rawValues[rawIndex++] / maxScale + 0.5
    const g = rawValues[rawIndex++] / maxScale + 0.5
    data[i] = r * 255
    data[i + 1] = g * 255
    data[i + 2] = 0
    data[i + 3] = 255
  }

  context.putImageData(new ImageData(data, pixelWidth, pixelHeight), 0, 0)
  feImage.setAttributeNS('http://www.w3.org/1999/xlink', 'href', canvas.toDataURL())
  feDisplacementMap.setAttribute('scale', String(maxScale / dpi))

  el.style.borderRadius = borderRadius
  el.style.border = border
  el.style.boxShadow = boxShadow
  el.style.backdropFilter = `url(#${id}_filter) blur(0.25px) contrast(1.02) brightness(1.01) saturate(1.02)`
  el.style.webkitBackdropFilter = `url(#${id}_filter) blur(0.25px) contrast(1.02) brightness(1.01) saturate(1.02)`

  return {
    destroy() {
      svg.remove()
      canvas.remove()
    },
  }
}
