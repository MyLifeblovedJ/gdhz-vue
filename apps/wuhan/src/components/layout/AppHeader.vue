<template>
  <header class="app-header">
    <div class="header-surface" :class="{ 'is-expanded': isMegaMenuOpen }" @mouseleave="closeMegaMenu">
      <div class="header-top-row">
      <div class="header-brand">
        <div class="brand-logo" aria-hidden="true">
          <!-- 动态声纳波纹图标 -->
          <div class="logo-animated">
            <svg viewBox="0 0 100 100" class="logo-svg-main">
              <defs>
                <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#0ea5e9" />
                  <stop offset="50%" stop-color="#0369a1" />
                  <stop offset="100%" stop-color="#0c4a6e" />
                </linearGradient>
                <linearGradient id="wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="rgba(255,255,255,0.9)" />
                  <stop offset="50%" stop-color="rgba(255,255,255,1)" />
                  <stop offset="100%" stop-color="rgba(255,255,255,0.9)" />
                </linearGradient>
              </defs>
              <!-- 背景圆 -->
              <circle cx="50" cy="50" r="48" fill="url(#logo-grad)" />
              <!-- 声纳脉冲环（动画） -->
              <circle class="sonar-ring sonar-1" cx="50" cy="50" r="18" />
              <circle class="sonar-ring sonar-2" cx="50" cy="50" r="18" />
              <circle class="sonar-ring sonar-3" cx="50" cy="50" r="18" />
              <!-- 海浪线 -->
              <path class="wave-line wave-1" d="M15 50 Q25 42, 35 50 T55 50 T75 50 T95 50" />
              <path class="wave-line wave-2" d="M5 56 Q15 48, 25 56 T45 56 T65 56 T85 56" />
              <!-- 中心点 -->
              <circle cx="50" cy="50" r="4" fill="rgba(255,255,255,0.95)" />
              <!-- 旋转光环 -->
              <circle class="orbit-ring" cx="50" cy="50" r="32" />
            </svg>
            <!-- 外圈脉冲光晕 -->
            <div class="logo-pulse"></div>
          </div>
        </div>
        <div class="brand-text">
          <span class="brand-title">海洋渊听智能管理系统</span>
          <span class="brand-subtitle">OCEAN ABYSS INTELLIGENT SYSTEM</span>
        </div>
      </div>

      <div class="header-nav-area">
        <div class="nav-shell">
          <nav class="header-nav" :style="navGridStyle" aria-label="主导航">
            <component
              v-for="item in navItems"
              :key="item.key"
              :is="item.placeholder ? 'span' : 'router-link'"
              :to="item.placeholder ? undefined : item.path"
              class="nav-btn"
              :class="{ active: currentPage === item.key, placeholder: item.placeholder }"
              :title="item.label"
              @mouseenter="openMegaMenu(item.key)"
            >
              <i v-if="item.icon" :class="['nav-icon', item.icon]" aria-hidden="true"></i>
              <span class="nav-text">{{ item.label }}</span>
            </component>
          </nav>

          <Transition name="mega-menu">
            <div v-if="isMegaMenuOpen" class="mega-menu-band">
              <div class="mega-menu-grid" :style="navGridStyle">
                <section
                  v-for="item in navItems"
                  :key="`${item.key}-submenu`"
                  class="mega-menu-section"
                  :class="{ highlighted: hoveredKey === item.key }"
                >
                  <div v-if="item.children?.length" class="mega-menu-links">
                    <component
                      v-for="child in item.children"
                      :key="child.key"
                      :is="item.placeholder ? 'span' : 'router-link'"
                      :to="item.placeholder ? undefined : buildSubmenuLocation(item, child)"
                      class="mega-menu-link"
                      :class="{ active: !item.placeholder && isSubmenuActive(item, child), placeholder: item.placeholder }"
                    >
                      {{ child.label }}
                    </component>
                  </div>
                  <div v-else class="mega-menu-placeholder" aria-hidden="true"></div>
                </section>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <div class="header-tools">
        <div class="tool-datetime">
          <div class="dt-clock">
            <i class="fa-regular fa-clock"></i>
            <span>{{ formattedTime }}</span>
          </div>
          <div class="dt-date">{{ formattedDate }}</div>
        </div>

        <div class="tool-divider" aria-hidden="true"></div>

        <div class="tool-weather" :title="weatherLocation">
          <i :class="weatherIcon"></i>
          <div class="weather-info">
            <span class="weather-temp">{{ weatherTemp }}</span>
            <span class="weather-desc">{{ weatherText }}</span>
          </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '../../stores/app'
