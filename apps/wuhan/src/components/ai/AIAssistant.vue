<template>
  <div class="ai-assistant-container">
    <!-- 聊天面板 -->
    <Transition name="slide-fade">
      <div v-if="isOpen" class="chat-panel">
        <div class="panel-header">
          <div class="header-info">
            <div class="ai-avatar-small">
              <div class="core-small"></div>
              <div class="ring-small"></div>
            </div>
            <span class="title">海洋渊听智能助手</span>
            <span class="status-badge">
              <span class="status-dot"></span>
              在线
            </span>
          </div>
          <button class="close-btn" @click="isOpen = false">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="messages-area" ref="messagesRef">
          <div v-for="(msg, index) in messages" :key="index" class="message-row" :class="msg.role">
            <div v-if="msg.role === 'assistant'" class="avatar">
               <i class="fa-solid fa-robot"></i>
            </div>
            <div class="bubble">
              <div v-if="msg.loading" class="typing-indicator">
                <span></span><span></span><span></span>
              </div>
              <span v-else v-html="msg.content"></span>
            </div>
          </div>
        </div>

        <div class="input-area">
          <div class="suggestions" v-if="messages.length < 2">
            <button v-for="s in suggestions" :key="s" @click="sendMessage(s)">
              <i class="fa-solid fa-sparkles"></i>
              {{ s }}
            </button>
          </div>
          <div class="input-box">
            <input
              v-model="inputText"
              @keyup.enter="handleSend"
              placeholder="输入您的问题..."
              :disabled="isTyping"
            />
            <button class="send-btn" @click="handleSend" :disabled="!inputText || isTyping">
              <i class="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 流动光晕悬浮球 -->
    <div class="aurora-orb" @click="isOpen = !isOpen" :class="{ 'is-open': isOpen }">
      <div class="aurora-wrapper">
        <!-- 中心文字 -->
        <span class="orb-text">AI</span>
        <!-- 12个流动光晕 -->
        <div class="aurora a1"></div>
        <div class="aurora a2"></div>
        <div class="aurora a3"></div>
        <div class="aurora a4"></div>
        <div class="aurora a5"></div>
        <div class="aurora a6"></div>
        <div class="aurora a7"></div>
        <div class="aurora a8"></div>
        <div class="aurora a9"></div>
        <div class="aurora a10"></div>
        <div class="aurora a11"></div>
        <div class="aurora a12"></div>
      </div>
      <!-- 悬浮标签 -->
      <div class="orb-label" v-show="!isOpen">智能助手</div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const isOpen = ref(false)
const inputText = ref('')
const isTyping = ref(false)
const messagesRef = ref(null)

const suggestions = [
  '介绍系统功能',
  '当前台风动态',
  '防御建议',
  '总结灾情'
]

const messages = ref([
  {
    role: 'assistant',
    content: '您好，我是<strong>海洋渊听智能助手</strong>。我可以为您提供：<br>• 实时灾情分析与态势研判<br>• 应急决策辅助建议<br>• 系统操作指引<br><br>请问有什么可以帮您？'
  }
])

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

async function handleSend() {
  if (!inputText.value.trim() || isTyping.value) return
  sendMessage(inputText.value)
}

async function sendMessage(text) {
  messages.value.push({ role: 'user', content: text })
  inputText.value = ''
  scrollToBottom()

  isTyping.value = true
  messages.value.push({ role: 'assistant', content: '', loading: true })
  scrollToBottom()

  await new Promise(r => setTimeout(r, 1200 + Math.random() * 600))

  messages.value.pop()
  const response = getMockResponse(text)
  messages.value.push({ role: 'assistant', content: response })
  isTyping.value = false
  scrollToBottom()
}

function getMockResponse(text) {
  if (text.includes('台风')) {
    return '当前台风 <strong>"格美"</strong> 位于我省东南方向约300公里处，中心风力12级（33m/s），移动速度约15km/h。<br><br><strong>预计路径：</strong>未来24小时将向西北方向移动，对我省沿海造成风雨影响。<br><br><strong>影响区域：</strong>粤东沿海、珠三角部分地区'
  }
  if (text.includes('建议') || text.includes('防御')) {
    return '根据当前响应等级（<strong>III级</strong>），建议采取以下措施：<br><br>1️⃣ 通知海上作业渔船回港避风<br>2️⃣ 加强沿海堤防巡查<br>3️⃣ 准备好应急物资和抢险队伍<br>4️⃣ 提前转移低洼地区群众<br>5️⃣ 做好城市排涝准备'
  }
  if (text.includes('系统') || text.includes('介绍') || text.includes('功能')) {
    return '本系统是<strong>海洋渊听智能管理系统</strong>，核心功能包括：<br><br>📍 <strong>态势感知</strong>：实时监测灾情动态<br>🎯 <strong>指挥调度</strong>：一键下达应急指令<br>📊 <strong>风险研判</strong>：AI辅助决策分析<br>🔍 <strong>数据总览</strong>：多源数据融合展示'
  }
  if (text.includes('灾情') || text.includes('总结')) {
    return '<strong>当前灾情态势总结：</strong><br><br>🌀 台风"格美"接近中，预计24h内影响我省<br>⚠️ 已发布III级应急响应<br>📊 受影响人口：预估120万人<br>🚢 回港渔船：1,234艘<br>🏠 转移群众：8,500人<br><br>建议持续关注气象预警信息。'
  }
  return '收到您的问题：<em>' + text + '</em><br><br>我正在为您分析处理，由于目前是演示版本，仅支持部分特定领域的问答。如需更多帮助，请联系技术支持。'
}
</script>

