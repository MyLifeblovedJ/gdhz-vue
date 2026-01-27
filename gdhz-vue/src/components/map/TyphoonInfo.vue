<template>
  <Transition name="slide-fade">
    <div v-if="typhoon" class="typhoon-info-panel" :class="{ embedded: embedded }">
      <!-- Header -->
      <div class="panel-header">
        <div class="typhoon-icon">
          <i class="fa-solid fa-hurricane fa-spin-slow"></i>
        </div>
        <div class="header-info">
          <div class="typhoon-id">{{ typhoon.id }}</div>
          <div class="typhoon-name-row">
            <span class="typhoon-name">{{ typhoon.name }}</span>
            <span class="typhoon-category tag-red">{{ typhoon.category }}</span>
          </div>
        </div>
      </div>

      <!-- Current Status Grid -->
      <div class="info-grid">
        <div class="info-item">
          <div class="label">中心位置</div>
          <div class="value number-font">
            {{ currentPoint?.lat }}°N, {{ currentPoint?.lng }}°E
          </div>
        </div>
        <div class="info-item">
          <div class="label">更新时间</div>
          <div class="value number-font">{{ formatTime(currentPoint?.time) }}</div>
        </div>
        <div class="info-item">
          <div class="label">中心气压</div>
          <div class="value">
            <span class="number-font big">{{ currentPoint?.pressure }}</span>
            <span class="unit">hPa</span>
          </div>
        </div>
        <div class="info-item">
          <div class="label">最大风速</div>
          <div class="value">
            <span class="number-font big">{{ currentPoint?.windSpeed }}</span>
            <span class="unit">m/s</span>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Moving Direction -->
      <div class="moving-info">
        <div class="label">移动方向</div>
        <div class="value">
          <i class="fa-solid fa-arrow-up-long" :style="{ transform: `rotate(-45deg)` }"></i>
          <span>西北</span>
          <span class="speed number-font">25 km/h</span>
        </div>
      </div>

      <!-- Forecast / Landing -->
      <div class="landing-forecast">
        <div class="forecast-header">
          <i class="fa-solid fa-stopwatch"></i> 预计登陆
        </div>
        <div class="landing-details">
          <div class="landing-loc">珠海金湾</div>
          <div class="landing-timer">
            距登陆仅剩 <span class="highlight number-font">12</span> 小时
          </div>
        </div>
        <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: 60%"></div>
        </div>
      </div>
      
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../../stores/app'

const props = defineProps({
  embedded: {
    type: Boolean,
    default: false
  }
})

const store = useAppStore()

const typhoon = computed(() => store.typhoonData)

const currentPoint = computed(() => {
  if (!typhoon.value?.track?.length) return null
  return typhoon.value.track[typhoon.value.track.length - 1]
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
</script>

<style scoped>
.typhoon-info-panel {
  position: absolute;
  top: 20px;
  right: 20px; /* Adjust based on right sidebar width if needed, but sidebar is outside map container */
  width: 280px;
  background: rgba(16, 23, 42, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(239, 68, 68, 0.3); /* Red border for typhoon */
  border-left: 4px solid #EF4444;
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
  background: rgba(255, 255, 255, 0.05); /* Match other sidebar cards */
}

/* Header */
.panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.typhoon-icon {
  width: 48px;
  height: 48px;
  background: radial-gradient(circle at center, rgba(239, 68, 68, 0.2), transparent 70%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #EF4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 50%;
}

.fa-spin-slow {
  animation: fa-spin 4s infinite linear;
}

@keyframes fa-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.header-info {
  flex: 1;
}

.typhoon-id {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-family: var(--font-display, sans-serif);
}

.typhoon-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.typhoon-name {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1px;
}

.tag-red {
  background: #DC2626;
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 10px;
  font-weight: 600;
}

/* Grid */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-item .label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.info-item .value {
  font-weight: 500;
  color: #E2E8F0;
}

.number-font {
  font-family: var(--font-display, 'DIN Alternate', sans-serif);
}

.big {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.unit {
  font-size: 11px;
  margin-left: 2px;
  color: rgba(255, 255, 255, 0.5);
}

.divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 12px 0;
}

/* Moving Info */
.moving-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  padding: 8px 10px;
  border-radius: 4px;
  margin-bottom: 12px;
}

.moving-info .value {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.speed {
  color: #FCD34D;
}

/* Landing Forecast */
.landing-forecast {
  background: linear-gradient(to right, rgba(220, 38, 38, 0.2), rgba(220, 38, 38, 0.05));
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: 4px;
  padding: 10px;
}

.forecast-header {
  font-size: 11px;
  color: #EF4444;
  font-weight: 600;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.landing-details {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 4px;
}

.landing-loc {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}

.landing-timer {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
}

.landing-timer .highlight {
  color: #EF4444;
  font-size: 14px;
  font-weight: 700;
  margin: 0 1px;
}

.progress-bar-bg {
    height: 4px;
    background: rgba(255,255,255,0.1);
    border-radius: 2px;
    margin-top: 6px;
    overflow: hidden;
}

.progress-bar-fill {
    height: 100%;
    background: #EF4444;
    border-radius: 2px;
}

/* Transitions */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.4s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>
