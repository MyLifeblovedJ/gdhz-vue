<template>
  <div class="monitor-panel">
    <div class="panel-header">
      <i class="fa-solid fa-water header-icon"></i>
      <span class="header-title">风浪潮监测重点</span>
    </div>

    <!-- 1. Key Indicators (Grid Layout) -->
    <div class="metrics-row">
      <!-- Astronomical Tide -->
      <div class="metric-card astro">
        <div class="card-title">
          <i class="fa-solid fa-moon"></i> 天文潮
        </div>
        <div class="card-content">
          <div class="main-val">{{ astroTide?.nextHighTide?.level }}<small>m</small></div>
          <div class="sub-text">
            <span>{{ astroTide?.nextHighTide?.label }}</span>
            <span class="time">{{ astroTide?.nextHighTide?.time }}</span>
          </div>
          <div class="tag-status">{{ astroTide?.currentType }}</div>
        </div>
      </div>

      <!-- Nearshore Wave -->
      <div class="metric-card wave">
        <div class="card-title">
          <i class="fa-solid fa-ship"></i> 近岸浪
        </div>
        <div class="card-content">
          <div class="main-val wave-val">{{ waveData?.height }}<small>m</small></div>
          <div class="sub-text">
            <span>出现时间</span>
            <span class="time">{{ waveData?.appearTime }}</span>
          </div>
          <div class="tag-status wave-tag">{{ waveData?.station }}</div>
        </div>
      </div>
    </div>

    <!-- 2. Station Forecast List -->
    <div class="station-section">
      <div class="section-title">
        <span>重点潮位站预报</span>
        <small>(预计最高潮位)</small>
      </div>
      
      <div class="station-list custom-scroll">
        <div v-for="(station, index) in tideStations" :key="index" class="station-row">
          <div class="station-info">
            <span class="name">{{ station.name }}</span>
            <span class="time-badge">{{ station.time }}</span>
          </div>
          <div class="station-val">
            <span class="val" :class="getLevelClass(station.state)">{{ station.maxLevel }}m</span>
            <span class="state-dot" :class="getStateDotClass(station.state)"></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { 
  mockAstronomicalTide, 
  mockNearshoreWave, 
  mockTideForecastStations 
} from '../../data/seaConditionData'

const astroTide = computed(() => mockAstronomicalTide)
const waveData = computed(() => mockNearshoreWave)
const tideStations = computed(() => mockTideForecastStations)

function getLevelClass(state) {
  if (state === '超警') return 'text-red'
  if (state === '需关注') return 'text-orange'
  return 'text-normal'
}

function getStateDotClass(state) {
  if (state === '超警') return 'bg-red'
  if (state === '需关注') return 'bg-orange'
  return 'bg-green'
}
</script>

<style scoped>
.monitor-panel {
  position: absolute;
  top: 10px;
  left: 90px;
  width: 280px;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  z-index: 900;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  color: #fff;
  animation: slideIn 0.4s ease-out;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

/* Header */
.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.header-icon { color: #22d3ee; }
.header-title { font-weight: 600; font-size: 14px; letter-spacing: 0.5px; }

/* Metrics Row */
.metrics-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 16px;
}

.metric-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  padding: 8px;
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: 11px;
  color: #94a3b8;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.main-val {
  font-size: 20px;
  font-weight: 700;
  font-family: 'DIN Alternate', sans-serif;
  color: #fbbf24; /* Amber for tide */
}
.wave-val { color: #22d3ee; /* Cyan for wave */ }

.main-val small { font-size: 11px; margin-left: 2px; font-weight: 400; color: #cbd5e1; }

.sub-text {
  font-size: 10px;
  color: #cbd5e1;
  display: flex;
  justify-content: space-between;
}
.time { color: #fff; font-weight: 500; }

.tag-status {
  margin-top: 4px;
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 2px;
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
  align-self: flex-start;
}
.wave-tag {
  background: rgba(34, 211, 238, 0.15);
  color: #22d3ee;
}

/* Station List */
.station-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #e2e8f0;
}
.section-title small { font-size: 10px; color: #64748b; font-weight: 400; }

.station-list {
  max-height: 105px; /* Show approx 3 items (35px each) */
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-right: 4px; /* Space for scrollbar */
}

.station-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.03);
  padding: 6px 8px;
  border-radius: 4px;
  border-left: 2px solid transparent;
  transition: all 0.2s;
}
.station-row:hover { background: rgba(255, 255, 255, 0.08); }

.station-info {
  display: flex;
  align-items: center;
  gap: 8px;
}
.name { font-size: 12px; font-weight: 500; color: #f1f5f9; }
.time-badge { 
  font-size: 10px; 
  background: rgba(255, 255, 255, 0.1); 
  padding: 1px 4px; 
  border-radius: 3px; 
  color: #94a3b8;
}

.station-val {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  font-family: 'DIN Alternate', sans-serif;
}

.state-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.text-red { color: #f87171; }
.text-orange { color: #fbbf24; }
.text-normal { color: #22d3ee; }

.bg-red { background-color: #f87171; box-shadow: 0 0 5px rgba(248, 113, 113, 0.5); }
.bg-orange { background-color: #fbbf24; }
.bg-green { background-color: #22d3ee; }

/* Custom Scrollbar */
.custom-scroll::-webkit-scrollbar { width: 3px; }
.custom-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 2px; }
.custom-scroll::-webkit-scrollbar-track { background: transparent; }
</style>
