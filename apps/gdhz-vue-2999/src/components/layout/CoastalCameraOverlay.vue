<template>
  <div v-if="visible" class="camera-overlay">
    <div
      v-for="item in positionedStations"
      :key="item.id"
      class="camera-card"
      :class="{ offline: item.status === 'offline' }"
      :style="{ left: `${item.x}px`, top: `${item.y}px` }"
      @click="$emit('station-click', item)"
    >
      <div class="video-frame">
        <div
          class="snapshot-image"
          :style="{ backgroundImage: `url(${item.snapshotUrl || `/images/coastal/${item.id}.png`})` }"
        ></div>
        <div class="frame-station-overlay">
          <div class="frame-top-row">
            <span class="frame-station-name">{{ item.stationName }}</span>
          </div>
          <div class="frame-bottom-row">
            <span class="station-status-dot" :class="item.status"></span>
            <span class="frame-update-time">{{ formatRelativeTime(item.lastUpdate) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import { formatRelativeTime } from '../../utils/relativeTime'

const props = defineProps({
  visible: { type: Boolean, default: false },
  stations: { type: Array, default: () => [] },
  mapRef: { type: Object, default: null },
})

defineEmits(['station-click'])

const screenPositions = ref({})
let trackingRaf = null
let moveHandler = null

const positionedStations = computed(() =>
  props.stations
    .map((station) => {
      const pos = screenPositions.value[station.id]
      if (!pos) return null
      return { ...station, x: pos.x, y: pos.y }
    })
    .filter(Boolean)
)

function updatePositions() {
  if (!props.mapRef || !props.visible) return
  const newPositions = {}
  props.stations.forEach((station) => {
    const pt = props.mapRef.latLngToScreenPoint(station.lat, station.lng)
    if (pt) {
      newPositions[station.id] = { x: pt.x, y: pt.y }
    }
  })
  screenPositions.value = newPositions
}

function startTracking() {
  stopTracking()

  const tick = () => {
    updatePositions()
    trackingRaf = requestAnimationFrame(tick)
  }

  trackingRaf = requestAnimationFrame(tick)

  if (props.mapRef?.onMapMove) {
    moveHandler = () => updatePositions()
    props.mapRef.onMapMove(moveHandler)
  }
}

function stopTracking() {
  if (trackingRaf) {
    cancelAnimationFrame(trackingRaf)
    trackingRaf = null
  }
  if (moveHandler && props.mapRef?.offMapMove) {
    props.mapRef.offMapMove(moveHandler)
    moveHandler = null
  }
}

watch(() => props.visible, (visibleNow) => {
  if (visibleNow) startTracking()
  else stopTracking()
})

watch(() => props.mapRef, () => {
  if (props.visible) startTracking()
})

onMounted(() => {
  if (props.visible && props.mapRef) startTracking()
})

onBeforeUnmount(() => {
  stopTracking()
})
</script>

<style scoped>
.camera-overlay {
  position: fixed;
  inset: 0;
  z-index: 840;
  pointer-events: none;
  overflow: hidden;
}

.camera-card {
  position: absolute;
  transform: translate(-50%, -100%);
  pointer-events: auto;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  will-change: left, top;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.35));
}

.camera-card:hover {
  transform: translate(-50%, -100%) scale(1.12);
  filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.45));
  z-index: 10;
}

.video-frame {
  width: 140px;
  height: 82px;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  border: 1.5px solid rgba(255, 255, 255, 0.32);
}

.snapshot-image {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-color: #0f172a;
}

.camera-card.offline .snapshot-image {
  filter: grayscale(0.8) brightness(0.5);
}

.frame-station-overlay {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  padding: 8px;
  background: linear-gradient(180deg, rgba(10, 20, 35, 0.78), rgba(10, 20, 35, 0.14), rgba(10, 20, 35, 0.62));
}

.frame-top-row,
.frame-bottom-row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
}

.station-status-dot {
  width: 7px;
  height: 7px;
  flex: 0 0 7px;
  border-radius: 50%;
}

.station-status-dot.online {
  background: #22c55e;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.72);
}

.station-status-dot.offline {
  background: #94a3b8;
}

.frame-station-name {
  font-size: 11px;
  font-weight: 600;
  color: #e2e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.frame-update-time {
  font-size: 10px;
  font-weight: 600;
  color: #dbeafe;
  white-space: nowrap;
}

</style>