import { navItems } from '../../data/navigation'

const emit = defineEmits(['mega-menu-toggle'])

const route = useRoute()
const store = useAppStore()
const currentPage = computed(() => store.currentPage)
const currentSubKey = computed(() => typeof route.query.sub === 'string' ? route.query.sub : '')
const isMegaMenuOpen = ref(false)
const hoveredKey = ref('')
const navGridStyle = computed(() => ({
  '--nav-column-count': navItems.length,
}))

const now = ref(new Date())
let timer = null
let weatherTimer = null

const weatherLocation = ref('加载中...')
const weatherText = ref('')
const weatherTemp = ref('')
const weatherIcon = ref('fa-solid fa-cloud-sun')

const weatherIconMap = {
  晴: 'fa-solid fa-sun',
  多云: 'fa-solid fa-cloud-sun',
  阴: 'fa-solid fa-cloud',
  少云: 'fa-solid fa-cloud-sun',
  晴间多云: 'fa-solid fa-cloud-sun',
  小雨: 'fa-solid fa-cloud-rain',
  中雨: 'fa-solid fa-cloud-showers-heavy',
  大雨: 'fa-solid fa-cloud-showers-heavy',
  暴雨: 'fa-solid fa-cloud-showers-water',
  雷阵雨: 'fa-solid fa-cloud-bolt',
  雪: 'fa-solid fa-snowflake',
  小雪: 'fa-solid fa-snowflake',
  中雪: 'fa-solid fa-snowflake',
  大雪: 'fa-solid fa-snowflake',
  雾: 'fa-solid fa-smog',
  霾: 'fa-solid fa-smog',
  阵雨: 'fa-solid fa-cloud-rain',
  雨夹雪: 'fa-solid fa-cloud-meatball',
  浮尘: 'fa-solid fa-wind',
  扬沙: 'fa-solid fa-wind',
  沙尘暴: 'fa-solid fa-wind'
}

const getWeatherIcon = (weather) => {
  for (const key in weatherIconMap) {
    if (weather && weather.includes(key)) {
      return weatherIconMap[key]
    }
  }
  return 'fa-solid fa-cloud-sun'
}

const AMAP_KEY = '0fcea6d3fd884f1b8e27746f87245f03'

const fetchWeather = async () => {
  try {
    const ipRes = await fetch(`https://restapi.amap.com/v3/ip?key=${AMAP_KEY}`)
    const ipData = await ipRes.json()

    let adcode = '440100'
    let district = '广州'

    if (ipData.status === '1' && ipData.adcode) {
      adcode = ipData.adcode
      district = ipData.district || ipData.city || '广州'
      district = district.replace(/(区|县|市)$/, '')
    }

    const weatherRes = await fetch(`https://restapi.amap.com/v3/weather/weatherInfo?key=${AMAP_KEY}&city=${adcode}&extensions=base`)
    const weatherData = await weatherRes.json()

    if (weatherData.status === '1' && weatherData.lives && weatherData.lives.length > 0) {
      const live = weatherData.lives[0]
      weatherLocation.value = district
      weatherText.value = live.weather || '多云'
      weatherTemp.value = `${live.temperature}°C`
      weatherIcon.value = getWeatherIcon(live.weather)
    } else {
      weatherLocation.value = district
      weatherText.value = '多云'
      weatherTemp.value = '--°C'
    }
  } catch (error) {
    console.error('获取天气失败:', error)
    weatherLocation.value = '广州'
    weatherText.value = '多云'
    weatherTemp.value = '--°C'
  }
}

const formattedTime = computed(() => now.value.toLocaleTimeString('zh-CN', {
  hour: '2-digit',
  minute: '2-digit'
}))

const formattedDate = computed(() => {
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const d = now.value
  return `${d.getMonth() + 1}月${d.getDate()}日 ${weekDays[d.getDay()]}`
})

function openMegaMenu(key) {
  hoveredKey.value = key
  if (isMegaMenuOpen.value) return
  isMegaMenuOpen.value = true
  emit('mega-menu-toggle', true)
}

