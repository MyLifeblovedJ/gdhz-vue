<template>
  <Teleport to="body">
    <!-- Glass with text directly on it -->
    <Transition name="glass-fade">
      <div v-if="visible" class="station-glass-wrap" :class="{ 'is-alarm': isAlarm }" :style="wrapStyle">
        <div ref="glassEl" class="station-glass">
          <button class="glass-close" @click="emit('close')">×</button>
          <div class="glass-text">
            <div class="glass-name">{{ device?.name || '--' }}</div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, onBeforeUnmount, nextTick, computed } from 'vue'

const props = defineProps({
  device: { type: Object, default: null },
  screenX: { type: Number, default: 0 },
  screenY: { type: Number, default: 0 },
  visible: { type: Boolean, default: false },
})

const emit = defineEmits(['glass-show', 'glass-hide', 'close'])

const glassEl = ref(null)
let shaderInstance = null
let glassTimer = null

const GLASS_W = 180
const GLASS_H = 110

const isAlarm = computed(() => props.device?.status === 'alarm' || props.device?.status === 'warn')

const wrapStyle = ref({})

watch(
  () => [props.screenX, props.screenY, props.visible],
  () => {
    if (!props.visible) return
    wrapStyle.value = {
      left: `${props.screenX}px`,
      top: `${props.screenY}px`,
    }
  },
  { immediate: true }
)

// Shader utilities (duplicated inline from liquid-glass.js to avoid polluting global)
function smoothStep(a, b, t) {
  t = Math.max(0, Math.min(1, (t - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
function len(x, y) { return Math.sqrt(x * x + y * y) }
function roundedRectSDF(x, y, w, h, r) {
  const qx = Math.abs(x) - w + r
  const qy = Math.abs(y) - h + r
  return Math.min(Math.max(qx, qy), 0) + len(Math.max(qx, 0), Math.max(qy, 0)) - r
}
function texture(x, y) { return { type: 't', x, y } }

function createMiniShader(el) {
  const id = 'station-glass-' + Math.random().toString(36).substr(2, 6)
  const w = GLASS_W, h = GLASS_H, dpi = 1

  // SVG filter
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
  filter.setAttribute('width', String(w))
  filter.setAttribute('height', String(h))

  const feImage = document.createElementNS('http://www.w3.org/2000/svg', 'feImage')
  feImage.setAttribute('id', `${id}_map`)
  feImage.setAttribute('width', String(w))
  feImage.setAttribute('height', String(h))

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

  // Canvas for displacement
  const canvas = document.createElement('canvas')
  canvas.width = w * dpi
  canvas.height = h * dpi
  canvas.style.display = 'none'
  const ctx = canvas.getContext('2d')

  // Fragment shader
  function fragment(uv) {
    const ix = uv.x - 0.5
    const iy = uv.y - 0.5
    const d = roundedRectSDF(ix, iy, 0.3, 0.2, 0.6)
    const displacement = smoothStep(0.8, 0, d - 0.15)
    const scaled = smoothStep(0, 1, displacement)
    return texture(ix * scaled + 0.5, iy * scaled + 0.5)
  }

  // Render shader
  const cw = w * dpi, ch = h * dpi
  const data = new Uint8ClampedArray(cw * ch * 4)
  let maxScale = 0
  const rawValues = []
  for (let i = 0; i < data.length; i += 4) {
    const x = (i / 4) % cw
    const y = Math.floor(i / 4 / cw)
    const pos = fragment({ x: x / cw, y: y / ch })
    const dx = pos.x * cw - x
    const dy = pos.y * ch - y
    maxScale = Math.max(maxScale, Math.abs(dx), Math.abs(dy))
    rawValues.push(dx, dy)
  }
  maxScale *= 0.5
  let idx = 0
  for (let i = 0; i < data.length; i += 4) {
    const r = rawValues[idx++] / maxScale + 0.5
    const g = rawValues[idx++] / maxScale + 0.5
    data[i] = r * 255
    data[i + 1] = g * 255
    data[i + 2] = 0
    data[i + 3] = 255
  }
  ctx.putImageData(new ImageData(data, cw, ch), 0, 0)
  feImage.setAttributeNS('http://www.w3.org/1999/xlink', 'href', canvas.toDataURL())
  feDisplacementMap.setAttribute('scale', String(maxScale / dpi))

  // Apply style to element
  el.style.cssText = `
    width: ${w}px;
    height: ${h}px;
    overflow: hidden;
    border-radius: ${Math.floor(h / 2)}px;
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15), 0 -10px 25px inset rgba(0,0,0,0.05);
    backdrop-filter: url(#${id}_filter) blur(0.25px) contrast(1.02) brightness(1.01) saturate(1.02);
    -webkit-backdrop-filter: url(#${id}_filter) blur(0.25px) contrast(1.02) brightness(1.01) saturate(1.02);
    pointer-events: none;
  `

  return {
    destroy() {
      svg.remove()
      canvas.remove()
    }
  }
}

watch(
  () => props.visible,
  async (v) => {
    if (v) {
      await nextTick()
      if (glassEl.value) {
        if (shaderInstance) shaderInstance.destroy()
        shaderInstance = createMiniShader(glassEl.value)
      }
      emit('glass-show', props.device?.id)
    } else {
      emit('glass-hide', props.device?.id)
      if (shaderInstance) {
        shaderInstance.destroy()
        shaderInstance = null
      }
    }
  }
)

onBeforeUnmount(() => {
  clearTimeout(glassTimer)
  if (shaderInstance) {
    shaderInstance.destroy()
    shaderInstance = null
  }
})
</script>

<style scoped>
.station-glass-wrap {
  position: fixed;
  z-index: 1600;
  transform: translate(-50%, calc(-50% - 20px));
  pointer-events: none;
}

.station-glass {
  position: relative;
  flex-shrink: 0;
}

.glass-text {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 20px 28px;
  z-index: 1;
  pointer-events: none;
}

.glass-close {
  position: absolute;
  top: 10px;
  right: 14px;
  z-index: 2;
  pointer-events: auto;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #334155;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  transition: all 0.2s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}

.glass-close:hover {
  background: rgba(239, 68, 68, 0.9);
  color: #fff;
  border-color: transparent;
}

.glass-name {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  text-shadow:
    0 0 10px rgba(255,255,255,1),
    0 0 4px rgba(255,255,255,0.9),
    0 1px 4px rgba(255,255,255,0.8);
  white-space: nowrap;
}

/* Alarm pulse on the glass border */
.is-alarm .station-glass {
  border-color: rgba(239, 68, 68, 0.5) !important;
  animation: glass-pulse-red 1.2s ease-out infinite;
}

@keyframes glass-pulse-red {
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7), 0 4px 8px rgba(0,0,0,0.15), 0 -10px 25px inset rgba(0,0,0,0.05); }
  70% { box-shadow: 0 0 0 16px rgba(239, 68, 68, 0), 0 4px 8px rgba(0,0,0,0.15), 0 -10px 25px inset rgba(0,0,0,0.05); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0), 0 4px 8px rgba(0,0,0,0.15), 0 -10px 25px inset rgba(0,0,0,0.05); }
}

/* Transition */
.glass-fade-enter-active,
.glass-fade-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}
.glass-fade-enter-from,
.glass-fade-leave-to {
  opacity: 0;
}
</style>
