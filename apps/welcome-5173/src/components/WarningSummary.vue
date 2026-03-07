<template>
  <aside class="warning-summary panel-mask" aria-label="预警摘要">
    <header class="warning-summary-head">
      <h2>市级预警摘要</h2>
      <span>{{ cityWarnings.length }} 市</span>
    </header>

    <ul v-if="cityWarnings.length" class="warning-summary-list">
      <li
        v-for="item in cityWarnings"
        :key="item.cityCode"
        class="warning-summary-item"
      >
        <p class="city-line">
          <span class="icon-wrap">
            <img
              v-if="getIconUrl(item)"
              :src="getIconUrl(item)"
              :alt="`${item.cityName}主导灾种图标`"
              class="warn-icon"
            />
            <span
              v-else
              class="icon-fallback-dot"
              :class="`lv-${item.dominantWarning.level}`"
              aria-hidden="true"
            ></span>
          </span>
          <strong>{{ item.cityName }}</strong>
          <span :class="['level-tag', `lv-${item.dominantWarning.level}`]">
            {{ getTypeLabel(item.dominantWarning.disasterType) }}{{ getLevelLabel(item.dominantWarning.level) }}预警
          </span>
        </p>
        <p class="meta-line">
          发布：{{ formatRelative(item.dominantWarning.publishTime) }}
        </p>
        <p class="meta-line">
          截止：{{ formatDateTime(item.dominantWarning.expireTime) }}
        </p>
        <p v-if="item.warnings.length > 1" class="meta-line">
          同市并发：等 {{ item.warnings.length }} 项
        </p>
      </li>
    </ul>

    <p v-else class="empty-hint">当前无生效市级预警</p>
  </aside>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  cityWarnings: {
    type: Array,
    default: () => []
  },
  warningSpec: {
    type: Object,
    default: () => ({
      iconMap: {}
    })
  }
})

const nowTs = ref(Date.now())
let timerId = null

function formatDateTime(value) {
  if (!value) {
    return '--'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hour}:${minute}`
}

// 相对时间按分钟刷新，避免页面长驻时显示失真。
function formatRelative(value) {
  if (!value) {
    return '--'
  }

  const target = new Date(value).getTime()
  if (Number.isNaN(target)) {
    return '--'
  }

  const diff = Math.round((nowTs.value - target) / 60000)
  if (diff < 1) {
    return '刚刚'
  }

  if (diff < 60) {
    return `${diff}分钟前`
  }

  const hours = Math.floor(diff / 60)
  if (hours < 24) {
    return `${hours}小时前`
  }

  const days = Math.floor(hours / 24)
  return `${days}天前`
}

function getTypeLabel(type) {
  const mapping = {
    'storm-surge': '风暴潮',
    tsunami: '海啸',
    wave: '海浪',
    'red-tide': '赤潮',
    other: '其他'
  }
  return mapping[type] || '其他'
}

function getLevelLabel(level) {
  const mapping = {
    red: '红色',
    orange: '橙色',
    yellow: '黄色',
    blue: '蓝色',
    info: '提示'
  }
  return mapping[level] || '提示'
}

function getIconUrl(item) {
  const type = item?.dominantWarning?.disasterType
  const level = item?.dominantWarning?.level
  if (!type || !level) {
    return ''
  }

  const typeIcons = props.warningSpec?.iconMap?.[type]
  if (!typeIcons) {
    return ''
  }

  return typeIcons[level] || typeIcons.info || ''
}

onMounted(() => {
  timerId = window.setInterval(() => {
    nowTs.value = Date.now()
  }, 60 * 1000)
})

onBeforeUnmount(() => {
  if (timerId) {
    window.clearInterval(timerId)
    timerId = null
  }
})
</script>