<style scoped>
.ai-assistant-container {
  position: fixed;
  bottom: 120px;
  right: 30px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  pointer-events: none;
}

/* ========================================
   流动光晕悬浮球
   ======================================== */
.aurora-orb {
  position: relative;
  width: 64px;
  height: 64px;
  cursor: pointer;
  pointer-events: auto;
  border-radius: 50%;
  background: radial-gradient(circle, #8b5cf6 0%, #3b82f6 60%, #06b6d4 100%);
  box-shadow:
    0 0 30px rgba(139, 92, 246, 0.6),
    0 0 60px rgba(59, 130, 246, 0.4),
    0 0 90px rgba(6, 182, 212, 0.2);
  transition: all 0.3s ease;
}

.aurora-orb::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  box-shadow:
    inset 0 4px 20px rgba(255, 255, 255, 0.3),
    inset 0 -4px 20px rgba(6, 182, 212, 0.4);
  pointer-events: none;
}

.aurora-orb:hover {
  transform: scale(1.1);
  box-shadow:
    0 0 40px rgba(139, 92, 246, 0.8),
    0 0 80px rgba(59, 130, 246, 0.5),
    0 0 120px rgba(6, 182, 212, 0.3);
}

.aurora-orb.is-open {
  transform: scale(0.9);
  opacity: 0.7;
}

.aurora-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.orb-text {
  position: relative;
  z-index: 10;
  font-family: 'Rajdhani', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.8);
  letter-spacing: 2px;
}

/* 流动光晕球 */
.aurora {
  position: absolute;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  pointer-events: none;
}

/* 紫色系 */
.aurora.a1, .aurora.a7, .aurora.a10 {
  background: rgba(168, 85, 247, 0.9);
  filter: blur(8px);
}

/* 蓝色系 */
.aurora.a2, .aurora.a5, .aurora.a8, .aurora.a11 {
  background: rgba(59, 130, 246, 0.9);
  filter: blur(10px);
}

/* 青色系 */
.aurora.a3, .aurora.a6, .aurora.a9, .aurora.a12 {
  background: rgba(6, 182, 212, 0.85);
  filter: blur(9px);
}

/* 白色高光 */
.aurora.a4 {
  background: rgba(255, 255, 255, 0.7);
  filter: blur(6px);
  width: 16px;
  height: 16px;
}

/* 光晕位置和动画 */
.aurora.a1  { top: -5px;  left: 20px; animation: float1 6s ease-in-out infinite; }
.aurora.a2  { top: 10px;  left: 45px; animation: float2 7s ease-in-out infinite; }
.aurora.a3  { top: 35px;  left: 50px; animation: float3 5s ease-in-out infinite; }
.aurora.a4  { top: 8px;   left: 8px;  animation: float4 8s ease-in-out infinite; }
.aurora.a5  { top: 45px;  left: 30px; animation: float5 6s ease-in-out infinite; }
.aurora.a6  { top: 50px;  left: 5px;  animation: float6 7s ease-in-out infinite; }
.aurora.a7  { top: 25px;  left: -5px; animation: float7 5s ease-in-out infinite; }
.aurora.a8  { top: -2px;  left: 40px; animation: float8 6s ease-in-out infinite; }
.aurora.a9  { top: 40px;  left: 45px; animation: float9 8s ease-in-out infinite; }
.aurora.a10 { top: 15px;  left: 25px; animation: float10 7s ease-in-out infinite; }
.aurora.a11 { top: 30px;  left: 10px; animation: float11 5s ease-in-out infinite; }
.aurora.a12 { top: 5px;   left: 0px;  animation: float12 6s ease-in-out infinite; }

/* 悬停加速 */
.aurora-orb:hover .aurora {
  animation-duration: 1.5s !important;
}

