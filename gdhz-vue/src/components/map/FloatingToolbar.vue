<template>
  <div class="floating-toolbar">
    <!-- 左侧控制区 -->
    <div class="left-controls">
      <!-- 悬浮按钮组 -->
      <div class="toolbar-buttons">
        <button
          class="toolbar-btn"
          :class="{ active: activePanel === 'layers' }"
          @click="togglePanel('layers')"
          title="图层控制"
        >
          <i class="fa-solid fa-layer-group"></i>
        </button>
        <button
          class="toolbar-btn devices"
          :class="{ active: activePanel === 'devices' }"
          @click="togglePanel('devices')"
          title="观测设备"
        >
          <i class="fa-solid fa-satellite-dish"></i>
        </button>

        <!-- AI 助手按钮 (光晕流转样式) -->
        <div class="halo-ai-btn" @click="toggleAIPanel" title="AI 智能助手" :class="{ active: showAIPanel }">
          <div class="outer-ring"></div>
          <div class="outer-ring"></div>
          <div class="outer-ring"></div>
          <div class="inner-glow"></div>
          <div class="main-border"></div>
          <div class="ai-btn-content">
            <span class="ai-text">AI</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 面板容器 -->
    <Transition name="panel-slide">
      <div v-if="activePanel" class="floating-panel" :class="activePanel">
        <!-- 面板头部 -->
        <div class="panel-header">
          <div class="panel-title">
            <i :class="panelConfig[activePanel].icon"></i>
            {{ panelConfig[activePanel].title }}
          </div>
          <button class="panel-close" @click="closePanel">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- 面板内容 -->
        <div class="panel-content">
          <LayerControl v-if="activePanel === 'layers'" @layer-toggle="handleLayerToggle" />
          <DeviceExplorer v-if="activePanel === 'devices'" @device-click="handleDeviceClick" />
        </div>
      </div>
    </Transition>
    
    <!-- AI 聊天面板 (New Halo Design) -->
    <Transition name="ai-scale">
      <div v-if="showAIPanel" class="halo-chat-dialog">
        <!-- 装饰光晕背景 -->
        <div class="halo-glow-bg"></div>

        <div class="dialog-content">
          <!-- 头部 -->
          <div class="dialog-header">
            <div class="header-info">
              <div class="ai-icon-pulse">
                <i class="fa-solid fa-robot"></i>
              </div>
              <span class="header-title">智能防灾助手</span>
            </div>
            <button class="close-btn" @click="showAIPanel = false">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          
          <!-- 消息区域 -->
          <div class="dialog-messages" ref="messagesRef">
            <div 
              v-for="(msg, index) in messages" 
              :key="index" 
              class="halo-message"
              :class="msg.role"
            >
              <div v-if="msg.role === 'assistant'" class="msg-avatar-box">
                <div class="avatar-glow"></div>
                <div class="avatar-inner">
                  <span>AI</span>
                </div>
              </div>
              <div class="msg-content">
                <div v-if="msg.loading" class="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
                <span v-else v-html="msg.content"></span>
              </div>
            </div>
          </div>
          
          <!-- 输入区域 (光晕流转样式) -->
          <div class="halo-search-input" :class="{ focused: inputFocused }">
            <div class="aurora-glow"></div>
            <div class="outer-ring"></div>
            <div class="outer-ring"></div>
            <div class="outer-ring"></div>
            <div class="inner-glow"></div>
            <div class="main-border"></div>
            <div class="input-wrapper">
              <input
                v-model="inputText"
                @keyup.enter="handleSend"
                @focus="inputFocused = true"
                @blur="inputFocused = false"
                placeholder="询问当前灾情、防御建议..."
                :disabled="isTyping"
                class="search-field"
              />
              <div class="search-btn-border"></div>
              <button class="send-btn" @click="handleSend" :disabled="!inputText || isTyping">
                <i class="fa-solid fa-arrow-up"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useAppStore } from '../../stores/app'
import LayerControl from './LayerControl.vue'
import DeviceExplorer from '../device/DeviceExplorer.vue'

const emit = defineEmits(['device-click', 'layer-toggle'])

const store = useAppStore()

