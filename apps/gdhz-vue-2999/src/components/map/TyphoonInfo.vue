<template>
  <Transition name="slide-fade">
    <div v-if="typhoon" class="typhoon-info-panel" :class="{ embedded }">
      <div class="panel-header">
        <div class="typhoon-icon">
          <i class="fa-solid fa-hurricane fa-spin-slow"></i>
        </div>
        <div class="header-info">
          <div class="typhoon-id">{{ typhoon.id }}</div>
          <div class="typhoon-name-row">
            <span class="typhoon-name">{{ typhoon.name }} ({{ typhoon.enName }})</span>
            <span class="typhoon-category tag-red">{{ typhoon.category }}</span>
          </div>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <div class="label">中心位置</div>
          <div class="value number-font">{{ formatCoord(currentPoint?.lng) }}°E / {{ formatCoord(currentPoint?.lat) }}°N</div>
        </div>
        <div class="info-item">
          <div class="label">更新时间</div>
          <div class="value number-font">{{ formatTime(currentPoint?.time) }}</div>
        </div>
        <div class="info-item">
          <div class="label">中心气压</div>
          <div class="value"><span class="number-font big">{{ currentPoint?.pressure ?? '--' }}</span><span class="unit">hPa</span></div>
        </div>
        <div class="info-item">
          <div class="label">风速风力</div>
          <div class="value"><span class="number-font big">{{ currentPoint?.windSpeed ?? '--' }}</span><span class="unit">m/s</span></div>
        </div>
      </div>

      <div class="wind-radius">
        <div class="radius-item">七级半径：<span class="number-font">{{ radius7Text }}</span> 公里</div>
        <div class="radius-item">十级半径：<span class="number-font">{{ radius10Text }}</span> 公里</div>
        <div class="radius-item">十二级半径：<span class="number-font">{{ radius12Text }}</span> 公里</div>
      </div>

      <div class="divider"></div>

      <div class="moving-info">
        <div class="label">移速移向</div>
        <div class="value">
          <i class="fa-solid fa-arrow-up-long" :style="{ transform: 'rotate(-67deg)' }"></i>
          <span>{{ movementDirection }}</span>
          <span class="speed number-font">{{ movementSpeedText }}</span>
        </div>
      </div>

      <div class="landing-forecast">
        <div class="forecast-header"><i class="fa-solid fa-stopwatch"></i> 预计登陆</div>
        <div v-if="landfallPrediction" class="landing-details">
          <div class="landing-loc">{{ landfallPrediction.location || '--' }}</div>
          <div class="landing-timer">预计时间：<span class="highlight number-font">{{ formatTime(landfallPrediction.time) }}</span></div>
        </div>
        <div v-else class="landing-empty">暂无预计登陆点信息</div>
      </div>

      <div class="similar-history">
        <div class="similar-history-title">
          <i class="fa-solid fa-clock-rotate-left"></i>
          历史相似台风
        </div>
        <div class="similar-list">
          <div v-if="topMatch" class="similar-row top">
            <span class="rank">TOP1</span>
            <span class="name">{{ topMatch.year }} · {{ topMatch.name }}</span>
            <span class="score">相似度 {{ Math.round(topMatch.similarity * 100) }}%</span>
          </div>
          <Transition name="slide-fade">
            <div v-if="showMoreSimilar" class="similar-more">
              <div
                v-for="(item, index) in restMatches"
                :key="item.id"
                class="similar-row"
              >
                <span class="rank">TOP{{ index + 2 }}</span>
                <span class="name">{{ item.year }} · {{ item.name }}</span>
                <span class="score">{{ Math.round(item.similarity * 100) }}%</span>
              </div>
            </div>
          </Transition>
          <button
            v-if="restMatches.length"
            class="more-btn"
            type="button"
            @click="showMoreSimilar = !showMoreSimilar"
          >
            <i class="fa-solid" :class="showMoreSimilar ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
            {{ showMoreSimilar ? '收起其他相似台风' : `展开其余 ${restMatches.length} 条相似台风` }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useAppStore } from '../../stores/app'
import { mockHistoricalMatches } from '../../data/mockData'

const props = defineProps({
  embedded: {
    type: Boolean,
    default: false
  }
})

const store = useAppStore()
const typhoon = computed(() => store.typhoonData)
const showMoreSimilar = ref(false)
const sortedMatches = computed(() => {
  return [...(mockHistoricalMatches.matches || [])].sort((a, b) => b.similarity - a.similarity)
})
const topMatch = computed(() => sortedMatches.value[0] || null)
const restMatches = computed(() => sortedMatches.value.slice(1))

const currentPoint = computed(() => {
  if (!typhoon.value?.track?.length) return null
  return typhoon.value.track[typhoon.value.track.length - 1]
})

const movementDirection = computed(() => typhoon.value?.movement?.direction || '--')
const movementSpeedText = computed(() => {
  const speed = typhoon.value?.movement?.speedKmh
  return Number.isFinite(speed) ? `${speed} km/h` : '--'
})