function closeMegaMenu() {
  if (!isMegaMenuOpen.value) return
  isMegaMenuOpen.value = false
  hoveredKey.value = ''
  emit('mega-menu-toggle', false)
}

function buildSubmenuLocation(item, child) {
  return {
    path: item.path,
    query: { sub: child.key },
  }
}

function isSubmenuActive(item, child) {
  return currentPage.value === item.key && currentSubKey.value === child.key
}

onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date()
  }, 60000)

  fetchWeather()
  weatherTimer = setInterval(fetchWeather, 30 * 60 * 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (weatherTimer) clearInterval(weatherTimer)
})
</script>

<style scoped>
.app-header {
  --header-collapsed-height: 92px;
  --header-expanded-height: 160px;
  height: var(--header-collapsed-height);
  flex-shrink: 0;
  z-index: 1300;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  overflow: visible;
}

.header-surface {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-collapsed-height);
  background: rgba(255, 255, 255, 0.94);
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(18px) saturate(1.04);
  -webkit-backdrop-filter: blur(18px) saturate(1.04);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.05);
  overflow: hidden;
  transition: height 0.26s ease, box-shadow 0.26s ease, background 0.26s ease;
}

.header-surface.is-expanded {
  height: var(--header-expanded-height);
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.1);
}

.header-top-row {
  min-height: var(--header-collapsed-height);
  display: flex;
  align-items: center;
  padding: 0;
  flex-shrink: 0;
}

.header-brand {
  width: var(--sidebar-width, 390px);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  min-width: 0;
  box-sizing: border-box;
  padding: 0 16px;
}

.brand-logo {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  position: relative;
}

.logo-animated {
  width: 100%;
  height: 100%;
  position: relative;
}

.logo-svg-main {
  width: 100%;
  height: 100%;
  display: block;
  filter: drop-shadow(0 2px 8px rgba(14, 165, 233, 0.3));
}

/* 声纳脉冲环动画 */
.sonar-ring {
  fill: none;
  stroke: rgba(255, 255, 255, 0.6);
  stroke-width: 1.2;
  opacity: 0;
  transform-origin: 50% 50%;
  animation: sonar-pulse 3s ease-out infinite;
}

.sonar-1 { animation-delay: 0s; }
.sonar-2 { animation-delay: 1s; }
.sonar-3 { animation-delay: 2s; }

@keyframes sonar-pulse {
  0% {
    r: 8;
    opacity: 0.7;
    stroke-width: 2;
  }
  100% {
    r: 42;
    opacity: 0;
    stroke-width: 0.3;
  }
}