// 面板配置
const panelConfig = {
  layers: {
    title: '图层控制',
    icon: 'fa-solid fa-layer-group'
  },
  devices: {
    title: '观测设备',
    icon: 'fa-solid fa-satellite-dish'
  }
}

// 计算属性
const activePanel = computed(() => store.activeFloatingPanel)

// 方法
function togglePanel(panel) {
  store.setActiveFloatingPanel(panel)
}

function closePanel() {
  store.closeFloatingPanel()
}

function handleLayerToggle(data) {
  emit('layer-toggle', data)
}

function handleDeviceClick(device) {
  emit('device-click', device)
}

// ========== AI 助手相关 ==========
const showAIPanel = ref(false)
const inputText = ref('')
const isTyping = ref(false)
const messagesRef = ref(null)
const inputFocused = ref(false)

// 快捷建议
const suggestions = [
  '介绍一下系统功能',
  '当前台风动态如何？',
  '有什么防御建议？',
  '总结目前灾情'
]

// 消息列表
const messages = ref([
  { 
    role: 'assistant', 
    content: '您好，我是您的<strong>智能防灾助手</strong>。我可以为您提供：<br>• 实时灾情分析与态势研判<br>• 应急决策辅助建议<br>• 系统操作指引<br><br>请问有什么可以帮您？' 
  }
])

// 切换AI面板
function toggleAIPanel() {
  showAIPanel.value = !showAIPanel.value
  // 关闭其他面板
  if (showAIPanel.value) {
    store.closeFloatingPanel()
  }
}

// 滚动到底部
function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

// 发送消息
async function handleSend() {
  if (!inputText.value.trim() || isTyping.value) return
  sendMessage(inputText.value)
}

async function sendMessage(text) {
  // 用户发送
  messages.value.push({ role: 'user', content: text })
  inputText.value = ''
  scrollToBottom()

  // AI 模拟回复
  isTyping.value = true
  messages.value.push({ role: 'assistant', content: '', loading: true })
  scrollToBottom()

  // 模拟网络延迟
  await new Promise(r => setTimeout(r, 1200 + Math.random() * 800))

  // 移除loading
  messages.value.pop()

  const response = getMockResponse(text)
  messages.value.push({ role: 'assistant', content: response })
  isTyping.value = false
  scrollToBottom()
}

// 模拟AI回复
function getMockResponse(text) {
  if (text.includes('台风')) {
    return '当前台风 <strong>"格美"</strong> 位于我省东南方向约300公里处，中心风力12级（33m/s），移动速度约15km/h。<br><br><strong>预计路径：</strong>未来24小时将向西北方向移动，对我省沿海造成风雨影响。<br><br><strong>影响区域：</strong>粤东沿海、珠三角部分地区'
  }
  if (text.includes('建议') || text.includes('防御')) {
    return '根据当前响应等级（<strong>III级</strong>），建议采取以下措施：<br><br>1️⃣ 通知海上作业渔船回港避风<br>2️⃣ 加强沿海堤防巡查<br>3️⃣ 准备好应急物资和抢险队伍<br>4️⃣ 提前转移低洼地区群众<br>5️⃣ 做好城市排涝准备'
  }
  if (text.includes('系统') || text.includes('介绍') || text.includes('功能')) {
    return '本系统是<strong>广东省自然灾害应急指挥平台</strong>，核心功能包括：<br><br>📍 <strong>态势感知</strong>：实时监测灾情动态<br>🎯 <strong>指挥调度</strong>：一键下达应急指令<br>📊 <strong>风险研判</strong>：AI辅助决策分析<br>🔍 <strong>数据总览</strong>：多源数据融合展示'
  }
  if (text.includes('灾情') || text.includes('总结')) {
    return '<strong>当前灾情态势总结：</strong><br><br>🌀 台风"格美"接近中，预计24h内影响我省<br>⚠️ 已发布III级应急响应<br>📊 受影响人口：预估120万人<br>🚢 回港渔船：1,234艘<br>🏠 转移群众：8,500人<br><br>建议持续关注气象预警信息。'
  }
  return '收到您的问题：<em>' + text + '</em><br><br>我正在为您分析处理，由于目前是演示版本，仅支持部分特定领域的问答。如需更多帮助，请联系技术支持。'
}
</script>

