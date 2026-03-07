<template>
  <header class="app-header">
    <div class="header-brand">
      <div class="brand-logo" aria-hidden="true">
        <svg viewBox="0 0 48 48" class="logo-svg">
          <rect x="4" y="4" width="40" height="40" rx="14" fill="#ffffff" stroke="rgba(15, 23, 42, 0.1)" />
          <path d="M13 18h22" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
          <path d="M13 25c3.2 0 3.2-2 6.3-2s3.2 2 6.4 2 3.2-2 6.4-2 3.2 2 6.4 2" fill="none" stroke="#334155" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M13 31h14" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" />
        </svg>
      </div>
      <div class="brand-text">
        <span class="brand-title">广东省海洋灾害综合决策系统</span>
        <span class="brand-subtitle">Ocean Disaster Decision System</span>
      </div>
    </div>

    <nav class="header-nav" aria-label="主导航">
      <router-link
        v-for="item in navItems"
        :key="item.key"
        :to="item.path"
        class="nav-btn"
        :class="{ active: currentPage === item.key }"
        :title="item.label"
      >
        <i v-if="item.icon" :class="['nav-icon', item.icon]" aria-hidden="true"></i>
        <span class="nav-text">{{ item.label }}</span>
      </router-link>
    </nav>

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
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '../../stores/app'
import { navItems } from '../../data/mockData'

const store = useAppStore()
const currentPage = computed(() => store.currentPage)

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
  height: 68px;
  flex-shrink: 0;
  z-index: 1300;
  background: #ffffff;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 28px;
  padding: 0 24px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.brand-logo {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
}

.logo-svg {
  width: 100%;
  height: 100%;
  color: #0f172a;
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand-title {
  font-size: 19px;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: var(--text-primary);
}

.brand-subtitle {
  display: none;
}

.header-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 22px;
  min-width: 0;
}

.nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
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
  font-size: 16px;
  font-weight: 700;
}

.nav-icon {
  font-size: 14px;
  color: currentColor;
  transition: transform 0.18s ease;
}

.nav-btn.active .nav-icon {
  transform: scale(1.08);
}

.nav-text {
  font-size: 15px;
  font-weight: 580;
  letter-spacing: 0;
  transition: font-size 0.18s ease, font-weight 0.18s ease;
}

.header-tools {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
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

@media (max-width: 1440px) {
  .app-header {
    gap: 20px;
    padding: 0 18px;
  }

  .header-nav {
    gap: 18px;
  }

  .nav-text {
    font-size: 14px;
  }

  .nav-btn.active .nav-text {
    font-size: 15px;
  }

  .brand-title {
    font-size: 18px;
  }
}
</style>
