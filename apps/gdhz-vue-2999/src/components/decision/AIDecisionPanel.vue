<template>
  <div class="ai-decision-panel">
    <div class="ai-hero-row">
      <div class="loader-wrap">
        <div class="loader">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <defs>
              <mask id="clipping">
                <polygon points="0,0 100,0 100,100 0,100" fill="black"></polygon>
                <polygon points="25,25 75,25 50,75" fill="white"></polygon>
                <polygon points="50,25 75,75 25,75" fill="white"></polygon>
                <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                <polygon points="35,35 65,35 50,65" fill="white"></polygon>
              </mask>
            </defs>
          </svg>
          <div class="box"></div>
        </div>
      </div>
      <div class="ai-hero-title">我是您的智能防灾助手</div>
    </div>

    <div class="ai-summary-section">
      <div class="summary-messages">
        <div
          v-for="(item, idx) in summaryItems"
          :key="idx"
          class="summary-bubble"
        >
          <i class="bubble-icon fa-solid" :class="item.icon"></i>
          <div class="bubble-content">
            <span class="bubble-tag" :style="{ color: item.tagColor }">{{ item.tag }}</span>
            <span class="bubble-text">{{ item.text }}</span>
          </div>
        </div>
      </div>
      <div class="ai-disclaimer">
        <i class="fa-solid fa-circle-info"></i>
        以上摘要由 AI 根据实时监测数据自动生成，仅供参考，请以官方发布为准。
      </div>
    </div>

    <div class="ai-chat-section">
      <div class="chat-input-wrapper">
        <input
          v-model="userInput"
          class="chat-input"
          type="text"
          :placeholder="displayPlaceholder"
          @keydown.enter="handleSend"
        />
        <button class="chat-send-btn" @click="handleSend" :disabled="!userInput.trim()">
          <i class="fa-solid fa-arrow-up"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const userInput = ref('')
const displayPlaceholder = ref('')
let typewriterTimer = null

const placeholderTexts = [
  '今天广东沿海风浪情况如何？',
  '台风最新路径预测是什么？',
  '珠江口潮位现在正常吗？',
  '需要发布海浪预警吗？',
  '当前有哪些站点数据异常？',
  '粤西海域适合出海作业吗？',
  '未来24小时天气趋势如何？',
  '防潮设施巡查要注意什么？',
  '哪些区域需要人员转移？',
  '历史相似台风路径有哪些？',
  '沿海旅游区需要关闭吗？',
  '渔船回港避风建议何时发布？',
  '当前应急响应等级合适吗？',
  '风暴潮增水预测结果如何？',
  '海洋灾害预警发布流程是？',
  '近岸浮标监测数据有异常吗？',
  '今年台风季总体形势如何？',
  '深圳沿海明天潮位预报？',
  '应急物资储备情况怎么样？',
  '汕头沿海有赤潮预警吗？',
]

const summaryItems = ref([
  {
    icon: 'fa-hurricane',
    tag: '台风',
    tagColor: '#ef4444',
    text: '台风“榕加澜”(2518) 正向粤西沿海靠近，预计 8 小时内影响湛江、茂名、阳江沿海。',
  },
  {
    icon: 'fa-water',
    tag: '风暴潮',
    tagColor: '#f59e0b',
    text: '珠江口存在 0.5-1.2m 增水风险，珠海、中山沿岸需关注天文大潮叠加效应。',
  },
  {
    icon: 'fa-wave-square',
    tag: '海浪',
    tagColor: '#3b82f6',
    text: '粤东海域浪高 3.5-5.0m，全省沿海已发布海浪黄色预警，近岸作业船舶注意避风。',
  },
  {
    icon: 'fa-triangle-exclamation',
    tag: '综合研判',
    tagColor: '#8b5cf6',
    text: '建议启动 III 级应急响应，重点关注汕头至惠州沿岸低洼地区防潮设施运行状态。',
  },
])

function startTypewriter() {
  const text = placeholderTexts[Math.floor(Math.random() * placeholderTexts.length)]
  displayPlaceholder.value = ''
  let i = 0

  typewriterTimer = setInterval(() => {
    if (i < text.length) {
      displayPlaceholder.value = text.slice(0, i + 1)
      i++
    } else {
      clearInterval(typewriterTimer)
      typewriterTimer = null
    }
  }, 60)
}

function handleSend() {
  if (!userInput.value.trim()) return
  console.log('AI Decision query:', userInput.value)
  userInput.value = ''
}

onMounted(() => {
  startTypewriter()
})

onBeforeUnmount(() => {
  if (typewriterTimer) {
    clearInterval(typewriterTimer)
    typewriterTimer = null
  }
})
</script>

<style scoped>
.ai-decision-panel {
  display: flex;
  flex-direction: column;
  gap: 0;
  height: 100%;
  min-height: 0;
}

.ai-hero-row {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px 10px;
}

.ai-hero-title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: var(--text-primary, #0f172a);
  line-height: 1.3;
}

.loader-wrap {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  position: relative;
}