<style scoped>
.floating-toolbar {
  position: absolute;
  left: 16px;
  top: 16px;
  z-index: 1100;  /* 高于图例的 1000 */
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

/* 按钮组 */
.toolbar-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(10, 15, 28, 0.85);
  backdrop-filter: blur(12px);
  padding: 8px;
  border-radius: 12px;
  border: 1px solid var(--border-subtle);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.toolbar-btn {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: rgba(30, 40, 60, 0.6);
  color: var(--text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.25s ease;
}

.toolbar-btn:hover {
  background: rgba(50, 65, 90, 0.8);
  color: var(--accent-cyan);
  box-shadow: 0 0 12px rgba(0, 229, 255, 0.3);
}

.toolbar-btn.active {
  background: linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(0, 229, 255, 0.05));
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
  box-shadow: 0 0 15px rgba(0, 229, 255, 0.3);
}

/* 设备按钮特色 */
.toolbar-btn.devices.active {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05));
  border-color: #10b981;
  color: #10b981;
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
}

/* 模型按钮特色 */
.toolbar-btn.models.active {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.05));
  border-color: #8b5cf6;
  color: #8b5cf6;
  box-shadow: 0 0 15px rgba(139, 92, 246, 0.3);
}

/* 悬浮面板 */
.floating-panel {
  width: 320px;
  max-height: 70vh;
  background: rgba(10, 15, 28, 0.92);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border-normal);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

/* 面板顶部光条 */
.floating-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 15%;
  right: 15%;
  height: 2px;
  background: linear-gradient(90deg,
    transparent,
    var(--accent-cyan) 30%,
    var(--accent-cyan) 70%,
    transparent);
  opacity: 0.8;
}

.floating-panel.devices::before {
  background: linear-gradient(90deg,
    transparent,
    #10b981 30%,
    #10b981 70%,
    transparent);
}

.floating-panel.models::before {
  background: linear-gradient(90deg,
    transparent,
    #8b5cf6 30%,
    #8b5cf6 70%,
    transparent);
}

/* 面板头部 */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-subtle);
}

.panel-title {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-cyan);
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.floating-panel.devices .panel-title {
  color: #10b981;
}

.floating-panel.models .panel-title {
  color: #8b5cf6;
}

.panel-close {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.panel-close:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

/* 面板内容 */
.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
}

.panel-content::-webkit-scrollbar {
  width: 4px;
}

.panel-content::-webkit-scrollbar-track {
  background: transparent;
}

.panel-content::-webkit-scrollbar-thumb {
  background: var(--accent-cyan);
  border-radius: 2px;
}

/* 面板滑入动画 */
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: all 0.3s ease;
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* 左侧控制区容器 */
.left-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center; /* 确保按钮居中对齐 */
}

/* ========================================
   Halo Search & AI Assistant Style
   ======================================== */

/* --- Halo AI Button (光晕流转按钮) --- */
.halo-ai-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
}

