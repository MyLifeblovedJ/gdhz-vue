<template>
  <div class="coastal-panel">
    <div class="station-grid">
      <div
        v-for="item in stations"
        :key="item.id"
        class="station-card"
        :class="item.status"
      >
        <div class="mini-video">
          <i class="fa-solid fa-video"></i>
          <span class="state-dot" :class="item.status"></span>
        </div>
        <div class="station-name-row">
          <span class="station-name">{{ item.stationName }}</span>
          <span class="status-text" :class="item.status">{{ item.status === 'online' ? '在线' : '离线' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  stations: {
    type: Array,
    default: () => [],
  },
})
</script>

<style scoped>
.coastal-panel {
  height: 100%;
}

.station-grid {
  height: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  overflow-y: auto;
  padding-right: 2px;
}

.station-card {
  border-radius: 8px;
  border: none;
  background: transparent;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 96px;
}

.station-card.offline {
  opacity: 0.6;
}

.mini-video {
  height: 74px;
  border-radius: 6px;
  border: none;
  background: linear-gradient(135deg, rgba(20, 61, 98, 0.72), rgba(5, 15, 31, 0.9));
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a8ddff;
  font-size: 14px;
}

.state-dot {
  position: absolute;
  right: 6px;
  top: 6px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.state-dot.online {
  background: #22c55e;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.8);
}

.state-dot.offline {
  background: #94a3b8;
}

.station-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
}

.station-name {
  font-size: 12px;
  font-weight: 700;
  color: #e2f2ff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-text {
  font-size: 11px;
  font-weight: 700;
}

.status-text.online {
  color: #22c55e;
}

.status-text.offline {
  color: #94a3b8;
}
</style>