@keyframes float1 {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(15px, 25px); }
}
@keyframes float2 {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-20px, 15px); }
}
@keyframes float3 {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-15px, -20px); }
}
@keyframes float4 {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(20px, 15px); }
}
@keyframes float5 {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(10px, -25px); }
}
@keyframes float6 {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(25px, -10px); }
}
@keyframes float7 {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(20px, 20px); }
}
@keyframes float8 {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-10px, 20px); }
}
@keyframes float9 {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-20px, -15px); }
}
@keyframes float10 {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(5px, 20px); }
}
@keyframes float11 {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(15px, -10px); }
}
@keyframes float12 {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(18px, 22px); }
}

/* 悬浮标签 */
.orb-label {
  position: absolute;
  top: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%) translateY(-5px);
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.95), rgba(59, 130, 246, 0.95));
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 20px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.5);
  letter-spacing: 1px;
}

.aurora-orb:hover .orb-label {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

/* ========================================
   聊天面板
   ======================================== */
.chat-panel {
  width: 380px;
  height: 520px;
  margin-bottom: 20px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 15, 30, 0.98) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 20px;
  box-shadow:
    0 10px 50px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(139, 92, 246, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  pointer-events: auto;
  transform-origin: bottom right;
}

/* 顶部光条 */
.chat-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 15%;
  right: 15%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #8b5cf6 30%, #3b82f6 50%, #06b6d4 70%, transparent);
  animation: glowPulse 2s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

.panel-header {
  padding: 16px 20px;
  background: linear-gradient(180deg, rgba(139, 92, 246, 0.15) 0%, transparent 100%);
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-avatar-small {
  position: relative;
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.core-small {
  width: 14px;
  height: 14px;
  background: linear-gradient(135deg, #8b5cf6, #06b6d4);
  border-radius: 50%;
  box-shadow: 0 0 12px rgba(139, 92, 246, 0.8);
  animation: corePulse 2s ease-in-out infinite;
}

@keyframes corePulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 12px rgba(139, 92, 246, 0.8); }
  50% { transform: scale(1.1); box-shadow: 0 0 20px rgba(139, 92, 246, 1); }
}

.ring-small {
  position: absolute;
  width: 28px;
  height: 28px;
  border: 2px solid transparent;
  border-top-color: #8b5cf6;
  border-right-color: #06b6d4;
  border-radius: 50%;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.title {
  color: #fff;
  font-weight: 600;
  font-size: 15px;
  letter-spacing: 0.5px;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: #10b981;
  background: rgba(16, 185, 129, 0.15);
  padding: 3px 10px;
  border-radius: 12px;
}

.status-dot {
  width: 6px;
  height: 6px;
  background: #10b981;
  border-radius: 50%;
  animation: statusBlink 2s ease-in-out infinite;
}

@keyframes statusBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.close-btn {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.messages-area {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.messages-area::-webkit-scrollbar {
  width: 4px;
}

.messages-area::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #8b5cf6, #3b82f6);
  border-radius: 2px;
}

.message-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  animation: msgSlide 0.3s ease-out;
}

@keyframes msgSlide {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message-row.user {
  flex-direction: row-reverse;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.3));
  border: 1px solid rgba(139, 92, 246, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8b5cf6;
  flex-shrink: 0;
}

.bubble {
  max-width: 280px;
  padding: 12px 16px;
  border-radius: 14px;
  font-size: 13px;
  line-height: 1.6;
}

.assistant .bubble {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-top-left-radius: 4px;
  color: #e0e8f0;
}

.user .bubble {
  background: linear-gradient(135deg, #8b5cf6, #3b82f6);
  border-top-right-radius: 4px;
  color: #fff;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
}

/* 打字动画 */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: linear-gradient(135deg, #8b5cf6, #3b82f6);
  border-radius: 50%;
  animation: bounce 1.4s ease-in-out infinite;
}

.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-8px); }
}

.input-area {
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(139, 92, 246, 0.15);
}

.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.suggestions button {
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: var(--text-tertiary);
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s;
}

.suggestions button i {
  color: #8b5cf6;
  font-size: 10px;
}

.suggestions button:hover {
  background: rgba(139, 92, 246, 0.2);
  border-color: #8b5cf6;
  color: #fff;
  transform: translateY(-2px);
}

.input-box {
  display: flex;
  gap: 10px;
}

.input-box input {
  flex: 1;
  height: 42px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  padding: 0 16px;
  color: #fff;
  font-size: 13px;
  outline: none;
  transition: all 0.2s;
}

.input-box input::placeholder {
  color: var(--text-muted);
}

.input-box input:focus {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
}

.send-btn {
  width: 42px;
  height: 42px;
  background: linear-gradient(135deg, #8b5cf6, #3b82f6);
  border: none;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 面板动画 */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(30px) scale(0.9);
}
</style>