/* 按钮内容 - 与发送按钮完全一致的样式 */
.halo-ai-btn .ai-btn-content {
  position: relative;
  z-index: 2;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 10px;
  /* 深色渐变背景 */
  background: linear-gradient(180deg, #161329, black, #1d1b4b);
  /* 紫色边框发光效果 - 与发送按钮一致 */
  border: 1px solid rgba(139, 92, 246, 0.4);
  box-shadow: 
    inset 0 0 8px rgba(139, 92, 246, 0.15),
    0 0 8px rgba(139, 92, 246, 0.2);
  transition: all 0.2s ease;
}

/* hover 时增强发光效果 */
.halo-ai-btn:hover .ai-btn-content {
  border-color: rgba(139, 92, 246, 0.6);
  box-shadow: 
    inset 0 0 12px rgba(139, 92, 246, 0.25),
    0 0 15px rgba(139, 92, 246, 0.4);
}

/* active 时最强发光效果 */
.halo-ai-btn.active .ai-btn-content {
  border-color: rgba(139, 92, 246, 0.7);
  box-shadow: 
    inset 0 0 15px rgba(139, 92, 246, 0.3),
    0 0 20px rgba(139, 92, 246, 0.5);
}

.halo-ai-btn .ai-btn-content .ai-text {
  font-family: 'Rajdhani', 'Orbitron', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #c4b5fd;
  text-shadow: 0 0 8px rgba(196, 181, 253, 0.6);
  letter-spacing: 1px;
}

.halo-ai-btn:hover .ai-btn-content .ai-text {
  color: #e9d5ff;
  text-shadow: 0 0 12px rgba(233, 213, 255, 0.8);
}

.halo-ai-btn.active .ai-btn-content .ai-text {
  color: #f5f3ff;
  text-shadow: 0 0 15px rgba(245, 243, 255, 1);
}

/* 光晕层基础样式 - 增强效果 */
.halo-ai-btn .inner-glow,
.halo-ai-btn .main-border,
.halo-ai-btn .outer-ring {
  max-height: 56px;
  max-width: 56px;
  height: 100%;
  width: 100%;
  position: absolute;
  overflow: hidden;
  z-index: -1;
  border-radius: 14px;
  filter: blur(4px);
}

/* 内发光 - 增强亮度 */
.halo-ai-btn .inner-glow {
  max-height: 50px;
  max-width: 50px;
  border-radius: 12px;
  filter: blur(3px);
}

.halo-ai-btn .inner-glow::before {
  content: "";
  z-index: -2;
  text-align: center;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(83deg);
  position: absolute;
  width: 600px;
  height: 600px;
  background-repeat: no-repeat;
  background-position: 0 0;
  filter: brightness(1.8);
  background-image: conic-gradient(
    rgba(0, 0, 0, 0) 0%,
    #b8b0ff,
    rgba(0, 0, 0, 0) 10%,
    rgba(0, 0, 0, 0) 50%,
    #f0a8f0,
    rgba(0, 0, 0, 0) 60%
  );
  transition: all 2s;
}

/* 主边框 - 增强亮度和宽度 */
.halo-ai-btn .main-border {
  max-height: 48px;
  max-width: 48px;
  border-radius: 12px;
  filter: blur(1px);
}

.halo-ai-btn .main-border::before {
  content: "";
  z-index: -2;
  text-align: center;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(70deg);
  position: absolute;
  width: 600px;
  height: 600px;
  filter: brightness(1.6);
  background-repeat: no-repeat;
  background-position: 0 0;
  background-image: conic-gradient(
    #1c191c,
    #5842e0 5%,
    #1c191c 16%,
    #1c191c 50%,
    #e040c0 60%,
    #1c191c 66%
  );
  transition: all 2s;
}

/* 外环 - 增大尺寸 */
.halo-ai-btn .outer-ring {
  max-height: 54px;
  max-width: 54px;
}

.halo-ai-btn .outer-ring::before {
  content: "";
  z-index: -2;
  text-align: center;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(82deg);
  position: absolute;
  width: 600px;
  height: 600px;
  background-repeat: no-repeat;
  background-position: 0 0;
  background-image: conic-gradient(
    rgba(0, 0, 0, 0),
    #18116a,
    rgba(0, 0, 0, 0) 10%,
    rgba(0, 0, 0, 0) 50%,
    #6e1b60,
    rgba(0, 0, 0, 0) 60%
  );
  transition: all 2s;
}

/* Hover 旋转效果 - 仅在非 active 状态生效 */
.halo-ai-btn:not(.active):hover > .outer-ring::before {
  transform: translate(-50%, -50%) rotate(-98deg);
}

.halo-ai-btn:not(.active):hover > .inner-glow::before {
  transform: translate(-50%, -50%) rotate(-97deg);
}

.halo-ai-btn:not(.active):hover > .main-border::before {
  transform: translate(-50%, -50%) rotate(-110deg);
}

/* Active 持续旋转动画 - 平稳流转 */
.halo-ai-btn.active > .outer-ring::before,
.halo-ai-btn.active > .inner-glow::before,
.halo-ai-btn.active > .main-border::before {
  transition: none;
  animation: haloRotate 4s linear infinite;
}

@keyframes haloRotate {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  100% {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

/* --- Halo Chat Dialog --- */
.halo-chat-dialog {
  position: absolute;
  left: 70px;
  top: 0; /* Align with top of toolbar */
  width: 380px;
  height: 550px;
  background: rgba(15, 23, 42, 0.95); /* Deep dark blue */
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 
    0 20px 50px -12px rgba(0, 0, 0, 0.8),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  font-family: var(--font-body);
}

/* Background Glow */
.halo-glow-bg {
  position: absolute;
  top: -20%;
  right: -20%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%);
  border-radius: 50%;
  z-index: 0;
  pointer-events: none;
}

.dialog-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Header */
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.header-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ai-icon-pulse {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
}

.header-title {
  color: #fff;
  font-weight: 600;
  font-size: 15px;
  letter-spacing: 0.5px;
}

.close-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  padding: 4px;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #fff;
}

/* Messages */
.dialog-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Scrollbar styling */
.dialog-messages::-webkit-scrollbar {
  width: 4px;
}
.dialog-messages::-webkit-scrollbar-track {
  background: transparent;
}
.dialog-messages::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.halo-message {
  display: flex;
  gap: 10px;
  max-width: 90%;
  font-size: 14px;
  line-height: 1.5;
}

.halo-message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.halo-message.assistant .msg-content {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: #e2e8f0;
  border-radius: 0 12px 12px 12px;
}

.halo-message.user .msg-content {
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: #fff;
  border-radius: 12px 0 12px 12px;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.msg-content {
  padding: 10px 14px;
  border-radius: 12px;
}

/* AI 头像样式 - 固定尺寸，带光晕质感 */
.msg-avatar-box {
  position: relative;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  margin-top: 2px;
}

.msg-avatar-box .avatar-glow {
  position: absolute;
  inset: -3px;
  background: conic-gradient(
    from 0deg,
    #402fb5,
    #cf30aa,
    #402fb5
  );
  border-radius: 8px;
  filter: blur(3px);
  opacity: 0.6;
  animation: avatarGlowRotate 3s linear infinite;
}

.msg-avatar-box .avatar-inner {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #161329, #0a0a12, #1d1b4b);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.msg-avatar-box .avatar-inner span {
  font-family: 'Rajdhani', 'Orbitron', sans-serif;
  font-size: 10px;
  font-weight: 700;
  color: #c4b5fd;
  text-shadow: 0 0 6px rgba(196, 181, 253, 0.6);
  letter-spacing: 0.5px;
}

@keyframes avatarGlowRotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* --- Halo Search Input (光晕流转输入框) --- */
.halo-search-input {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 16px;
  margin-top: 0;
}

.halo-search-input .input-wrapper {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  width: 100%;
}

.halo-search-input .search-field {
  background-color: #010201;
  border: none;
  width: 100%;
  height: 48px;
  border-radius: 10px;
  color: white;
  padding-right: 54px;
  padding-left: 16px;
  font-size: 14px;
}

.halo-search-input .search-field::placeholder {
  color: #c0b9c0;
}

.halo-search-input .search-field:focus {
  outline: none;
}

.halo-search-input .send-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(180deg, #161329, black, #1d1b4b);
  color: #a78bfa;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 3;
}

.halo-search-input .send-btn:not(:disabled):hover {
  color: #c4b5fd;
  box-shadow: 0 0 10px rgba(139, 92, 246, 0.4);
}

.halo-search-input .send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 光晕层 - 输入框 */
.halo-search-input .inner-glow,
.halo-search-input .main-border,
.halo-search-input .outer-ring,
.halo-search-input .aurora-glow {
  max-height: 62px;
  max-width: calc(100% + 8px);
  height: 100%;
  width: calc(100% + 8px);
  position: absolute;
  overflow: hidden;
  z-index: 1;
  border-radius: 12px;
  filter: blur(3px);
  pointer-events: none;
}

.halo-search-input .inner-glow {
  max-height: 55px;
  max-width: calc(100% + 1px);
  border-radius: 10px;
  filter: blur(2px);
}

.halo-search-input .inner-glow::before {
  content: "";
  z-index: -2;
  text-align: center;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(83deg);
  position: absolute;
  width: 600px;
  height: 600px;
  background-repeat: no-repeat;
  background-position: 0 0;
  filter: brightness(1.4);
  background-image: conic-gradient(
    rgba(0, 0, 0, 0) 0%,
    #a099d8,
    rgba(0, 0, 0, 0) 8%,
    rgba(0, 0, 0, 0) 50%,
    #dfa2da,
    rgba(0, 0, 0, 0) 58%
  );
  transition: all 2s;
}

.halo-search-input .main-border {
  max-height: 51px;
  max-width: calc(100% - 3px);
  border-radius: 11px;
  filter: blur(0.5px);
}

.halo-search-input .main-border::before {
  content: "";
  z-index: -2;
  text-align: center;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(70deg);
  position: absolute;
  width: 600px;
  height: 600px;
  filter: brightness(1.3);
  background-repeat: no-repeat;
  background-position: 0 0;
  background-image: conic-gradient(
    #1c191c,
    #402fb5 5%,
    #1c191c 14%,
    #1c191c 50%,
    #cf30aa 60%,
    #1c191c 64%
  );
  transition: all 2s;
}

.halo-search-input .outer-ring {
  max-height: 57px;
  max-width: calc(100% + 4px);
}

.halo-search-input .outer-ring::before {
  content: "";
  z-index: -2;
  text-align: center;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(82deg);
  position: absolute;
  width: 600px;
  height: 600px;
  background-repeat: no-repeat;
  background-position: 0 0;
  background-image: conic-gradient(
    rgba(0, 0, 0, 0),
    #18116a,
    rgba(0, 0, 0, 0) 10%,
    rgba(0, 0, 0, 0) 50%,
    #6e1b60,
    rgba(0, 0, 0, 0) 60%
  );
  transition: all 2s;
}

.halo-search-input .aurora-glow {
  overflow: hidden;
  filter: blur(30px);
  opacity: 0.4;
  max-height: 100px;
  max-width: calc(100% + 40px);
}

.halo-search-input .aurora-glow::before {
  content: "";
  z-index: -2;
  text-align: center;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(60deg);
  position: absolute;
  width: 999px;
  height: 999px;
  background-repeat: no-repeat;
  background-position: 0 0;
  background-image: conic-gradient(#000, #402fb5 5%, #000 38%, #000 50%, #cf30aa 60%, #000 87%);
  transition: all 2s;
}

.halo-search-input .search-btn-border {
  height: 42px;
  width: 42px;
  position: absolute;
  overflow: hidden;
  top: 3px;
  right: 3px;
  border-radius: 10px;
  pointer-events: none;
}

.halo-search-input .search-btn-border::before {
  content: "";
  text-align: center;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(90deg);
  position: absolute;
  width: 600px;
  height: 600px;
  background-repeat: no-repeat;
  background-position: 0 0;
  filter: brightness(1.35);
  background-image: conic-gradient(
    rgba(0, 0, 0, 0),
    #3d3a4f,
    rgba(0, 0, 0, 0) 50%,
    rgba(0, 0, 0, 0) 50%,
    #3d3a4f,
    rgba(0, 0, 0, 0) 100%
  );
  animation: haloInputRotate 4s linear infinite;
}

/* Hover 效果 */
.halo-search-input:hover .outer-ring::before {
  transform: translate(-50%, -50%) rotate(-98deg);
}

.halo-search-input:hover .aurora-glow::before {
  transform: translate(-50%, -50%) rotate(-120deg);
}

.halo-search-input:hover .inner-glow::before {
  transform: translate(-50%, -50%) rotate(-97deg);
}

.halo-search-input:hover .main-border::before {
  transform: translate(-50%, -50%) rotate(-110deg);
}

/* Focus 效果 - 快速旋转 */
.halo-search-input.focused .outer-ring::before {
  transform: translate(-50%, -50%) rotate(442deg);
  transition: all 4s;
}

.halo-search-input.focused .aurora-glow::before {
  transform: translate(-50%, -50%) rotate(420deg);
  transition: all 4s;
}

.halo-search-input.focused .inner-glow::before {
  transform: translate(-50%, -50%) rotate(443deg);
  transition: all 4s;
}

.halo-search-input.focused .main-border::before {
  transform: translate(-50%, -50%) rotate(430deg);
  transition: all 4s;
}

@keyframes haloInputRotate {
  100% {
    transform: translate(-50%, -50%) rotate(450deg);
  }
}

/* Typing Indicator */
.typing-indicator span {
  display: inline-block;
  width: 4px;
  height: 4px;
  background: #ccc;
  border-radius: 50%;
  margin: 0 2px;
  animation: bounce 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* Transitions */
.ai-scale-enter-active,
.ai-scale-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.ai-scale-enter-from,
.ai-scale-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(10px);
}

.avatar-ring {
  position: absolute;
  inset: 0;
  border: 2px solid transparent;
  border-top-color: #8b5cf6;
  border-right-color: #06b6d4;
  border-radius: 50%;
  animation: ringRotate1 3s linear infinite;
}

.ai-title-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ai-title {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.5px;
}

.ai-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.status-dot {
  width: 6px;
  height: 6px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
  animation: statusPulse 2s ease-in-out infinite;
}

.ai-close-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.ai-close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

/* 消息区域 */
.ai-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ai-messages::-webkit-scrollbar {
  width: 4px;
}

.ai-messages::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #8b5cf6, #3b82f6);
  border-radius: 2px;
}

.message-row {
  display: flex;
  gap: 10px;
  animation: messageSlideIn 0.3s ease-out;
}

.message-row.user {
  flex-direction: row-reverse;
}

.msg-avatar {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.3));
  border: 1px solid rgba(139, 92, 246, 0.4);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8b5cf6;
  font-size: 14px;
  flex-shrink: 0;
}