.loader {
  --color-one: #ffbf48;
  --color-two: #be4a1d;
  --color-three: #ffbf4780;
  --color-four: #bf4a1d80;
  --color-five: #ffbf4740;
  --time-animation: 2s;
  position: absolute;
  top: 0;
  left: 0;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  transform: scale(0.48);
  transform-origin: top left;
  box-shadow:
    0 0 25px 0 var(--color-three),
    0 20px 50px 0 var(--color-four);
  animation: colorize calc(var(--time-animation) * 3) ease-in-out infinite;
}

.loader::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border-top: solid 1px var(--color-one);
  border-bottom: solid 1px var(--color-two);
  background: linear-gradient(180deg, var(--color-five), var(--color-four));
  box-shadow:
    inset 0 10px 10px 0 var(--color-three),
    inset 0 -10px 10px 0 var(--color-four);
}

.loader .box {
  width: 100px;
  height: 100px;
  background: linear-gradient(180deg, var(--color-one) 30%, var(--color-two) 70%);
  mask: url(#clipping);
  -webkit-mask: url(#clipping);
}

.loader svg {
  position: absolute;
}

.loader svg #clipping {
  filter: contrast(15);
  animation: roundness calc(var(--time-animation) / 2) linear infinite;
}

.loader svg #clipping polygon {
  filter: blur(7px);
}

.loader svg #clipping polygon:nth-child(1) {
  transform-origin: 75% 25%;
  transform: rotate(90deg);
}

.loader svg #clipping polygon:nth-child(2) {
  transform-origin: 50% 50%;
  animation: rotation var(--time-animation) linear infinite reverse;
}

.loader svg #clipping polygon:nth-child(3) {
  transform-origin: 50% 60%;
  animation: rotation var(--time-animation) linear infinite;
  animation-delay: calc(var(--time-animation) / -3);
}

.loader svg #clipping polygon:nth-child(4) {
  transform-origin: 40% 40%;
  animation: rotation var(--time-animation) linear infinite reverse;
}

.loader svg #clipping polygon:nth-child(5) {
  transform-origin: 40% 40%;
  animation: rotation var(--time-animation) linear infinite reverse;
  animation-delay: calc(var(--time-animation) / -2);
}

.loader svg #clipping polygon:nth-child(6) {
  transform-origin: 60% 40%;
  animation: rotation var(--time-animation) linear infinite;
}

.loader svg #clipping polygon:nth-child(7) {
  transform-origin: 60% 40%;
  animation: rotation var(--time-animation) linear infinite;
  animation-delay: calc(var(--time-animation) / -1.5);
}

@keyframes rotation {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes roundness {
  0% { filter: contrast(15); }
  20% { filter: contrast(3); }
  40% { filter: contrast(3); }
  60% { filter: contrast(15); }
  100% { filter: contrast(15); }
}

@keyframes colorize {
  0% { filter: hue-rotate(0deg); }
  20% { filter: hue-rotate(-30deg); }
  40% { filter: hue-rotate(-60deg); }
  60% { filter: hue-rotate(-90deg); }
  80% { filter: hue-rotate(-45deg); }
  100% { filter: hue-rotate(0deg); }
}

.ai-summary-section {
  flex: 0 0 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 4px 14px 6px;
}

.ai-summary-section::-webkit-scrollbar {
  width: 3px;
}

.ai-summary-section::-webkit-scrollbar-thumb {
  background: rgba(15, 23, 42, 0.12);
  border-radius: 3px;
}

.summary-messages {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.summary-bubble {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.025);
  border: 1px solid rgba(15, 23, 42, 0.04);
  transition: background 0.15s ease;
}

.summary-bubble:hover {
  background: rgba(15, 23, 42, 0.05);
}

.bubble-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--text-tertiary);
  margin-top: 2px;
}

.bubble-content {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.bubble-tag {
  font-weight: 700;
  font-size: 13px;
  margin-right: 6px;
  letter-spacing: 0.02em;
}

.bubble-text {
  color: var(--text-primary);
  font-weight: 500;
}

.ai-disclaimer {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 10px;
  padding: 0 4px;
  font-size: 11px;
  color: var(--text-muted, #94a3b8);
  line-height: 1.4;
}

.ai-disclaimer i {
  font-size: 10px;
  flex-shrink: 0;
}

.ai-chat-section {
  flex-shrink: 0;
  margin-top: auto;
  padding: 10px 14px 12px;
}

.chat-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.chat-input {
  width: 100%;
  height: 38px;
  padding: 0 40px 0 14px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.03);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.chat-input::placeholder {
  color: var(--text-tertiary);
  font-weight: 400;
}

.chat-input:focus {
  border-color: rgba(13, 116, 144, 0.4);
  box-shadow: 0 0 0 3px rgba(13, 116, 144, 0.08);
}

.chat-send-btn {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: none;
  background: var(--accent-cyan, #0d7490);
  color: #ffffff;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s ease, transform 0.1s ease;
}

.chat-send-btn:hover:not(:disabled) {
  background: #0e6a82;
  transform: translateY(-50%) scale(1.08);
}

.chat-send-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.chat-send-btn:active:not(:disabled) {
  transform: translateY(-50%) scale(0.92);
}
</style>
