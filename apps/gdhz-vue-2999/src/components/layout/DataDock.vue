<template>
  <div class="data-dock">
    <section class="dock-left">
      <div class="dock-title">站点列表（预警优先）</div>
      <div class="station-list">
        <button
          v-for="item in sortedStations"
          :key="item.name"
          class="station-item"
          :class="{ active: selected?.name === item.name }"
          @click="selected = item"
        >
          <span class="dot" :class="item.warningColor"></span>
          <span class="name">{{ item.name }}</span>
          <span class="value">{{ item.currentHeight.toFixed(1) }}m</span>
        </button>
      </div>
    </section>

    <section class="dock-center">
      <div class="dock-title">站点详细数据图表（横向）</div>
      <div class="detail-track">
        <DockWaveStationDetailCard
          v-for="item in sortedStations"
          :key="`detail-${item.name}`"
          :station="item"
        />
      </div>
    </section>

    <section class="dock-right">
      <div class="dock-title">设备与数据</div>
      <div class="summary-grid">
        <div class="summary-item">
          <span class="label">在线率</span>
          <span class="value online">{{ onlineRate }}%</span>
        </div>
        <div class="summary-item">
          <span class="label">站点总数</span>
          <span class="value">{{ store.devices.length }}</span>
        </div>
        <div class="summary-item">
          <span class="label">异常设备</span>
          <span class="value warn">{{ store.alertDevices.length }}</span>
        </div>
        <div class="summary-item">
          <span class="label">当前选中</span>
          <span class="value small">{{ selected?.name || '--' }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useAppStore } from '../../stores/app'
import { mockWaveForecastStations } from '../../data/seaConditionData'
import DockWaveStationDetailCard from './DockWaveStationDetailCard.vue'

const store = useAppStore()

const severityOrder = {
  red: 0,
  orange: 1,
  yellow: 2,
  blue: 3,
}

const sortedStations = computed(() => {
  return [...mockWaveForecastStations].sort((a, b) => {
    const levelDiff = (severityOrder[a.warningColor] ?? 99) - (severityOrder[b.warningColor] ?? 99)
    if (levelDiff !== 0) return levelDiff
    return (b.currentHeight || 0) - (a.currentHeight || 0)
  })
})

const selected = ref(sortedStations.value[0] || null)

const onlineRate = computed(() => {
  if (!store.devices.length) return 0
  return Math.round((store.onlineDevices.length / store.devices.length) * 100)
})
</script>

<style scoped>
.data-dock {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 10px;
  height: max(220px, 22vh);
  min-height: 200px;
  z-index: 100;
  border-radius: 14px;
  border: 1px solid rgba(109, 156, 193, 0.38);
  background: linear-gradient(180deg, rgba(1, 10, 23, 0.94), rgba(5, 18, 36, 0.91));
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.32);
  padding: 10px;
  display: grid;
  grid-template-columns: var(--home-column-width, 420px) 1fr var(--home-column-width, 420px);
  gap: 10px;
  pointer-events: auto;
}

.dock-left,
.dock-center,
.dock-right {
  border-radius: 10px;
  border: 1px solid rgba(112, 159, 195, 0.24);
  background: rgba(255, 255, 255, 0.03);
  padding: 8px;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.dock-title {
  font-size: 13px;
  font-weight: 700;
  color: #99d8ff;
}

.station-list {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
}

.station-item {
  height: 34px;
  border-radius: 8px;
  border: 1px solid rgba(111, 155, 191, 0.24);
  background: rgba(255, 255, 255, 0.03);
  color: #e7f2ff;
  display: grid;
  grid-template-columns: 14px 1fr auto;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  cursor: pointer;
  text-align: left;
}

.station-item.active {
  border-color: rgba(98, 198, 255, 0.75);
  background: rgba(98, 198, 255, 0.14);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.dot.red { background: #ef4444; }
.dot.orange { background: #f97316; }
.dot.yellow { background: #eab308; }
.dot.blue { background: #3b82f6; }

.station-item .name { font-size: 12px; font-weight: 600; }
.station-item .value { font-size: 12px; color: rgba(188, 213, 235, 0.86); }

.detail-track {
  margin-top: 8px;
  display: flex;
  gap: 10px;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 4px;
}

.summary-grid {
  margin-top: 8px;
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.summary-item {
  border-radius: 8px;
  border: 1px solid rgba(115, 158, 193, 0.22);
  background: rgba(255, 255, 255, 0.03);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.summary-item .label { font-size: 11px; color: rgba(182, 208, 229, 0.74); }
.summary-item .value { font-size: 20px; font-weight: 800; color: #e7f2ff; }
.summary-item .value.online { color: #22c55e; }
.summary-item .value.warn { color: #ef4444; }
.summary-item .value.small { font-size: 13px; line-height: 1.3; }

@media (max-width: 1700px) {
  .data-dock {
    grid-template-columns: 360px 1fr 360px;
  }
}
</style>
