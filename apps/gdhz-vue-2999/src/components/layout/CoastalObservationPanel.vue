<template>
  <div class="coastal-panel" :style="panelStyle">
    <div class="station-grid">
      <div
        v-for="item in stations"
        :key="item.id"
        class="station-card"
        :class="item.status"
      >
        <div
          class="mini-video"
          :style="{ backgroundImage: `url(/images/coastal/${item.id}.png)` }"
        >
          <div class="status-tag" :class="item.status">
            <span class="state-dot" :class="item.status"></span>
            <span>{{ item.status === 'online' ? '在线' : '离线' }}</span>
          </div>
          <div class="name-overlay">{{ item.stationName }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  stations: {
    type: Array,
    default: () => [],
  },
  visibleRows: {
    type: Number,
    default: 4,
  },
  cardHeight: {
    type: Number,
    default: 96,
  },
  gridGap: {
    type: Number,
    default: 8,
  },
})

const panelStyle = computed(() => ({
  '--coastal-visible-rows': String(Math.max(2, props.visibleRows)),
  '--coastal-card-height': `${Math.max(84, props.cardHeight)}px`,
  '--coastal-grid-gap': `${Math.max(4, props.gridGap)}px`,
}))
</script>

<style scoped>
.coastal-panel {
  height: 100%;
  min-height: 0;
}

.station-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-auto-rows: minmax(var(--coastal-card-height), 1fr);
  gap: var(--coastal-grid-gap);
  min-height: calc(
    var(--coastal-visible-rows) * var(--coastal-card-height) +
    (var(--coastal-visible-rows) - 1) * var(--coastal-grid-gap)
  );
  height: 100%;
  overflow-y: auto;
  padding-right: 2px;
}

.station-card {
  border: none;
  background: transparent;
  min-height: var(--coastal-card-height);
}

.station-card.offline {
  opacity: 0.62;
}

.mini-video {
  height: 100%;
  min-height: var(--coastal-card-height);
  border-radius: 6px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(202, 233, 255, 0.86);
  font-size: 14px;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  background-color: rgba(5, 15, 31, 0.92);
}

.status-tag {
  position: absolute;
  top: 6px;
  right: 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 700;
  color: #d7f3e2;
  background: rgba(1, 20, 11, 0.66);
}

.status-tag.offline {
  color: #d7dce7;
  background: rgba(16, 20, 30, 0.66);
}

.state-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.state-dot.online {
  background: #22c55e;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.8);
}

.state-dot.offline {
  background: #94a3b8;
}

.name-overlay {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 14px 7px 4px;
  font-size: 12px;
  font-weight: 700;
  color: #e8f4ff;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.75));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}
</style>