const landfallPrediction = computed(() => typhoon.value?.landfallPrediction || null)

const radius7Text = computed(() => {
  const rangeText = typhoon.value?.windCircle?.radius7Range
  if (rangeText) return rangeText
  const v = typhoon.value?.windCircle?.radius7
  return Number.isFinite(v) ? String(v) : '--'
})

const radius10Text = computed(() => {
  const v = typhoon.value?.windCircle?.radius10
  return Number.isFinite(v) ? String(v) : '--'
})

const radius12Text = computed(() => {
  const v = typhoon.value?.windCircle?.radius12
  return Number.isFinite(v) ? String(v) : '--'
})

function formatTime(timeStr) {
  if (!timeStr) return '--:--'
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatCoord(value) {
  if (!Number.isFinite(value)) return '--'
  return Number(value).toFixed(2)
}
</script>

<style scoped>
.typhoon-info-panel {
  position: absolute;
  top: 82px;
  right: 388px;
  width: 320px;
  background: rgba(16, 23, 42, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-left: 4px solid #ef4444;
  border-radius: 4px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  color: #fff;
  padding: 16px;
  font-size: 13px;
  overflow: hidden;
  transition: all 0.3s;
}

.typhoon-info-panel.embedded {
  position: relative;
  top: auto;
  right: auto;
  width: 100%;
  border-radius: 8px;
  margin-bottom: 0;
  box-shadow: none;
  background: rgba(255, 255, 255, 0.05);
}

.panel-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.typhoon-icon {
  width: 48px; height: 48px;
  background: radial-gradient(circle at center, rgba(239, 68, 68, 0.2), transparent 70%);
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 50%;
}
.fa-spin-slow { animation: fa-spin 4s infinite linear; }
@keyframes fa-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.header-info { flex: 1; }
.typhoon-id { font-size: 12px; color: rgba(255, 255, 255, 0.6); }
.typhoon-name-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.typhoon-name { font-size: 16px; font-weight: 700; }
.tag-red { background: #dc2626; padding: 2px 6px; border-radius: 2px; font-size: 10px; font-weight: 600; }

.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 10px; }
.info-item { display: flex; flex-direction: column; gap: 2px; }
.info-item .label { font-size: 11px; color: rgba(255, 255, 255, 0.58); }
.info-item .value { font-weight: 500; color: #e2e8f0; }
.number-font { font-family: var(--font-display, 'DIN Alternate', sans-serif); }
.big { font-size: 18px; font-weight: 700; color: #fff; }
.unit { font-size: 11px; margin-left: 2px; color: rgba(255, 255, 255, 0.55); }

.wind-radius { display: grid; grid-template-columns: 1fr; gap: 4px; margin-bottom: 10px; }
.radius-item { font-size: 12px; color: rgba(226, 232, 240, 0.95); }

.divider { height: 1px; background: rgba(255, 255, 255, 0.1); margin: 12px 0; }

.moving-info {
  display: flex; justify-content: space-between; align-items: center;
  background: rgba(255, 255, 255, 0.05);
  padding: 8px 10px; border-radius: 4px; margin-bottom: 12px;
}
.moving-info .value { display: flex; align-items: center; gap: 6px; font-weight: 600; }
.speed { color: #fcd34d; }

.landing-forecast {
  background: linear-gradient(to right, rgba(220, 38, 38, 0.2), rgba(220, 38, 38, 0.05));
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: 4px;
  padding: 10px;
}
.forecast-header { font-size: 11px; color: #ef4444; font-weight: 600; margin-bottom: 6px; display: flex; align-items: center; gap: 4px; }
.landing-details { display: flex; justify-content: space-between; align-items: flex-end; }
.landing-loc { font-size: 14px; font-weight: 700; color: #fff; }
.landing-timer { font-size: 11px; color: rgba(255, 255, 255, 0.75); }
.landing-timer .highlight { color: #ef4444; font-size: 13px; font-weight: 700; margin: 0 1px; }
.landing-empty { font-size: 12px; color: rgba(226, 232, 240, 0.82); }

.similar-history {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
}

.similar-history-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(245, 158, 11, 0.92);
  margin-bottom: 8px;
}

.similar-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.similar-row {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid rgba(114, 156, 192, 0.26);
  background: rgba(255, 255, 255, 0.03);
}

.similar-row.top {
  border-color: rgba(245, 158, 11, 0.38);
  background: rgba(245, 158, 11, 0.1);
}

.similar-row .rank {
  color: rgba(245, 158, 11, 0.95);
  font-weight: 700;
}

.similar-row .name {
  color: rgba(233, 243, 255, 0.94);
}

.similar-row .score {
  color: rgba(188, 214, 236, 0.88);
}

.more-btn {
  border: 1px dashed rgba(114, 156, 192, 0.34);
  border-radius: 8px;
  height: 30px;
  background: rgba(255, 255, 255, 0.02);
  color: rgba(190, 212, 233, 0.88);
  font-size: 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
</style>
