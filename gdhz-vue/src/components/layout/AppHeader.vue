<template>
  <header class="app-header">
    <div class="header-left">
      <h1 class="app-title">
        <!-- 海浪场景图标 -->
        <div class="sys-logo">
          <svg viewBox="0 0 48 48" class="logo-svg">
            <defs>
              <!-- 天空渐变 -->
              <linearGradient id="sky-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#001830"/>
                <stop offset="100%" stop-color="#003366"/>
              </linearGradient>
              <!-- 海浪渐变 1 -->
              <linearGradient id="wave1-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#00c8ff"/>
                <stop offset="100%" stop-color="#0088cc"/>
              </linearGradient>
              <!-- 海浪渐变 2 -->
              <linearGradient id="wave2-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#0099dd"/>
                <stop offset="100%" stop-color="#006699"/>
              </linearGradient>
              <!-- 海浪渐变 3 -->
              <linearGradient id="wave3-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#0077aa"/>
                <stop offset="100%" stop-color="#004466"/>
              </linearGradient>
              <!-- 太阳光晕 -->
              <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#ffffcc"/>
                <stop offset="50%" stop-color="#ffdd66"/>
                <stop offset="100%" stop-color="#ff8800" stop-opacity="0"/>
              </radialGradient>
            </defs>
            
            <!-- 背景圆形 -->
            <circle cx="24" cy="24" r="22" fill="url(#sky-grad)" stroke="#00a8ff" stroke-width="1" stroke-opacity="0.5"/>
            
            <!-- 太阳/月亮 -->
            <circle cx="34" cy="12" r="5" fill="url(#sun-glow)" class="sun-pulse"/>
            <circle cx="34" cy="12" r="3" fill="#ffeeaa"/>
            
            <!-- 海浪第一层（前景） -->
            <path d="M2 32 Q8 28 14 32 T26 32 T38 32 T46 32 L46 46 L2 46 Z" 
                  fill="url(#wave1-grad)" class="wave-layer wave-1"/>
            
            <!-- 海浪第二层（中景） -->
            <path d="M2 36 Q10 32 18 36 T34 36 T46 36 L46 46 L2 46 Z" 
                  fill="url(#wave2-grad)" class="wave-layer wave-2"/>
            
            <!-- 海浪第三层（远景） -->
            <path d="M2 40 Q12 36 22 40 T42 40 T46 40 L46 46 L2 46 Z" 
                  fill="url(#wave3-grad)" class="wave-layer wave-3"/>
            
            <!-- 海鸥剪影 -->
            <path d="M12 18 Q14 16 16 18 M13 17 L14 16 L15 17" 
                  fill="none" stroke="#80d0ff" stroke-width="0.8" stroke-linecap="round"/>
            <path d="M20 14 Q22 12 24 14 M21 13 L22 12 L23 13" 
                  fill="none" stroke="#60c0ff" stroke-width="0.6" stroke-linecap="round"/>
          </svg>
        </div>
        <span class="title-text">广东省海洋灾害综合决策系统</span>
      </h1>
      <nav class="nav-bar">
        <router-link
          v-for="item in navItems"
          :key="item.key"
          :to="item.path"
          class="nav-item"
          :class="{ active: currentPage === item.key }"
        >
          {{ item.label }}
        </router-link>
      </nav>
    </div>
    <div class="header-right">
      <div class="system-time">
        <div class="time-main">
          <div class="time-date">{{ formattedDate }}</div>
          <div class="time-lunar">{{ lunarInfo }}</div>
        </div>
        <div class="time-weather" :title="weatherLocation">
          <i :class="weatherIcon"></i>
          <span>{{ weatherLocation }} {{ weatherText }} <span class="weather-temp">{{ weatherTemp }}</span></span>
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

// 时间相关
const now = ref(new Date())
let timer = null

// 天气相关
const weatherLocation = ref('加载中...')
const weatherText = ref('')
const weatherTemp = ref('')
const weatherIcon = ref('fa-solid fa-cloud-sun')

// 天气图标映射
const weatherIconMap = {
  '晴': 'fa-solid fa-sun',
  '多云': 'fa-solid fa-cloud-sun',
  '阴': 'fa-solid fa-cloud',
  '少云': 'fa-solid fa-cloud-sun',
  '晴间多云': 'fa-solid fa-cloud-sun',
  '小雨': 'fa-solid fa-cloud-rain',
  '中雨': 'fa-solid fa-cloud-showers-heavy',
  '大雨': 'fa-solid fa-cloud-showers-heavy',
  '暴雨': 'fa-solid fa-cloud-showers-water',
  '雷阵雨': 'fa-solid fa-cloud-bolt',
  '雪': 'fa-solid fa-snowflake',
  '小雪': 'fa-solid fa-snowflake',
  '中雪': 'fa-solid fa-snowflake',
  '大雪': 'fa-solid fa-snowflake',
  '雾': 'fa-solid fa-smog',
  '霾': 'fa-solid fa-smog',
  '阵雨': 'fa-solid fa-cloud-rain',
  '雨夹雪': 'fa-solid fa-cloud-meatball',
  '浮尘': 'fa-solid fa-wind',
  '扬沙': 'fa-solid fa-wind',
  '沙尘暴': 'fa-solid fa-wind',
}

// 根据天气描述获取图标
const getWeatherIcon = (weather) => {
  for (const key in weatherIconMap) {
    if (weather && weather.includes(key)) {
      return weatherIconMap[key]
    }
  }
  return 'fa-solid fa-cloud-sun' // 默认图标
}

// 高德地图Web服务API Key（免费申请：https://lbs.amap.com/）
const AMAP_KEY = '0fcea6d3fd884f1b8e27746f87245f03'

