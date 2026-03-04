<template>
  <div v-if="visible" class="camera-overlay">
    <div
      v-for="item in stations"
      :key="item.id"
      class="camera-point"
      :style="{ left: `${item.mapX}%`, top: `${item.mapY}%` }"
    >
      <div class="mini-video">
        <i class="fa-solid fa-video"></i>
      </div>
      <div class="point-label">{{ item.stationName }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  stations: {
    type: Array,
    default: () => [],
  },
})
</script>

<style scoped>
.camera-overlay {
  position: absolute;
  inset: 0;
  z-index: 840;
  pointer-events: none;
}

.camera-point {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.mini-video {
  width: 72px;
  height: 42px;
  border-radius: 6px;
  border: 1px solid rgba(91, 188, 255, 0.72);
  background: linear-gradient(135deg, rgba(20, 58, 96, 0.82), rgba(3, 15, 30, 0.9));
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(168, 224, 255, 0.88);
  font-size: 13px;
}

.point-label {
  max-width: 92px;
  font-size: 10px;
  text-align: center;
  color: #d7eeff;
  background: rgba(1, 8, 18, 0.78);
  border: 1px solid rgba(94, 155, 196, 0.3);
  border-radius: 999px;
  padding: 2px 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
