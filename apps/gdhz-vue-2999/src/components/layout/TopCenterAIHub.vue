<template>
  <div class="top-center-ai">
    <div class="ai-input-shell">
      <span class="ai-prefix">我是智能防灾助手，</span>
      <input
        v-model="query"
        class="ai-input"
        :placeholder="activePlaceholder"
        @keydown.enter.prevent="submitQuery"
      >
      <button class="ai-send" type="button" @click="submitQuery">
        <i class="fa-solid fa-paper-plane"></i>
      </button>
    </div>

    <div class="ai-summary-card">
      <div class="summary-head">
        <span class="summary-title">AI态势摘要</span>
        <span class="summary-meta">{{ updateTime }}</span>
      </div>
      <div class="summary-main">{{ summaryLead }}</div>
      <div class="summary-grid">
        <div class="summary-item">
          <span class="label">当前预警</span>
          <span class="value">{{ alertCount }} 条</span>
        </div>
        <div class="summary-item">
          <span class="label">重点关注</span>
          <span class="value">{{ focusText }}</span>
        </div>
        <div class="summary-item">
          <span class="label">建议动作</span>
          <span class="value">{{ adviceText }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useAppStore } from '../../stores/app'

const emit = defineEmits(['submit'])
const store = useAppStore()
const query = ref('')

const promptPool = [
  '你可以在此搜索系统功能和对话',
  '今天的台风多久登陆？',
  '哪个站点有预警？',
  '请汇总当前风浪潮风险。',
  '打开海岸观测视频并定位高风险岸段。',
]

const activePlaceholder = promptPool[Math.floor(Math.random() * promptPool.length)]

const alertCount = computed(() => store.alerts.length)

const summaryLead = computed(() => {
  if (!store.alerts.length) {
    return '当前全省海洋灾害态势总体平稳，建议保持常态监测。'
  }
  const top = store.alerts[0]
  return `当前已触发${store.alerts.length}条预警，${top.title}为优先关注对象。`
})

const focusText = computed(() => {
  if (!store.typhoonData?.name) {
    return '沿海潮位与海岸观测视频'
  }
  return `${store.typhoonData.name}路径与潮位预警站点`
})

const adviceText = computed(() => {
  if (!store.alerts.length) {
    return '维持值守并继续自动巡检'
  }
  return '优先核查红橙预警岸段和重点站点'
})

const updateTime = computed(() => {
  return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
})

function submitQuery() {
  const text = query.value.trim()
  if (!text) return
  emit('submit', text)
  query.value = ''
}
</script>

<style scoped>
.top-center-ai {
  position: absolute;
  top: 88px;
  left: 50%;
  transform: translateX(-50%);
  width: min(48vw, 840px);
  z-index: 920;
  pointer-events: none;
}

.ai-input-shell {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 52px;
  padding: 0 10px 0 14px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(10, 22, 46, 0.94), rgba(15, 33, 66, 0.9));
  border: 1px solid rgba(79, 179, 216, 0.45);
  box-shadow: 0 14px 34px rgba(6, 16, 35, 0.45);
}

.ai-prefix {
  font-size: 13px;
  color: #d8f0ff;
  white-space: nowrap;
}

.ai-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: #f8fbff;
  font-size: 14px;
}

.ai-input::placeholder {
  color: rgba(195, 218, 237, 0.68);
}

.ai-send {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(124, 212, 255, 0.38);
  background: rgba(20, 65, 104, 0.75);
  color: #bce9ff;
  cursor: pointer;
}

.ai-summary-card {
  pointer-events: auto;
  margin-top: 10px;
  border-radius: 14px;
  padding: 12px 14px;
  background: linear-gradient(135deg, rgba(7, 18, 38, 0.85), rgba(11, 27, 53, 0.78));
  border: 1px solid rgba(83, 176, 126, 0.32);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.32);
}

.summary-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-title {
  font-size: 13px;
  font-weight: 700;
  color: #9ce7c2;
}

.summary-meta {
  font-size: 12px;
  color: rgba(191, 212, 236, 0.82);
}

.summary-main {
  margin-top: 8px;
  font-size: 13px;
  color: #e8f4ff;
  line-height: 1.5;
}

.summary-grid {
  margin-top: 10px;
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.summary-item {
  border-radius: 10px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(122, 168, 204, 0.18);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-item .label {
  font-size: 11px;
  color: rgba(189, 210, 229, 0.7);
}

.summary-item .value {
  font-size: 12px;
  color: #eff7ff;
  font-weight: 600;
}

@media (max-width: 1440px) {
  .top-center-ai {
    width: min(52vw, 760px);
  }

  .ai-prefix {
    display: none;
  }
}
</style>