// 获取天气数据
const fetchWeather = async () => {
  try {
    // 1. 使用高德IP定位API获取精确位置（可精确到区/街道）
    const ipRes = await fetch(`https://restapi.amap.com/v3/ip?key=${AMAP_KEY}`)
    const ipData = await ipRes.json()
    
    let adcode = '440100' // 默认广州
    let district = '广州'
    
    if (ipData.status === '1' && ipData.adcode) {
      adcode = ipData.adcode
      // 优先显示区级，如果没有则显示城市
      district = ipData.district || ipData.city || '广州'
      // 移除"区"、"县"、"市"后缀使显示更简洁
      district = district.replace(/(区|县|市)$/, '')
    }
    
    // 2. 使用高德天气API获取实时天气
    const weatherRes = await fetch(`https://restapi.amap.com/v3/weather/weatherInfo?key=${AMAP_KEY}&city=${adcode}&extensions=base`)
    const weatherData = await weatherRes.json()
    
    if (weatherData.status === '1' && weatherData.lives && weatherData.lives.length > 0) {
      const live = weatherData.lives[0]
      weatherLocation.value = district
      weatherText.value = live.weather || '多云'
      weatherTemp.value = `${live.temperature}°C`
      weatherIcon.value = getWeatherIcon(live.weather)
    } else {
      // 天气API失败时使用默认值
      weatherLocation.value = district
      weatherText.value = '多云'
      weatherTemp.value = '--°C'
    }
  } catch (error) {
    console.error('获取天气失败:', error)
    // 使用默认值
    weatherLocation.value = '广州'
    weatherText.value = '多云'
    weatherTemp.value = '--°C'
  }
}

const formattedDate = computed(() => {
  return now.value.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
})

const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
const lunarMonths = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']
const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']

const lunarInfo = computed(() => {
  const date = now.value
  const month = date.getMonth()
  const day = date.getDate()
  const lunarMonth = (month + 11) % 12
  const lunarDay = (day + 14) % 30
  const weekDay = weekDays[date.getDay()]
  return `${lunarMonths[lunarMonth]}月${lunarDays[lunarDay]} ${weekDay}`
})

let weatherTimer = null

onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date()
  }, 60000)
  
  // 初始化获取天气
  fetchWeather()
  // 每30分钟更新一次天气
  weatherTimer = setInterval(fetchWeather, 30 * 60 * 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (weatherTimer) clearInterval(weatherTimer)
})
</script>

<style scoped>
.app-header {
  flex: 0 0 80px;
  z-index: 100;
  background: linear-gradient(to bottom,
    var(--bg-deepest) 0%,
    rgba(2, 8, 16, 0.9) 70%,
    transparent 100%);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 15px 10px 15px 22px; /* 左侧对齐内容(22px)，右侧对齐面板边缘(10px) */
  position: relative;
}

.app-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 5%;
  right: 5%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border-subtle), transparent);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.app-title {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 0;
  white-space: nowrap;
}

/* 图标容器 */
.sys-logo {
  width: 46px;
  height: 46px;
  flex-shrink: 0;
}

.logo-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 10px rgba(0, 180, 255, 0.4));
}

/* 太阳呼吸 */
.sun-pulse {
  animation: sun-breathe 3s ease-in-out infinite;
  transform-origin: center;
}

@keyframes sun-breathe {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}

/* 海浪动画 - 三层错开 */
.wave-layer {
  animation: wave-flow 3s ease-in-out infinite;
}

.wave-1 { animation-delay: 0s; }
.wave-2 { animation-delay: 0.4s; }
.wave-3 { animation-delay: 0.8s; }

@keyframes wave-flow {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(2px); }
}

/* 系统标题 */
.title-text {
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 3px;
  /* 银白金属渐变 */
  background: linear-gradient(180deg, 
    #ffffff 0%,
    #c8e4ff 50%,
    #90c8f0 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

/* 导航栏 */
.nav-bar {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 6px 8px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 25px;
  border: 1px solid var(--border-subtle);
  backdrop-filter: blur(8px);
}

.nav-bar::-webkit-scrollbar {
  display: none;
}

.nav-item {
  padding: 10px 18px;
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
}

.nav-item:hover {
  color: var(--text-secondary);
  background: rgba(0, 229, 255, 0.08);
  transform: translateY(-1px);
}

.nav-item.active,
.nav-item.router-link-active {
  background: linear-gradient(135deg, rgba(0, 229, 255, 0.15), rgba(0, 229, 255, 0.05));
  color: var(--accent-cyan);
  font-weight: 600;
  border: 1px solid var(--accent-cyan);
  box-shadow: 0 0 15px rgba(0, 229, 255, 0.3), inset 0 0 10px rgba(0, 229, 255, 0.08);
}

.nav-item:active {
  transform: scale(0.97);
}

/* 头部右侧 - 与右侧边栏宽度对齐 */
.header-right {
  width: 340px; /* 与右侧边栏宽度一致 */
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end; /* 右对齐，与下方预警面板右边缘对齐 */
  gap: 8px;
  padding-right: 15px; /* 向左偏移，预留温度显示空间 */
}

.system-time {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-display);
  background: transparent;
  padding: 6px 11px;
}

.time-main {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 110px;
}

.time-date {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  letter-spacing: 0.5px;
}

.time-lunar {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
  text-align: right;
}

.time-weather {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--text-muted);
  font-size: 11px;
  padding-left: 10px;
  border-left: 1px solid var(--border-subtle);
}

.time-weather i {
  color: #ffd43b;
  font-size: 14px;
}

.weather-temp {
  font-weight: 500;
  color: var(--text-secondary);
}
</style>
