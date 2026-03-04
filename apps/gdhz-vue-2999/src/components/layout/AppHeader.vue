<template>
  <header class="app-header">
    <!-- 宸︿晶鍝佺墝鍖?-->
    <div class="header-brand">
      <div class="brand-logo">
        <svg viewBox="0 0 48 48" class="logo-svg">
          <defs>
            <linearGradient id="sky-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#081425"/>
              <stop offset="100%" stop-color="#12314b"/>
            </linearGradient>
            <linearGradient id="wave1-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#4fb3d8"/>
              <stop offset="100%" stop-color="#2f6c95"/>
            </linearGradient>
            <linearGradient id="wave2-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#3b81ad"/>
              <stop offset="100%" stop-color="#255f85"/>
            </linearGradient>
            <linearGradient id="wave3-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#2f6c95"/>
              <stop offset="100%" stop-color="#1b425f"/>
            </linearGradient>
            <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#d7e3ef"/>
              <stop offset="50%" stop-color="#7db8d6"/>
              <stop offset="100%" stop-color="#4a8fc4" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <circle cx="24" cy="24" r="22" fill="url(#sky-grad)" stroke="#4a8fc4" stroke-width="1" stroke-opacity="0.45"/>
          <circle cx="34" cy="12" r="5" fill="url(#sun-glow)" class="sun-pulse"/>
          <circle cx="34" cy="12" r="3" fill="#bcd5e6"/>
          <path d="M2 32 Q8 28 14 32 T26 32 T38 32 T46 32 L46 46 L2 46 Z" fill="url(#wave1-grad)" class="wave-layer wave-1"/>
          <path d="M2 36 Q10 32 18 36 T34 36 T46 36 L46 46 L2 46 Z" fill="url(#wave2-grad)" class="wave-layer wave-2"/>
          <path d="M2 40 Q12 36 22 40 T42 40 T46 40 L46 46 L2 46 Z" fill="url(#wave3-grad)" class="wave-layer wave-3"/>
          <path d="M12 18 Q14 16 16 18 M13 17 L14 16 L15 17" fill="none" stroke="#8ab7d3" stroke-width="0.8" stroke-linecap="round"/>
          <path d="M20 14 Q22 12 24 14 M21 13 L22 12 L23 13" fill="none" stroke="#78a9c7" stroke-width="0.6" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="brand-text">
        <span class="brand-title">广东省海洋灾害综合决策系统</span>
        <span class="brand-subtitle">OCEAN DISASTER DECISION SYSTEM</span>
      </div>
    </div>

    <!-- 涓棿瀵艰埅鍖?-->
    <nav class="header-nav">
      <router-link
        v-for="item in navItems"
        :key="item.key"
        :to="item.path"
        class="nav-btn"
        :class="{ active: currentPage === item.key }"
      >
        <span class="nav-text">{{ item.label }}</span>
        <span class="nav-glow"></span>
      </router-link>
    </nav>

    <!-- 鍙充晶宸ュ叿鍖?-->
    <div class="header-tools">
      <div class="tool-datetime">
        <div class="dt-clock">
          <i class="fa-regular fa-clock"></i>
          <span>{{ formattedTime }}</span>
        </div>
        <div class="dt-date">{{ formattedDate }}</div>
      </div>
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

// 鏃堕棿鐩稿叧
const now = ref(new Date())
let timer = null

// 澶╂皵鐩稿叧
const weatherLocation = ref('加载中...')
const weatherText = ref('')
const weatherTemp = ref('')
const weatherIcon = ref('fa-solid fa-cloud-sun')

// 澶╂皵鍥炬爣鏄犲皠
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

// 鏍规嵁澶╂皵鎻忚堪鑾峰彇鍥炬爣
const getWeatherIcon = (weather) => {
  for (const key in weatherIconMap) {
    if (weather && weather.includes(key)) {
      return weatherIconMap[key]
    }
  }
  return 'fa-solid fa-cloud-sun' // 榛樿鍥炬爣
}

// 楂樺痉鍦板浘Web鏈嶅姟API Key锛堝厤璐圭敵璇凤細https://lbs.amap.com/锛?
const AMAP_KEY = '0fcea6d3fd884f1b8e27746f87245f03'