.msg-bubble {
  max-width: 280px;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.message-row.assistant .msg-bubble {
  background: linear-gradient(135deg,
    rgba(30, 41, 59, 0.8) 0%,
    rgba(15, 23, 42, 0.8) 100%);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-top-left-radius: 4px;
}

.message-row.user .msg-bubble {
  background: linear-gradient(135deg, #8b5cf6, #3b82f6);
  color: #fff;
  border-top-right-radius: 4px;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
}

/* 打字动画 */
.typing-dots {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.typing-dots span {
  width: 8px;
  height: 8px;
  background: linear-gradient(135deg, #8b5cf6, #3b82f6);
  border-radius: 50%;
  animation: typingBounce 1.4s ease-in-out infinite;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

/* 快捷建议 */
.ai-suggestions {
  padding: 0 16px 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggestion-btn {
  padding: 8px 14px;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 20px;
  color: var(--text-tertiary);
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.25s;
}

.suggestion-btn:hover {
  background: rgba(139, 92, 246, 0.2);
  border-color: #8b5cf6;
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.suggestion-btn i {
  color: #8b5cf6;
  font-size: 10px;
}

/* 输入区域 */
.ai-input-area {
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(139, 92, 246, 0.15);
  display: flex;
  gap: 10px;
}

.ai-input {
  flex: 1;
  height: 42px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  padding: 0 16px;
  color: #fff;
  font-size: 13px;
  transition: all 0.25s;
}

.ai-input::placeholder {
  color: var(--text-muted);
}

.ai-input:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
}

.ai-send-btn {
  width: 42px;
  height: 42px;
  background: linear-gradient(135deg, #8b5cf6, #3b82f6);
  border: none;
  border-radius: 10px;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.25s;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
}

.ai-send-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
}

.ai-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* AI 面板滑入动画 */
.ai-panel-slide-enter-active,
.ai-panel-slide-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.ai-panel-slide-enter-from,
.ai-panel-slide-leave-to {
  opacity: 0;
  transform: translateX(-30px) scale(0.95);
}

/* ========================================
   关键帧动画
   ======================================== */

@keyframes ringRotate1 {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes ringRotate2 {
  from { transform: rotate(0deg); }
  to { transform: rotate(-360deg); }
}

@keyframes pulseExpand {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
}

@keyframes iconPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

@keyframes iconFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

@keyframes particleFloat {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0);
  }
  20% {
    opacity: 1;
  }
  80% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-30px);
  }
}

@keyframes borderRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes glowPulse {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

@keyframes coreGlow {
  0%, 100% {
    box-shadow: 0 0 15px rgba(139, 92, 246, 0.6);
  }
  50% {
    box-shadow: 0 0 25px rgba(139, 92, 246, 0.9);
  }
}

@keyframes statusPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes typingBounce {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-8px);
  }
}
</style>
