<template>
  <div ref="glassEl" class="map-search-glass" role="search" aria-label="地图搜索">
    <span class="search-icon" aria-hidden="true">
      <i class="fa-solid fa-magnifying-glass"></i>
    </span>
    <input
      class="search-field"
      type="search"
      :placeholder="placeholder"
      aria-label="搜索监测点、站点或海域"
    />
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { attachLiquidGlass } from '../../utils/liquidGlass'

const props = defineProps({
  placeholder: {
    type: String,
    default: '搜索监测点、站点或海域',
  },
})

const glassEl = ref(null)

let shaderInstance = null
let resizeObserver = null
let syncRaf = null

function syncShader() {
  if (!glassEl.value) return
  if (shaderInstance) {
    shaderInstance.destroy()
    shaderInstance = null
  }
  shaderInstance = attachLiquidGlass(glassEl.value, { idPrefix: 'map-search-glass' })
}

function scheduleShaderSync() {
  if (syncRaf) cancelAnimationFrame(syncRaf)
  syncRaf = requestAnimationFrame(() => {
    syncRaf = null
    syncShader()
  })
}

onMounted(async () => {
  await nextTick()
  scheduleShaderSync()

  resizeObserver = new ResizeObserver(() => {
    scheduleShaderSync()
  })

  if (glassEl.value) {
    resizeObserver.observe(glassEl.value)
  }
})

onBeforeUnmount(() => {
  if (syncRaf) {
    cancelAnimationFrame(syncRaf)
    syncRaf = null
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (shaderInstance) {
    shaderInstance.destroy()
    shaderInstance = null
  }
})
</script>

<style scoped>
.map-search-glass {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  max-width: min(640px, calc(100vw - 220px));
  min-height: 66px;
  padding: 0 24px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.15),
    0 -10px 25px inset rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(0.25px) contrast(1.02) brightness(1.01) saturate(1.02);
  -webkit-backdrop-filter: blur(0.25px) contrast(1.02) brightness(1.01) saturate(1.02);
  overflow: hidden;
}

.search-icon {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #f8fafc;
  flex: 0 0 auto;
  text-shadow:
    0 1px 10px rgba(15, 23, 42, 0.82),
    0 0 18px rgba(15, 23, 42, 0.36);
}

.search-icon i {
  font-size: 18px;
}

.search-field {
  position: relative;
  z-index: 1;
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: #ffffff;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0.01em;
  text-shadow:
    0 1px 10px rgba(15, 23, 42, 0.82),
    0 0 18px rgba(15, 23, 42, 0.36);
}

.search-field::placeholder {
  color: #fef3c7;
  text-shadow:
    0 1px 10px rgba(15, 23, 42, 0.88),
    0 0 18px rgba(15, 23, 42, 0.3);
}

.search-field::-webkit-search-cancel-button {
  display: none;
}

.map-search-glass:focus-within {
  outline: 1px solid rgba(125, 211, 252, 0.34);
  outline-offset: -1px;
}

@media (max-width: 960px) {
  .map-search-glass {
    min-height: 60px;
    gap: 12px;
    padding: 0 18px;
  }

  .search-icon i {
    font-size: 16px;
  }

  .search-field {
    font-size: 15px;
  }
}
</style>