// 鑾峰彇澶╂皵鏁版嵁
const fetchWeather = async () => {
  try {
    // 1. 浣跨敤楂樺痉IP瀹氫綅API鑾峰彇绮剧‘浣嶇疆锛堝彲绮剧‘鍒板尯/琛楅亾锛?
    const ipRes = await fetch(`https://restapi.amap.com/v3/ip?key=${AMAP_KEY}`)
    const ipData = await ipRes.json()
    
    let adcode = '440100' // 默认广州
    let district = '广州'
    
    if (ipData.status === '1' && ipData.adcode) {
      adcode = ipData.adcode
      // 浼樺厛鏄剧ず鍖虹骇锛屽鏋滄病鏈夊垯鏄剧ず鍩庡競
      district = ipData.district || ipData.city || '广州'
      // 绉婚櫎"鍖?銆?鍘?銆?甯?鍚庣紑浣挎樉绀烘洿绠€娲?
      district = district.replace(/(区|县|市)$/, '')
    }
    
    // 2. 浣跨敤楂樺痉澶╂皵API鑾峰彇瀹炴椂澶╂皵
    const weatherRes = await fetch(`https://restapi.amap.com/v3/weather/weatherInfo?key=${AMAP_KEY}&city=${adcode}&extensions=base`)
    const weatherData = await weatherRes.json()
    
    if (weatherData.status === '1' && weatherData.lives && weatherData.lives.length > 0) {
      const live = weatherData.lives[0]
      weatherLocation.value = district
      weatherText.value = live.weather || '多云'
      weatherTemp.value = `${live.temperature}°C`
      weatherIcon.value = getWeatherIcon(live.weather)
    } else {
      // 澶╂皵API澶辫触鏃朵娇鐢ㄩ粯璁ゅ€?
      weatherLocation.value = district
      weatherText.value = '多云'
      weatherTemp.value = '--°C'
    }
  } catch (error) {
    console.error('鑾峰彇澶╂皵澶辫触:', error)
    // 浣跨敤榛樿鍊?
    weatherLocation.value = '广州'
    weatherText.value = '多云'
    weatherTemp.value = '--°C'
  }
}

// 鏃堕棿鏍煎紡鍖?
const formattedTime = computed(() => {
  return now.value.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
})

const formattedDate = computed(() => {
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const d = now.value
  return `${d.getMonth() + 1}月${d.getDate()}日 ${weekDays[d.getDay()]}`
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
  
  // 鍒濆鍖栬幏鍙栧ぉ姘?
  fetchWeather()
  // 姣?0鍒嗛挓鏇存柊涓€娆″ぉ姘?
  weatherTimer = setInterval(fetchWeather, 30 * 60 * 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (weatherTimer) clearInterval(weatherTimer)
})
</script>

<style scoped>
.app-header {
  height: 64px;
  flex-shrink: 0;
  z-index: 100;
  background: linear-gradient(180deg, rgba(8, 20, 36, 0.98) 0%, rgba(7, 17, 31, 0.95) 100%);
  border-bottom: 1px solid rgba(79, 179, 216, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: relative;
}

.app-header::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(79, 179, 216, 0.35), transparent);
}

/* 宸︿晶鍝佺墝鍖?*/
.header-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.brand-logo {
  width: 46px;
  height: 46px;
  flex-shrink: 0;
}

.brand-logo .logo-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 10px rgba(79, 179, 216, 0.35));
}

/* 澶槼鍛煎惛鍔ㄧ敾 */
.sun-pulse {
  animation: sun-breathe 3s ease-in-out infinite;
  transform-origin: center;
}

@keyframes sun-breathe {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}

/* 娴锋氮鍔ㄧ敾 */
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

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand-title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 2px;
  background: linear-gradient(90deg, #fff, #bcd5e6);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.brand-subtitle {
  font-size: 12px;
  letter-spacing: 2px;
  color: rgba(167, 187, 207, 0.72);
  text-transform: uppercase;
}

/* 涓棿瀵艰埅鍖?*/
.header-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.nav-btn {
  position: relative;
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  border-radius: 20px;
  transition: all 0.3s ease;
  overflow: hidden;
}

.nav-btn:hover {
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.05);
}

.nav-btn.active {
  color: #fff;
  background: linear-gradient(135deg, rgba(79, 179, 216, 0.3), rgba(74, 143, 196, 0.15));
  box-shadow: 0 0 18px rgba(79, 179, 216, 0.2);
}

.nav-btn.active .nav-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #4fb3d8, transparent);
}

.nav-text {
  position: relative;
  z-index: 1;
}

/* 鍙充晶宸ュ叿鍖?*/
.header-tools {
  display: flex;
  align-items: center;
  gap: 20px;
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
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.dt-clock i {
  font-size: 14px;
  color: #4fb3d8;
}

.dt-date {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.tool-weather {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.tool-weather > i {
  font-size: 20px;
  color: #7db8d6;
}

.weather-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.weather-temp {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.weather-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}
</style>