/* 海浪线动画 */
.wave-line {
  fill: none;
  stroke: url(#wave-grad);
  stroke-width: 2;
  stroke-linecap: round;
  opacity: 0.7;
}

.wave-1 {
  animation: wave-drift 4s ease-in-out infinite;
}

.wave-2 {
  stroke-width: 1.5;
  opacity: 0.4;
  animation: wave-drift 4s ease-in-out infinite reverse;
  animation-delay: -1s;
}

@keyframes wave-drift {
  0%, 100% { transform: translateX(-4px); }
  50% { transform: translateX(4px); }
}

/* 旋转光环 */
.orbit-ring {
  fill: none;
  stroke: rgba(255, 255, 255, 0.35);
  stroke-width: 1;
  stroke-dasharray: 8 16;
  stroke-linecap: round;
  transform-origin: 50% 50%;
  animation: orbit-spin 12s linear infinite;
}

@keyframes orbit-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 外圈脉冲光晕 */
.logo-pulse {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border-radius: 50%;
  border: 2px solid rgba(14, 165, 233, 0.25);
  animation: logo-glow 3s ease-in-out infinite;
}

@keyframes logo-glow {
  0%, 100% {
    opacity: 0.4;
    transform: scale(1);
    border-color: rgba(14, 165, 233, 0.2);
    box-shadow: 0 0 0 0 rgba(14, 165, 233, 0);
  }
  50% {
    opacity: 1;
    transform: scale(1.06);
    border-color: rgba(14, 165, 233, 0.5);
    box-shadow: 0 0 16px 2px rgba(14, 165, 233, 0.15);
  }
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.brand-title {
  font-size: 28px;
  font-weight: 750;
  letter-spacing: 0.015em;
  color: var(--text-primary);
  white-space: nowrap;
}

.brand-subtitle {
  font-size: 11px;
  font-weight: 600;
  color: rgba(15, 23, 42, 0.35);
  text-transform: uppercase;
  /* 让英文标题与中文标题等宽对齐 */
  text-align: justify;
  text-align-last: justify;
  white-space: nowrap;
}

.header-nav-area {
  flex: 1;
  min-width: 0;
  display: flex;
  justify-content: center;
}

.nav-shell {
  position: relative;
  width: 100%;
  max-width: 960px;
}

.header-nav {
  display: grid;
  grid-template-columns: repeat(var(--nav-column-count), minmax(0, 1fr));
  column-gap: 20px;
  align-items: center;
  width: 100%;
}

.nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: rgba(15, 23, 42, 0.82);
  text-decoration: none;
  transition: color 0.18s ease, transform 0.18s ease;
  white-space: nowrap;
}

.nav-btn:hover,
.nav-btn.active {
  color: var(--text-primary);
}

.nav-btn.active {
  transform: translateY(-1px);
}

.nav-btn.active .nav-text {
  font-size: 22px;
  font-weight: 700;
}

.nav-icon {
  font-size: 18px;
  color: currentColor;
  transition: transform 0.18s ease;
}

.nav-btn.active .nav-icon {
  transform: scale(1.08);
}

.nav-text {
  font-size: 20px;
  font-weight: 650;
  letter-spacing: 0.01em;
  transition: font-size 0.18s ease, font-weight 0.18s ease;
}

.mega-menu-band {
  position: absolute;
  top: calc(100% + 2px);
  left: 0;
  right: 0;
  width: 100%;
  padding: 0;
  box-sizing: border-box;
}

.mega-menu-grid {
  display: grid;
  grid-template-columns: repeat(var(--nav-column-count), minmax(0, 1fr));
  column-gap: 20px;
  align-items: start;
  padding-top: 4px;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}

.mega-menu-section {
  min-width: 0;
  padding-top: 2px;
  text-align: center;
}

.mega-menu-links {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.mega-menu-placeholder {
  min-height: 1px;
}

.mega-menu-link {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0;
  font-size: 15px;
  font-weight: 560;
  line-height: 1.4;
  color: rgba(15, 23, 42, 0.72);
  text-decoration: none;
  transition: color 0.18s ease, transform 0.18s ease;
}

.mega-menu-link:hover {
  color: #0f172a;
  transform: translateX(2px);
}

.mega-menu-link.active {
  transform: translateX(2px);
  position: relative;
}

.mega-menu-link.active::before {
  content: '';
  position: absolute;
  left: -10px;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #38bdf8;
  box-shadow: 0 0 4px rgba(56, 189, 248, 0.6);
}

/* 当前 hover 的主导航对应的子菜单加粗加黑 */
.mega-menu-section.highlighted .mega-menu-link {
  color: #0f172a;
  font-weight: 700;
}

.header-tools {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
  padding-right: 28px;
}

.tool-datetime {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.dt-clock {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.dt-clock i,
.tool-weather > i {
  font-size: 14px;
  color: var(--text-secondary);
}

.dt-date {
  font-size: 12px;
  color: var(--text-tertiary);
}

.tool-divider {
  width: 1px;
  height: 20px;
  background: rgba(15, 23, 42, 0.1);
}

.tool-weather {
  display: flex;
  align-items: center;
  gap: 8px;
}

.weather-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.weather-temp {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.weather-desc {
  font-size: 12px;
  color: var(--text-tertiary);
}

.mega-menu-enter-active,
.mega-menu-leave-active {
  transition: opacity 0.18s ease;
}

.mega-menu-enter-from,
.mega-menu-leave-to {
  opacity: 0;
}

@media (max-width: 1440px) {
  .app-header {
    --header-collapsed-height: 84px;
    --header-expanded-height: 148px;
  }

  .header-brand {
    gap: 12px;
  }

  .brand-logo {
    width: 48px;
    height: 48px;
  }

  .brand-title {
    font-size: 22px;
  }

  .brand-subtitle {
    font-size: 10px;
  }

  .header-tools {
    padding-right: 20px;
  }

  .header-nav {
    column-gap: 16px;
  }

  .mega-menu-grid {
    column-gap: 16px;
  }

  .nav-text {
    font-size: 18px;
  }

  .nav-btn.active .nav-text {
    font-size: 18px;
  }
}
</style>
