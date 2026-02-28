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
    
    <!-- AI 聊天面板（保持原视觉，仅调整布局） -->
    <Transition name="ai-scale">
      <div v-if="showAIPanel" class="halo-chat-dialog" :class="{ expanded: isAIPanelExpanded }">
        <div class="halo-glow-bg"></div>
        <div class="dialog-content ai-layout-shell">
          <aside class="ai-session-sider">
            <button class="session-btn new-session" :disabled="catalogLoading || isTyping" @click="startNewSession({ typedGreeting: true })">
              <i class="fa-solid fa-plus"></i>
              新建会话
            </button>
            <div class="sider-history">
              <template v-for="group in sessionGroups" :key="group.key">
                <div v-if="group.items.length" class="sider-group">
                  <div class="sider-group-title">{{ group.label }}</div>
                  <div
                    v-for="item in group.items"
                    :key="item.chatSessionId"
                    class="sider-item-wrap"
                    :class="{ active: item.chatSessionId === selectedSessionId }"
                  >
                    <button
                      class="sider-item"
                      :class="{ active: item.chatSessionId === selectedSessionId }"
                      :title="item.title || '未命名会话'"
                      :disabled="isTyping"
                      @click="activateSession(item)"
                    >
                      <span class="sider-item-avatar" :class="getBackendClass(item.backend || item.backendKey)">
                        <img
                          class="provider-icon provider-icon-session"
                          :src="getBackendIcon(item.backend || item.backendKey)"
                          :alt="normalizeBackendName(item.backend || item.backendKey)"
                        />
                      </span>
                      <span class="sider-item-text">
                        <span class="sider-item-title" :title="item.title || '未命名会话'">{{ item.title || '未命名会话' }}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      class="sider-item-menu-trigger"
                      :class="{ open: sessionMenuId === item.chatSessionId }"
                      :disabled="isTyping"
                      @pointerdown.stop
                      @click.stop="toggleSessionMenu(item.chatSessionId)"
                    >
                      <i class="fa-solid fa-ellipsis"></i>
                    </button>
                    <div
                      v-if="sessionMenuId === item.chatSessionId"
                      class="sider-item-menu"
                      @pointerdown.stop
                      @click.stop
                    >
                      <button class="sider-item-menu-option" @click="handleSessionMenuAction('pin', item)">
                        <i class="fa-solid fa-thumbtack"></i>
                        {{ isSessionPinned(item.chatSessionId) ? '取消置顶' : '置顶' }}
                      </button>
                      <button class="sider-item-menu-option" @click="handleSessionMenuAction('rename', item)">
                        <i class="fa-solid fa-pen"></i>
                        重命名
                      </button>
                      <button class="sider-item-menu-option danger" @click="handleSessionMenuAction('delete', item)">
                        <i class="fa-solid fa-trash"></i>
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              </template>
              <div v-if="!sessionOptions.length" class="sider-empty">暂无会话历史</div>
            </div>
          </aside>

          <section class="ai-chat-pane">
            <div class="dialog-header">
              <div class="header-title-wrap">
                <div class="header-title" :title="currentSessionTitle">{{ currentSessionTitle }}</div>
                <div class="header-subtitle">{{ currentBackendName }} · {{ currentModelLabel }}</div>
              </div>
              <div class="dialog-header-actions">
                <button
                  class="expand-btn dialog-action-btn"
                  type="button"
                  :title="isAIPanelExpanded ? '还原' : '放大'"
                  @click="toggleAIPanelExpand"
                >
                  <i :class="isAIPanelExpanded ? 'fa-solid fa-compress' : 'fa-solid fa-expand'"></i>
                </button>
                <button class="close-btn dialog-action-btn" type="button" title="关闭" @click="closeAIPanel">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>

            <div class="welcome-shell" v-if="showWelcomeHero">
              <h2 class="welcome-title">您好，我是您的智能防灾助手</h2>
              <div class="model-switcher" :class="`active-${activeModelKey}`">
                <button
                  type="button"
                  class="model-switch-btn"
                  :class="{ active: activeModelKey === 'gemini' }"
                  :disabled="catalogLoading || isTyping"
                  @click="switchBackend('gemini')"
                >
                  <span class="model-dot">
                    <img class="provider-icon provider-icon-switch" :src="getBackendIcon('gemini')" alt="Gemini" />
                  </span>
                  <span class="model-label">Gemini CLI</span>
                </button>
                <span class="switch-divider"></span>
                <button
                  type="button"
                  class="model-switch-btn"
                  :class="{ active: activeModelKey === 'codex' }"
                  :disabled="catalogLoading || isTyping"
                  @click="switchBackend('codex')"
                >
                  <span class="model-dot">
                    <img class="provider-icon provider-icon-switch" :src="getBackendIcon('codex')" alt="Codex" />
                  </span>
                  <span class="model-label">Codex</span>
                </button>
              </div>
            </div>

            <div class="dialog-messages" ref="messagesRef">
              <div
                v-for="(msg, index) in messages"
                :key="index"
                class="halo-message"
                :class="[
                  msg.role,
                  {
                    'is-confirmation': msg.kind === 'confirmation',
                    'is-plain-assistant': msg.role === 'assistant' && msg.kind !== 'confirmation',
                    'is-thought-trace': msg.role === 'assistant' && msg.kind !== 'confirmation' && msg.tone === 'thought',
                    'is-greeting': msg.role === 'assistant' && msg.tone === 'greeting',
                  },
                ]"
              >
                <div v-if="msg.role === 'assistant' && msg.kind === 'confirmation'" class="msg-avatar-box">
                  <div class="avatar-glow"></div>
                  <div class="avatar-inner">
                    <img
                      class="provider-icon provider-icon-assistant"
                      :src="getBackendIcon(selectedBackend.value || selectedBackendKey)"
                      :alt="currentBackendName"
                    />
                  </div>
                </div>
                <div class="msg-content">
                  <div
                    v-if="index === latestAssistantMessageIndex && msg.role === 'assistant' && msg.kind !== 'confirmation' && streamSteps.length"
                    class="stream-step-panel"
                  >
                    <button type="button" class="stream-step-toggle" @click="toggleStreamStepsCollapsed">
                      <span>View Steps</span>
                      <i :class="streamStepsCollapsed ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-up'"></i>
                    </button>
                    <div v-if="!streamStepsCollapsed" class="stream-step-list">
                      <div
                        v-for="step in streamSteps"
                        :key="step.id"
                        class="stream-step-item"
                        :class="`is-${step.status}`"
                      >
                        <div class="stream-step-head">
                          <span class="stream-step-title-wrap">
                            <span class="stream-step-dot" :class="`is-${step.status}`"></span>
                            <span class="stream-step-title">{{ step.title }}</span>
                          </span>
                          <span class="stream-step-status">{{ step.statusLabel }}</span>
                        </div>
                        <div v-if="step.description" class="stream-step-desc">{{ step.description }}</div>
                        <div
                          v-for="(line, lineIndex) in step.details"
                          :key="`${step.id}-detail-${lineIndex}`"
                          class="stream-step-detail"
                        >
                          {{ line }}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-if="msg.loading" class="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                  <template v-else-if="msg.kind === 'confirmation'">
                    <div class="confirm-card-title">{{ msg.title || '工具调用审批' }}</div>
                    <div class="confirm-card-desc">{{ msg.description || '请确认是否继续执行工具调用。' }}</div>
                    <div class="confirm-card-actions">
                      <button
                        v-for="(option, optionIndex) in msg.options || []"
                        :key="`${msg.confirmationId}-${optionIndex}`"
                        type="button"
                        class="confirm-card-action-btn"
                        :disabled="msg.submitting || msg.resolved"
                        @click="confirmToolAction(msg, option)"
                      >
                        {{ option.label }}
                      </button>
                    </div>
                    <div v-if="msg.resolvedLabel" class="confirm-card-result">已确认：{{ msg.resolvedLabel }}</div>
                  </template>
                  <div v-else class="message-markdown" v-html="msg.content"></div>
                </div>
              </div>
            </div>

            <div v-if="thinkingVisible && thinkingText" class="thinking-strip" :class="{ active: thinkingActive }">
              <div class="thinking-strip-icon"></div>
              <div class="thinking-strip-content">
                <div class="thinking-strip-label">
                  思考中
                  <span v-if="thinkingActive" class="thinking-dots"><i></i><i></i><i></i></span>
                </div>
                <div class="thinking-strip-text">{{ thinkingText }}</div>
              </div>
            </div>

            <div class="halo-search-input" :class="{ focused: inputFocused }">
              <div class="aurora-glow"></div>
              <div class="outer-ring"></div>
              <div class="outer-ring"></div>
              <div class="outer-ring"></div>
              <div class="inner-glow"></div>
              <div class="main-border"></div>
              <div class="input-wrapper">
                <textarea
                  ref="inputRef"
                  v-model="inputText"
                  @keydown.enter.exact.prevent="handleSend"
                  @input="resizeInput"
                  @focus="inputFocused = true"
                  @blur="inputFocused = false"
                  placeholder="请输入您的问题..."
                  :disabled="isTyping"
                  class="search-field"
                  rows="1"
                ></textarea>
                <div class="composer-inline-toolbar">
                  <div class="composer-model-select-wrap" :style="composerModelSelectStyle">
                    <select
                      v-model="selectedModelId"
                      class="composer-model-select"
                      :disabled="catalogLoading || isTyping || modelOptions.length === 0"
                      @change="handleModelChange"
                    >
                      <option v-if="modelOptions.length === 0" value="">默认模型</option>
                      <option v-for="item in modelOptions" :key="item.id" :value="item.id">
                        {{ item.label || item.id }}
                      </option>
                    </select>
                    <i class="fa-solid fa-chevron-down composer-model-chevron"></i>
                  </div>
                </div>
                <div class="search-btn-border"></div>
                <button class="send-btn" @click="handleSend" :disabled="!inputText || isTyping">
                  <i class="fa-solid fa-arrow-up"></i>
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useAppStore } from '../../stores/app'
import {
  chatWithAIStream,
  confirmAITool,
  fetchAIConfirmations,
  fetchCurrentSummary,
  fetchAICatalog,
  fetchChatHistory,
  fetchAISessions,
  renameAISession,
  deleteAISession,
} from '../../api/ai'
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
const isAIPanelExpanded = ref(false)
const inputText = ref('')
const isTyping = ref(false)
const messagesRef = ref(null)
const inputRef = ref(null)
const inputFocused = ref(false)
const chatSessionId = ref(null)
const catalogLoading = ref(false)
const catalogProviders = ref([])
const selectedBackendKey = ref('')
const selectedModelId = ref('')
const sessionLoading = ref(false)
const sessionOptions = ref([])
const selectedSessionId = ref('')
const sessionMenuId = ref('')
const pinnedSessionIds = ref([])
const composerPlaceholder = ref('请输入您的问题...')
const allowedBackends = new Set(['gemini', 'codex'])
const CHAT_SESSION_STORAGE_KEY = 'gdhz.ai.chatSession.v1'
const PINNED_SESSION_STORAGE_KEY = 'gdhz.ai.pinnedSessions.v1'
const DEFAULT_COMPOSER_PLACEHOLDER = '请输入您的问题...'
const HISTORY_PAGE_SIZE = 100
const SESSION_PAGE_SIZE = 50
const BACKEND_ICON_MAP = Object.freeze({
  gemini: '/icons/gemini-color.svg',
  codex: '/icons/openai-light.svg',
  generic: '/icons/openai-light.svg',
})
const WELCOME_MESSAGE_POOL = [
  `我可以为您提供：
• 实时灾情分析与态势研判
• 应急决策辅助建议
• 系统操作指引

请问有什么可以帮您？`,
  `您好，当前海洋灾害监测系统已就绪。
• 风暴潮趋势分析可实时更新
• 重点岸段风险等级可快速查询
• 应急联动建议支持一键生成

请告诉我您关注的区域。`,
  `欢迎进入海洋灾害决策模式。
• 台风路径与海浪影响可联动研判
• 潮位异常可自动预警
• 防御措施可按等级推荐

您想先看哪一项？`,
  `您好，我可以协助您开展应急值守。
• 快速汇总当前灾情
• 识别高风险岸段与港区
• 生成处置与调度建议

请直接输入任务目标。`,
  `智能防灾助手已在线。
• 支持多源监测数据综合分析
• 支持会商纪要要点提炼
• 支持阶段性防御行动建议

现在需要我先分析什么？`,
  `已进入海洋灾害研判界面。
• 我可以解释预警信号含义
• 我可以辅助制定分级响应建议
• 我可以给出巡查重点清单

请描述您的问题。`,
  `您好，系统当前可用能力如下：
• 灾情态势自动总结
• 应急资源调度建议
• 现场处置流程指引

需要我先输出哪部分内容？`,
  `欢迎使用智能防灾助手。
• 可按“今天/昨天”查看会话历史
• 可在 Gemini/Codex 之间快速切换
• 可基于上下文持续追问

请输入您关心的灾情。`,
  `海洋灾害综合决策助手已准备就绪。
• 风暴潮风险评估
• 海堤防护薄弱点提示
• 应急行动优先级建议

请问是否需要立即生成简报？`,
  `您好，我可以作为您的值班研判助手。
• 监测异常快速识别
• 风险区域自动标注
• 防灾建议结构化输出

告诉我当前场景即可。`,
  `欢迎回来，已为您开启智能决策支持。
• 提供灾情快照与变化趋势
• 提供跨部门协同建议
• 提供公众提醒要点

您希望从哪里开始？`,
  `当前系统运行稳定。
• 可分析台风、海浪、潮位联动影响
• 可生成分区分级防御建议
• 可输出现场执行清单

请输入您的任务。`,
  `您好，我可以协助您完成会商准备。
• 一键整理关键风险点
• 形成可执行应急建议
• 提炼汇报口径与重点结论

现在开始吗？`,
  `智能助手已连接到灾情上下文。
• 可快速回答系统操作问题
• 可解释模型输出结果
• 可给出下一步处置建议

请告诉我您的目标。`,
  `欢迎使用海洋防灾决策支持。
• 重点区域风险热度可说明
• 资源布控建议可生成
• 风险沟通要点可提炼

您希望查看哪个模块？`,
  `您好，我是您的智能防灾助手。
• 支持实时态势分析
• 支持应急处置建议
• 支持操作流程指引

请问有什么可以帮您？`,
  `系统已进入应急决策协同状态。
• 可识别高优先级处置任务
• 可汇总监测站异常信息
• 可输出阶段性研判结论

请描述当前需求。`,
  `欢迎接入海洋灾害智能会话。
• 我可以帮您快速看清风险
• 我可以帮您拟定行动方案
• 我可以帮您完成值班记录要点

请直接下达任务。`,
  `您好，防灾助手已准备完毕。
• 提供沿海区域风险对比
• 提供巡查重点与频次建议
• 提供响应升级参考意见

您现在最关注什么？`,
  `当前可执行的智能能力包括：
• 灾情摘要自动生成
• 风险等级趋势说明
• 指挥调度建议输出

需要我先生成一版摘要吗？`,
  `欢迎进入海洋灾害工作台。
• 可快速定位重点风险区
• 可生成分时段防御策略
• 可输出值班交接提示

请告诉我当前班次任务。`,
  `您好，我可以为您提供决策辅助。
• 风险研判结果结构化呈现
• 处置建议按优先级排序
• 关键事项自动提醒

请输入您想分析的问题。`,
  `智能防灾助手在线响应中。
• 支持多轮问答与连续追踪
• 支持历史会话快速回看
• 支持不同模型策略切换

请继续输入。`,
  `欢迎，系统已准备好应急支持。
• 当前海域态势可即时汇总
• 防御动作建议可直接生成
• 重点部门联动可给出提示

请问先看哪部分？`,
  `您好，今天也一起高效值守。
• 监测数据异常快速提示
• 风险趋势可视化解读
• 处置方案可操作化建议

告诉我您需要的输出格式。`,
  `海洋灾害决策助手已启动。
• 可生成“现状-风险-行动”三段式结论
• 可针对重点岸段给出建议
• 可辅助会商发言提纲整理

是否现在开始分析？`,
  `欢迎进入智能研判对话。
• 我可以帮您压缩信息噪声
• 我可以帮您突出关键风险
• 我可以帮您形成明确行动项

请输入当前事件。`,
  `您好，已为您打开应急辅助模式。
• 支持防汛防潮场景分析
• 支持灾后复盘要点整理
• 支持跨时段趋势对比

需要我先给出总体态势吗？`,
  `当前会话可用于海洋灾害快速决策。
• 可在一分钟内形成初步建议
• 可结合历史会话追溯结论
• 可输出简洁行动清单

请告诉我任务背景。`,
  `您好，我会持续为您提供防灾支持。
• 实时灾情分析与态势研判
• 应急决策辅助建议
• 系统操作指引

请问有什么可以帮您？`
]
let greetingTimer = null
let lastGreetingIndex = -1
let confirmationPollTimer = null
const CONFIRMATION_POLL_INTERVAL_MS = 1600

const selectedBackend = computed(() => {
  const current = catalogProviders.value.find(item => (item.backendKey || item.backend) === selectedBackendKey.value)
  return current?.backend || ''
})

const modelOptions = computed(() => {
  const current = catalogProviders.value.find(item => (item.backendKey || item.backend) === selectedBackendKey.value)
  return Array.isArray(current?.models) ? current.models : []
})

const messages = ref([])
const streamSteps = ref([])
const streamStepsCollapsed = ref(false)
const thinkingText = ref('')
const thinkingActive = ref(false)
const thinkingVisible = ref(false)
const SESSION_VISUAL_STORAGE_KEY = 'GDHZ_AI_SESSION_VISUAL_V1'
const SESSION_VISUAL_MAX_SESSIONS = 120
const sessionVisualStore = ref(readSessionVisualStore())
const SESSION_VISUAL_DRAFT_KEY = '__draft__'
const MAX_STREAM_STEP_COUNT = 18
let thinkingHideTimer = null

function cloneStreamSteps(list = []) {
  return (Array.isArray(list) ? list : []).map((item) => ({ ...item }))
}

function normalizeSessionVisualStore(rawValue) {
  if (!rawValue || typeof rawValue !== 'object') return {}
  const entries = Object.entries(rawValue)
  if (!entries.length) return {}

  const normalizedEntries = entries
    .map(([key, value]) => {
      const sessionKey = String(key || '').trim()
      if (!sessionKey) return null
      const steps = cloneStreamSteps(Array.isArray(value?.steps) ? value.steps : []).slice(-MAX_STREAM_STEP_COUNT)
      const stepsCollapsed = Boolean(value?.stepsCollapsed)
      const updatedAt = Number(value?.updatedAt || 0) || Date.now()
      return [sessionKey, { steps, stepsCollapsed, updatedAt }]
    })
    .filter(Boolean)
    .sort((a, b) => Number(b[1]?.updatedAt || 0) - Number(a[1]?.updatedAt || 0))
    .slice(0, SESSION_VISUAL_MAX_SESSIONS)

  return Object.fromEntries(normalizedEntries)
}

function readSessionVisualStore() {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(SESSION_VISUAL_STORAGE_KEY)
    if (!raw) return {}
    return normalizeSessionVisualStore(JSON.parse(raw))
  } catch {
    return {}
  }
}

function persistSessionVisualStore(nextStore) {
  if (typeof window === 'undefined') {
    sessionVisualStore.value = normalizeSessionVisualStore(nextStore)
    return
  }
  try {
    const normalized = normalizeSessionVisualStore(nextStore)
    sessionVisualStore.value = normalized
    window.localStorage.setItem(SESSION_VISUAL_STORAGE_KEY, JSON.stringify(normalized))
  } catch {
    sessionVisualStore.value = normalizeSessionVisualStore(nextStore)
  }
}

function getVisualSessionKey(targetChatSessionId = chatSessionId.value) {
  const normalized = String(targetChatSessionId || '').trim()
  return normalized || SESSION_VISUAL_DRAFT_KEY
}

function saveSessionVisual(targetChatSessionId = chatSessionId.value) {
  const key = getVisualSessionKey(targetChatSessionId)
  persistSessionVisualStore({
    ...sessionVisualStore.value,
    [key]: {
      steps: cloneStreamSteps(streamSteps.value),
      stepsCollapsed: Boolean(streamStepsCollapsed.value),
      updatedAt: Date.now(),
    },
  })
}

function restoreSessionVisual(targetChatSessionId = chatSessionId.value) {
  const key = getVisualSessionKey(targetChatSessionId)
  const saved = sessionVisualStore.value[key]
  streamSteps.value = saved?.steps ? cloneStreamSteps(saved.steps) : []
  streamStepsCollapsed.value = Boolean(saved?.stepsCollapsed)
}

function migrateDraftSessionVisual(targetChatSessionId) {
  const normalized = String(targetChatSessionId || '').trim()
  if (!normalized) return
  const draft = sessionVisualStore.value[SESSION_VISUAL_DRAFT_KEY]
  if (!draft || sessionVisualStore.value[normalized]) return
  persistSessionVisualStore({
    ...sessionVisualStore.value,
    [normalized]: {
      steps: cloneStreamSteps(draft.steps),
      stepsCollapsed: Boolean(draft.stepsCollapsed),
      updatedAt: Date.now(),
    },
  })
}

function toggleStreamStepsCollapsed() {
  streamStepsCollapsed.value = !streamStepsCollapsed.value
  saveSessionVisual()
}

function clearThinkingHideTimer() {
  if (!thinkingHideTimer) return
  clearTimeout(thinkingHideTimer)
  thinkingHideTimer = null
}

function setThinkingState(text) {
  const normalized = String(text || '').trim()
  clearThinkingHideTimer()
  if (!normalized) return
  thinkingText.value = normalized
  thinkingActive.value = true
  thinkingVisible.value = true
}

function collapseThinkingState({ delayMs = 460 } = {}) {
  if (!thinkingVisible.value) return
  thinkingActive.value = false
  clearThinkingHideTimer()
  thinkingHideTimer = setTimeout(() => {
    thinkingVisible.value = false
    thinkingText.value = ''
    thinkingHideTimer = null
  }, Math.max(0, Number(delayMs || 0)))
}

function resetThinkingState() {
  clearThinkingHideTimer()
  thinkingText.value = ''
  thinkingActive.value = false
  thinkingVisible.value = false
}

function buildConfirmationMessageId(payload = {}) {
  return String(payload.id || payload.callId || '').trim()
}

function buildConfirmationCallId(payload = {}) {
  return String(payload.callId || payload.id || '').trim()
}

const CONFIRMATION_LABEL_MAP = Object.freeze({
  'messages.confirmation.yesAllowOnce': 'Yes, allow once',
  'messages.confirmation.yesAllowAlways': 'Yes, allow always',
  'messages.confirmation.no': 'No (esc)',
})

function normalizeConfirmationLabel(label, fallback) {
  const raw = String(label || '').trim()
  if (!raw) return fallback
  return CONFIRMATION_LABEL_MAP[raw] || raw
}

function normalizeConfirmationOption(option, index) {
  if (!option || typeof option !== 'object') {
    return {
      label: `确认选项 ${index + 1}`,
      value: `option-${index + 1}`,
    }
  }
  const fallbackLabel = `确认选项 ${index + 1}`
  const label = normalizeConfirmationLabel(option.label, fallbackLabel)
  return {
    label,
    value: option.value ?? label,
  }
}

function normalizeConfirmationPayload(payload) {
  if (!payload || typeof payload !== 'object') return null
  const confirmationId = buildConfirmationMessageId(payload)
  const callId = buildConfirmationCallId(payload)
  if (!callId) return null
  const optionsRaw = Array.isArray(payload.options) ? payload.options : []
  const options = optionsRaw.map((item, index) => normalizeConfirmationOption(item, index))
  return {
    confirmationId: confirmationId || callId,
    callId,
    title: String(payload.title || '').trim(),
    description: String(payload.description || '').trim(),
    options,
  }
}

function upsertConfirmationMessage(payload) {
  const normalized = normalizeConfirmationPayload(payload)
  if (!normalized) return

  const existingIndex = messages.value.findIndex((item) => {
    if (item.kind !== 'confirmation') return false
    return item.confirmationId === normalized.confirmationId || item.callId === normalized.callId
  })

  if (existingIndex >= 0) {
    const current = messages.value[existingIndex]
    messages.value[existingIndex] = {
      ...current,
      ...normalized,
      submitting: false,
      resolved: false,
      resolvedLabel: '',
    }
    scrollToBottom()
    return
  }

  messages.value.push({
    role: 'assistant',
    kind: 'confirmation',
    ...normalized,
    submitting: false,
    resolved: false,
    resolvedLabel: '',
  })
  scrollToBottom()
}

function removeConfirmationMessage(payload) {
  const confirmationId = String(payload?.id || payload?.callId || '').trim()
  if (!confirmationId) return
  const before = messages.value.length
  messages.value = messages.value.filter((item) => {
    if (item.kind !== 'confirmation') return true
    return item.confirmationId !== confirmationId && item.callId !== confirmationId
  })
  if (messages.value.length !== before) {
    scrollToBottom()
  }
}

function findConfirmationMessageIndex(confirmationId, callId) {
  const normalizedId = String(confirmationId || '').trim()
  const normalizedCallId = String(callId || '').trim()
  return messages.value.findIndex((item) => {
    if (item.kind !== 'confirmation') return false
    if (normalizedId && item.confirmationId === normalizedId) return true
    if (normalizedCallId && item.callId === normalizedCallId) return true
    return false
  })
}

function clearStreamSteps({ save = true } = {}) {
  streamSteps.value = []
  streamStepsCollapsed.value = false
  if (save) {
    saveSessionVisual()
  }
}

function normalizeToolStatus(status) {
  const normalized = String(status || '').toLowerCase()
  if (!normalized) {
    return { key: 'running', label: 'Working' }
  }
  if (normalized === 'confirming' || normalized === 'pending' || normalized === 'executing' || normalized === 'running') {
    return { key: 'running', label: 'Working' }
  }
  if (normalized === 'success' || normalized === 'finished' || normalized === 'done') {
    return { key: 'success', label: 'Success' }
  }
  if (normalized === 'error' || normalized === 'failed') {
    return { key: 'error', label: 'Error' }
  }
  if (normalized === 'canceled' || normalized === 'cancelled') {
    return { key: 'canceled', label: 'Canceled' }
  }
  return {
    key: 'running',
    label: String(status || 'Working'),
  }
}

function upsertStreamStep({ id, title, description, status, details = [] }) {
  const normalizedId = String(id || '').trim()
  if (!normalizedId) return
  const normalizedTitle = String(title || 'Tool Step').trim() || 'Tool Step'
  const normalizedDescription = String(description || '').trim()
  const normalizedDetails = (Array.isArray(details) ? details : [])
    .map((line) => String(line || '').trim())
    .filter(Boolean)
    .slice(0, 4)
  const normalizedStatus = normalizeToolStatus(status)

  const index = streamSteps.value.findIndex((item) => item.id === normalizedId)
  if (index >= 0) {
    streamSteps.value[index] = {
      ...streamSteps.value[index],
      id: normalizedId,
      title: normalizedTitle,
      description: normalizedDescription,
      details: normalizedDetails,
      status: normalizedStatus.key,
      statusLabel: normalizedStatus.label,
    }
  } else {
    streamSteps.value.push({
      id: normalizedId,
      title: normalizedTitle,
      description: normalizedDescription,
      details: normalizedDetails,
      status: normalizedStatus.key,
      statusLabel: normalizedStatus.label,
    })
    if (streamSteps.value.length > MAX_STREAM_STEP_COUNT) {
      streamSteps.value = streamSteps.value.slice(streamSteps.value.length - MAX_STREAM_STEP_COUNT)
    }
  }
  saveSessionVisual()
  scrollToBottom()
}

function getThoughtDescription(payload) {
  if (!payload || typeof payload !== 'object') return ''
  if (typeof payload.data === 'string') return payload.data
  if (payload.data && typeof payload.data === 'object') {
    return String(payload.data.description || payload.data.content || '')
  }
  return ''
}

function getCodexToolDetails(payloadData = {}, toolCallId = '') {
  const details = []
  const nestedData = payloadData.data && typeof payloadData.data === 'object' ? payloadData.data : null
  const query = String(nestedData?.query || '').trim()
  if (query) {
    details.push(`Search Query: ${query}`)
  }
  if (toolCallId) {
    details.push(`Tool Call ID: ${toolCallId}`)
  }
  return details
}

function handleStreamSideEvent(payload) {
  if (!payload || typeof payload !== 'object') return

  if (payload.type === 'thought') {
    const thoughtText = getThoughtDescription(payload).trim()
    if (!thoughtText) return
    setThinkingState(thoughtText)
    return
  }

  if (thinkingActive.value) {
    collapseThinkingState({ delayMs: 420 })
  }

  if (payload.type === 'finish' || payload.type === 'finished') {
    collapseThinkingState({ delayMs: 260 })
    return
  }

  if (payload.type === 'codex_tool_call' && payload.data && typeof payload.data === 'object') {
    const toolCallId = String(payload.data.toolCallId || payload.msg_id || '').trim()
    const subtype = String(payload.data.subtype || '').trim().toLowerCase()
    const defaultTitle = subtype.startsWith('web_search') ? 'Web Search' : 'Tool Call'
    const title = String(payload.data.title || '').trim() || defaultTitle
    const description = String(payload.data.description || '').trim() || (
      subtype === 'web_search_begin'
        ? 'Web search in progress'
        : subtype === 'web_search_end'
          ? 'Web search completed'
          : ''
    )
    upsertStreamStep({
      id: toolCallId || `codex-tool-${String(payload.msg_id || Date.now())}`,
      title,
      description,
      status: String(payload.data.status || ''),
      details: getCodexToolDetails(payload.data, toolCallId),
    })
    return
  }

  if (payload.type !== 'tool_group') {
    return
  }

  const tools = Array.isArray(payload.data) ? payload.data : []
  for (const tool of tools) {
    const callId = String(tool?.callId || '').trim()
    if (!callId) continue
    const name = String(tool?.name || '').trim() || 'Tool Call'
    const description = String(tool?.description || '').trim()
    upsertStreamStep({
      id: callId,
      title: name,
      description: description || 'Tool execution',
      status: String(tool?.status || ''),
      details: [callId ? `Tool Call ID: ${callId}` : ''].filter(Boolean),
    })
  }
}

async function confirmToolAction(message, option) {
  const targetCallId = String(message?.callId || '').trim()
  const targetConfirmationId = String(message?.confirmationId || '').trim()
  const targetChatSessionId = String(chatSessionId.value || '').trim()
  if (!targetCallId || !targetChatSessionId) return

  let targetIndex = findConfirmationMessageIndex(targetConfirmationId, targetCallId)
  if (targetIndex < 0) return

  messages.value[targetIndex] = {
    ...messages.value[targetIndex],
    submitting: true,
  }

  try {
    await confirmAITool({
      chatSessionId: targetChatSessionId,
      callId: targetCallId,
      data: option?.value,
      msgId: message?.confirmationId || targetCallId,
    })
    targetIndex = findConfirmationMessageIndex(targetConfirmationId, targetCallId)
    if (targetIndex < 0) return
    messages.value[targetIndex] = {
      ...messages.value[targetIndex],
      submitting: false,
      resolved: true,
      resolvedLabel: String(option?.label || '已确认'),
    }
    scrollToBottom()
  } catch (error) {
    targetIndex = findConfirmationMessageIndex(targetConfirmationId, targetCallId)
    if (targetIndex >= 0) {
      messages.value[targetIndex] = {
        ...messages.value[targetIndex],
        submitting: false,
      }
    }
    const errorText = normalizeErrorText(error, '工具审批失败')
    messages.value.push({
      role: 'assistant',
      content: formatAssistantContent(`请求失败：${errorText}`),
      tone: 'answer',
    })
    scrollToBottom()
  }
}

async function hydrateSessionConfirmations(targetChatSessionId) {
  const normalizedChatSessionId = String(targetChatSessionId || '').trim()
  if (!normalizedChatSessionId) return

  try {
    const result = await fetchAIConfirmations(normalizedChatSessionId)
    const confirmations = Array.isArray(result?.confirmations) ? result.confirmations : []
    for (const item of confirmations) {
      upsertConfirmationMessage(item)
    }
  } catch {
    // Ignore hydration errors to avoid blocking chat loading.
  }
}

function stopConfirmationPolling() {
  if (!confirmationPollTimer) return
  clearInterval(confirmationPollTimer)
  confirmationPollTimer = null
}

function triggerConfirmationHydration() {
  const targetChatSessionId = String(chatSessionId.value || '').trim()
  if (!targetChatSessionId) return
  void hydrateSessionConfirmations(targetChatSessionId)
}

function startConfirmationPolling() {
  stopConfirmationPolling()
  triggerConfirmationHydration()
  confirmationPollTimer = setInterval(() => {
    if (!isTyping.value) {
      stopConfirmationPolling()
      return
    }
    triggerConfirmationHydration()
  }, CONFIRMATION_POLL_INTERVAL_MS)
}

function hasConfirmingToolGroup(payload) {
  if (!payload || payload.type !== 'tool_group' || !Array.isArray(payload.data)) {
    return false
  }
  return payload.data.some((tool) => {
    if (!tool || typeof tool !== 'object') return false
    const status = String(tool.status || '').toLowerCase()
    if (status === 'confirming') return true
    return Boolean(tool.confirmationDetails)
  })
}

const currentSession = computed(() =>
  sessionOptions.value.find((item) => item.chatSessionId === chatSessionId.value) || null
)

const currentSessionTitle = computed(() => currentSession.value?.title || '新会话')

const currentBackendName = computed(() => {
  const provider = catalogProviders.value.find((item) => (item.backendKey || item.backend) === selectedBackendKey.value)
  return provider?.name || normalizeBackendName(selectedBackend.value || selectedBackendKey.value)
})

const currentModelLabel = computed(() => {
  const model = modelOptions.value.find((item) => item.id === selectedModelId.value)
  return model?.label || selectedModelId.value || '默认模型'
})

const composerModelSelectStyle = computed(() => {
  const label = String(currentModelLabel.value || '默认模型')
  const width = Math.max(82, Math.min(122, Math.round(label.length * 7.5 + 24)))
  return { width: `${width}px` }
})

const activeModelKey = computed(() => {
  const backend = String(selectedBackend.value || '').toLowerCase()
  const backendKey = String(selectedBackendKey.value || '').toLowerCase()
  if (backend.includes('codex') || backendKey.includes('codex')) return 'codex'
  if (backend.includes('gemini') || backendKey.includes('gemini')) return 'gemini'
  return 'gemini'
})

const showWelcomeHero = computed(() => !messages.value.some((item) => item.role === 'user'))

const latestAssistantMessageIndex = computed(() => {
  for (let index = messages.value.length - 1; index >= 0; index -= 1) {
    const item = messages.value[index]
    if (item?.role === 'assistant' && item?.kind !== 'confirmation') {
      return index
    }
  }
  return -1
})

const sessionGroups = computed(() => {
  const pinned = []
  const today = []
  const yesterday = []
  const older = []
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  const startOfToday = new Date(new Date(now).setHours(0, 0, 0, 0)).getTime()
  const startOfYesterday = startOfToday - dayMs
  const pinnedOrder = new Map(pinnedSessionIds.value.map((id, index) => [id, index]))

  const sortedSessions = [...sessionOptions.value].sort((a, b) => Number(b?.updatedAt || 0) - Number(a?.updatedAt || 0))
  for (const item of sortedSessions) {
    const chatId = String(item?.chatSessionId || '')
    if (chatId && pinnedOrder.has(chatId)) {
      pinned.push(item)
      continue
    }

    const updatedAt = Number(item?.updatedAt || 0)
    if (updatedAt >= startOfToday) {
      today.push(item)
    } else if (updatedAt >= startOfYesterday) {
      yesterday.push(item)
    } else {
      older.push(item)
    }
  }

  pinned.sort((a, b) => {
    const aIndex = pinnedOrder.get(String(a?.chatSessionId || '')) ?? Number.MAX_SAFE_INTEGER
    const bIndex = pinnedOrder.get(String(b?.chatSessionId || '')) ?? Number.MAX_SAFE_INTEGER
    return aIndex - bIndex
  })

  return [
    { key: 'pinned', label: '置顶', items: pinned },
    { key: 'today', label: '今天', items: today },
    { key: 'yesterday', label: '昨天', items: yesterday },
    { key: 'older', label: '更早', items: older },
  ]
})

function normalizeBackendName(value) {
  const backend = String(value || '').toLowerCase()
  if (backend.includes('gemini')) return 'Gemini'
  if (backend.includes('codex')) return 'Codex'
  return backend || 'Unknown'
}

function getBackendClass(value) {
  const backend = String(value || '').toLowerCase()
  if (backend.includes('gemini')) return 'gemini'
  if (backend.includes('codex')) return 'codex'
  return 'generic'
}

function getBackendIcon(value) {
  const backendClass = getBackendClass(value)
  return BACKEND_ICON_MAP[backendClass] || BACKEND_ICON_MAP.generic
}

function matchProviderByBackend(provider, backendFamily) {
  const normalized = String(backendFamily || '').toLowerCase()
  const key = String(provider?.backendKey || '').toLowerCase()
  const backend = String(provider?.backend || '').toLowerCase()
  return key.includes(normalized) || backend.includes(normalized)
}

function switchBackend(backendFamily) {
  if (catalogLoading.value || isTyping.value) return
  const normalized = String(backendFamily || '').toLowerCase()
  if (!normalized || normalized === activeModelKey.value) return

  if (!catalogProviders.value.length) {
    startNewSession({ backendKey: normalized, typedGreeting: true })
    return
  }

  const provider = catalogProviders.value.find((item) => matchProviderByBackend(item, normalized))
  if (!provider) return

  const backendKey = provider.backendKey || provider.backend
  startNewSession({ backendKey, typedGreeting: true })
}

function handleModelChange() {
  if (catalogLoading.value || isTyping.value) return
  startNewSession({ typedGreeting: true })
}

function normalizeErrorText(error, fallback = 'AI 服务请求失败') {
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message || fallback)
  }
  return fallback
}

function readPinnedSessionIds() {
  try {
    const raw = window.localStorage.getItem(PINNED_SESSION_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return [...new Set(parsed.map((item) => String(item || '')).filter(Boolean))]
  } catch {
    return []
  }
}

function savePinnedSessionIds() {
  try {
    window.localStorage.setItem(PINNED_SESSION_STORAGE_KEY, JSON.stringify(pinnedSessionIds.value))
  } catch {
    // ignore storage errors
  }
}

function isSessionPinned(chatSessionId) {
  const normalizedId = String(chatSessionId || '')
  return normalizedId ? pinnedSessionIds.value.includes(normalizedId) : false
}

function togglePinSession(chatSessionId) {
  const normalizedId = String(chatSessionId || '')
  if (!normalizedId) return
  const next = [...pinnedSessionIds.value]
  const existingIndex = next.indexOf(normalizedId)
  if (existingIndex >= 0) {
    next.splice(existingIndex, 1)
  } else {
    next.unshift(normalizedId)
  }
  pinnedSessionIds.value = next
  savePinnedSessionIds()
}

function cleanPinnedSessionsByOptions() {
  const valid = new Set(sessionOptions.value.map((item) => String(item?.chatSessionId || '')).filter(Boolean))
  const filtered = pinnedSessionIds.value.filter((id) => valid.has(id))
  if (filtered.length === pinnedSessionIds.value.length) return
  pinnedSessionIds.value = filtered
  savePinnedSessionIds()
}

function closeSessionMenu() {
  sessionMenuId.value = ''
}

function toggleSessionMenu(chatSessionId) {
  const normalizedId = String(chatSessionId || '')
  if (!normalizedId) return
  sessionMenuId.value = sessionMenuId.value === normalizedId ? '' : normalizedId
}

function handleDocumentClick() {
  closeSessionMenu()
}

async function renameSessionByItem(session) {
  const chatId = String(session?.chatSessionId || '')
  if (!chatId) return
  const currentTitle = String(session?.title || '')
  const nextTitleInput = window.prompt('请输入新的会话标题', currentTitle)
  if (nextTitleInput == null) return
  const nextTitle = String(nextTitleInput).trim()
  if (!nextTitle) return

  try {
    await renameAISession(chatId, nextTitle)
    await loadSessionOptions()
  } catch (error) {
    const errorText = normalizeErrorText(error, '重命名会话失败')
    messages.value.push({
      role: 'assistant',
      content: formatAssistantContent(`请求失败：${errorText}`),
      tone: 'answer',
    })
    scrollToBottom()
  }
}

async function deleteSessionByItem(session) {
  const chatId = String(session?.chatSessionId || '')
  if (!chatId) return
  const ok = window.confirm('确认删除该会话及其历史消息？')
  if (!ok) return

  try {
    await deleteAISession(chatId)
    const nextVisualStore = { ...sessionVisualStore.value }
    delete nextVisualStore[String(chatId || '').trim()]
    persistSessionVisualStore(nextVisualStore)
    pinnedSessionIds.value = pinnedSessionIds.value.filter((item) => item !== chatId)
    savePinnedSessionIds()
    if (chatSessionId.value === chatId) {
      startNewSession({ typedGreeting: true })
    }
    await loadSessionOptions()
  } catch (error) {
    const errorText = normalizeErrorText(error, '删除会话失败')
    messages.value.push({
      role: 'assistant',
      content: formatAssistantContent(`请求失败：${errorText}`),
      tone: 'answer',
    })
    scrollToBottom()
  }
}

async function handleSessionMenuAction(action, session) {
  if (!session || isTyping.value) return
  if (action === 'pin') {
    togglePinSession(session.chatSessionId)
    closeSessionMenu()
    return
  }
  if (action === 'rename') {
    await renameSessionByItem(session)
    closeSessionMenu()
    return
  }
  if (action === 'delete') {
    await deleteSessionByItem(session)
    closeSessionMenu()
  }
}

function stopGreetingTyping() {
  if (greetingTimer) {
    clearInterval(greetingTimer)
    greetingTimer = null
  }
}

function pickRandomGreetingText() {
  if (!WELCOME_MESSAGE_POOL.length) {
    return '您好，我是您的智能防灾助手。\n\n请问有什么可以帮您？'
  }
  let index = Math.floor(Math.random() * WELCOME_MESSAGE_POOL.length)
  if (WELCOME_MESSAGE_POOL.length > 1 && index === lastGreetingIndex) {
    index = (index + 1) % WELCOME_MESSAGE_POOL.length
  }
  lastGreetingIndex = index
  return WELCOME_MESSAGE_POOL[index]
}

function setGreetingMessage({ typed = true } = {}) {
  stopGreetingTyping()
  const greetingText = pickRandomGreetingText()
  messages.value = [{ role: 'assistant', content: '', tone: 'greeting' }]
  if (!typed) {
    messages.value[0].content = formatAssistantContent(greetingText)
    messages.value[0].tone = 'greeting'
    scrollToBottom()
    return
  }

  let index = 0
  greetingTimer = setInterval(() => {
    const step = 2
    index += step
    const text = greetingText.slice(0, index)
    if (messages.value[0]) {
      messages.value[0].content = formatAssistantContent(text)
      messages.value[0].tone = 'greeting'
    }
    scrollToBottom()
    if (index >= greetingText.length) {
      stopGreetingTyping()
    }
  }, 16)
}

function applyHistoryMessages(historyMessages = [], { typedOnEmpty = false } = {}) {
  if (!Array.isArray(historyMessages) || historyMessages.length === 0) {
    setGreetingMessage({ typed: typedOnEmpty })
    return
  }

  stopGreetingTyping()
  messages.value = historyMessages.map((item) => ({
    role: item?.role === 'user' ? 'user' : 'assistant',
    content: item?.role === 'user'
      ? formatUserContent(item?.content || '')
      : formatAssistantContent(item?.content || ''),
    tone: item?.role === 'user' ? undefined : resolveAssistantMessageTone(item?.content || ''),
  }))
}

function readStoredChatSession() {
  try {
    const raw = window.localStorage.getItem(CHAT_SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return {
      chatSessionId: String(parsed.chatSessionId || ''),
      backendKey: String(parsed.backendKey || ''),
      modelId: String(parsed.modelId || ''),
    }
  } catch {
    return null
  }
}

function clearStoredChatSession() {
  try {
    window.localStorage.removeItem(CHAT_SESSION_STORAGE_KEY)
  } catch {
    // ignore storage errors
  }
}

function saveCurrentChatSession() {
  if (!chatSessionId.value) {
    clearStoredChatSession()
    return
  }

  try {
    window.localStorage.setItem(
      CHAT_SESSION_STORAGE_KEY,
      JSON.stringify({
        chatSessionId: chatSessionId.value,
        backendKey: selectedBackendKey.value || '',
        modelId: selectedModelId.value || '',
        updatedAt: Date.now(),
      })
    )
    selectedSessionId.value = chatSessionId.value
  } catch {
    // ignore storage errors
  }
}

async function fetchAllHistoryPages(targetChatSessionId) {
  if (!targetChatSessionId) return []

  let page = 1
  const allMessages = []

  while (true) {
    const result = await fetchChatHistory(targetChatSessionId, {
      page,
      pageSize: HISTORY_PAGE_SIZE,
    })
    const part = Array.isArray(result?.messages) ? result.messages : []
    allMessages.push(...part)
    if (!result?.hasMore) break
    page += 1
  }

  return allMessages
}

async function loadHistoryForSession(targetChatSessionId) {
  resetThinkingState()
  const historyMessages = await fetchAllHistoryPages(targetChatSessionId)
  chatSessionId.value = targetChatSessionId || null
  selectedSessionId.value = targetChatSessionId || ''

  if (chatSessionId.value) {
    saveCurrentChatSession()
  } else {
    clearStoredChatSession()
  }

  applyHistoryMessages(historyMessages, { typedOnEmpty: false })
  restoreSessionVisual(targetChatSessionId)
  await hydrateSessionConfirmations(targetChatSessionId)
  scrollToBottom()
}

async function loadSessionOptions() {
  if (sessionLoading.value) return
  sessionLoading.value = true

  try {
    let page = 1
    const all = []
    while (true) {
      const result = await fetchAISessions({
        page,
        pageSize: SESSION_PAGE_SIZE,
      })
      const batch = Array.isArray(result?.sessions) ? result.sessions : []
      all.push(...batch)
      if (!result?.hasMore) break
      page += 1
    }
    sessionOptions.value = all
    cleanPinnedSessionsByOptions()
    selectedSessionId.value = chatSessionId.value || ''
  } finally {
    sessionLoading.value = false
  }
}

async function restoreChatSessionIfExists() {
  const stored = readStoredChatSession()
  if (!stored?.chatSessionId) {
    await loadSessionOptions().catch(() => undefined)
    setGreetingMessage({ typed: true })
    restoreSessionVisual(null)
    return
  }

  if (stored.backendKey) {
    const hasStoredBackend = catalogProviders.value.some(
      (item) => (item.backendKey || item.backend) === stored.backendKey
    )
    if (hasStoredBackend) {
      selectedBackendKey.value = stored.backendKey
    }
  }

  const backendInfo = catalogProviders.value.find(
    (item) => (item.backendKey || item.backend) === selectedBackendKey.value
  )
  if (stored.modelId && Array.isArray(backendInfo?.models)) {
    const hasStoredModel = backendInfo.models.some((item) => item.id === stored.modelId)
    if (hasStoredModel) {
      selectedModelId.value = stored.modelId
    }
  }
  applyDefaultModelForBackend()

  try {
    await loadHistoryForSession(stored.chatSessionId)
    await loadSessionOptions().catch(() => undefined)
  } catch {
    startNewSession({ typedGreeting: false })
  }
}

function syncSelectionFromSession(session) {
  const backendKey = session?.backendKey || session?.backend || ''
  if (backendKey) {
    const hasBackend = catalogProviders.value.some((item) => (item.backendKey || item.backend) === backendKey)
    if (hasBackend) {
      selectedBackendKey.value = backendKey
      applyDefaultModelForBackend()
    }
  }

  const modelId = String(session?.modelId || '')
  if (modelId && modelOptions.value.some((item) => item.id === modelId)) {
    selectedModelId.value = modelId
  }
}

async function activateSession(session) {
  if (!session?.chatSessionId) {
    startNewSession()
    return
  }
  saveSessionVisual()
  closeSessionMenu()
  syncSelectionFromSession(session)
  try {
    await loadHistoryForSession(session.chatSessionId)
  } catch (error) {
    const errorText = normalizeErrorText(error, '读取会话失败')
    messages.value.push({
      role: 'assistant',
      content: formatAssistantContent(`请求失败：${errorText}`),
      tone: 'answer',
    })
    scrollToBottom()
  }
}

function startNewSession({ backendKey = '', typedGreeting = true } = {}) {
  saveSessionVisual()
  stopGreetingTyping()
  stopConfirmationPolling()
  resetThinkingState()
  chatSessionId.value = null
  selectedSessionId.value = ''
  clearStreamSteps({ save: true })
  closeSessionMenu()
  if (backendKey) {
    selectedBackendKey.value = backendKey
    applyDefaultModelForBackend()
  }
  applyHistoryMessages([], { typedOnEmpty: typedGreeting })
  clearStoredChatSession()
  inputText.value = ''
  resizeInput()
}

function toggleAIPanelExpand() {
  isAIPanelExpanded.value = !isAIPanelExpanded.value
  resizeInput()
  scrollToBottom()
}

function closeAIPanel() {
  showAIPanel.value = false
  isAIPanelExpanded.value = false
  resetThinkingState()
  closeSessionMenu()
}

// 切换AI面板
function toggleAIPanel() {
  showAIPanel.value = !showAIPanel.value
  if (showAIPanel.value) {
    store.closeFloatingPanel()
    if (!catalogProviders.value.length) {
      void loadAICatalog()
    }
    if (!sessionOptions.value.length) {
      void loadSessionOptions()
    }
    const hasUserMessage = messages.value.some((item) => item.role === 'user')
    if (!chatSessionId.value && !hasUserMessage) {
      setGreetingMessage({ typed: true })
    }
    resizeInput()
  } else {
    closeAIPanel()
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

function resizeInput() {
  nextTick(() => {
    if (!inputRef.value) return
    inputRef.value.style.height = '84px'
    inputRef.value.style.height = `${Math.min(inputRef.value.scrollHeight, 176)}px`
  })
}

// 发送消息
async function handleSend() {
  if (!inputText.value.trim() || isTyping.value) return
  sendMessage(inputText.value)
}

async function sendMessage(text) {
  stopGreetingTyping()
  resetThinkingState()
  const normalizedText = String(text || '').trim()
  if (!normalizedText) return

  if (!messages.value.some((item) => item.role === 'user') && messages.value.some((item) => item.tone === 'greeting')) {
    messages.value = []
  }

  // 用户发送
  messages.value.push({ role: 'user', content: formatUserContent(normalizedText) })
  inputText.value = ''
  resizeInput()
  scrollToBottom()

  isTyping.value = true
  startConfirmationPolling()
  const assistantIndex = messages.value.push({ role: 'assistant', content: '', loading: true }) - 1
  let streamReply = ''
  scrollToBottom()

  try {
    const result = await queryAI(normalizedText, (chunk) => {
      if (!chunk) return
      streamReply += chunk
      const bubble = messages.value[assistantIndex]
      if (!bubble) return
      bubble.loading = false
      bubble.content = formatAssistantContent(streamReply)
      bubble.tone = resolveAssistantMessageTone(streamReply)
      if (thinkingActive.value) {
        collapseThinkingState({ delayMs: 260 })
      }
      scrollToBottom()
    })

    const finalReply = String(result?.reply || streamReply || '暂无可用回复，请稍后重试。')
    if (messages.value[assistantIndex]) {
      messages.value[assistantIndex] = {
        role: 'assistant',
        content: formatAssistantContent(finalReply),
        tone: resolveAssistantMessageTone(finalReply),
      }
    } else {
      messages.value.push({
        role: 'assistant',
        content: formatAssistantContent(finalReply),
        tone: resolveAssistantMessageTone(finalReply),
      })
    }
  } catch (error) {
    const errorText = normalizeErrorText(error, 'AI 服务请求失败')
    if (messages.value[assistantIndex]) {
      messages.value[assistantIndex] = {
        role: 'assistant',
        content: formatAssistantContent(`请求失败：${errorText}`),
        tone: 'answer',
      }
    } else {
      messages.value.push({
        role: 'assistant',
        content: formatAssistantContent(`请求失败：${errorText}`),
        tone: 'answer',
      })
    }
  } finally {
    collapseThinkingState({ delayMs: 180 })
    isTyping.value = false
    stopConfirmationPolling()
    await loadSessionOptions().catch(() => undefined)
    scrollToBottom()
  }
}

function shouldUseSummaryApi(text) {
  return /(灾情.*(总结|摘要)|总结.*灾情|态势总结|生成摘要|当前灾情)/.test(text)
}

function buildSummarySnapshot() {
  const alertCount = Array.isArray(store.alerts) ? store.alerts.length : 0
  const maxTyphoonLevel = store.typhoonData?.intensity || store.typhoonData?.maxLevel || '未知'
  const affectedPopulation = Number(store.riskDecisions?.risks?.[0]?.affectedPopulation || 0)
  const evacuatedPopulation = Number(store.riskDecisions?.recommendations?.evacuatedPopulation || 0)

  return {
    alertCount,
    maxTyphoonLevel,
    affectedPopulation,
    evacuatedPopulation
  }
}

async function queryAI(text, onStreamChunk) {
  if (shouldUseSummaryApi(text)) {
    const response = await fetchCurrentSummary({
      region: 'gd',
      timeRange: '24h',
      detailLevel: 'standard',
      snapshot: buildSummarySnapshot(),
      selection: {
        backendKey: selectedBackendKey.value,
        backend: selectedBackend.value,
        modelId: selectedModelId.value
      }
    })

    return {
      chatSessionId: chatSessionId.value,
      reply: response?.summaryText || '暂无可用摘要，请稍后重试。',
    }
  }

  const response = await chatWithAIStream({
    chatSessionId: chatSessionId.value,
    message: text,
    context: {
      page: store.currentPage,
      region: 'gd'
    },
    selection: {
      backendKey: selectedBackendKey.value,
      backend: selectedBackend.value,
      modelId: selectedModelId.value
    },
    onMeta: (payload) => {
      const nextChatSessionId = String(payload?.chatSessionId || '').trim()
      if (!nextChatSessionId) return
      migrateDraftSessionVisual(nextChatSessionId)
      chatSessionId.value = nextChatSessionId
      selectedSessionId.value = nextChatSessionId
      saveCurrentChatSession()
      saveSessionVisual(nextChatSessionId)
      triggerConfirmationHydration()
    },
    onDelta: onStreamChunk,
    onConfirmAdd: (payload) => {
      upsertConfirmationMessage(payload)
    },
    onConfirmUpdate: (payload) => {
      upsertConfirmationMessage(payload)
    },
    onConfirmRemove: (payload) => {
      removeConfirmationMessage(payload)
    },
    onStreamEvent: (payload) => {
      handleStreamSideEvent(payload)
      if (hasConfirmingToolGroup(payload)) {
        triggerConfirmationHydration()
      }
    },
  })

  if (response?.chatSessionId) {
    chatSessionId.value = response.chatSessionId
    selectedSessionId.value = response.chatSessionId
    if (response?.selection?.backendKey) {
      selectedBackendKey.value = response.selection.backendKey
    }
    if (response?.selection?.modelId && modelOptions.value.some((item) => item.id === response.selection.modelId)) {
      selectedModelId.value = response.selection.modelId
    }
    saveCurrentChatSession()
  }

  return {
    chatSessionId: response?.chatSessionId || chatSessionId.value,
    reply: response?.reply || '暂无可用回复，请稍后重试。'
  }
}

function applyDefaultModelForBackend() {
  const options = modelOptions.value
  if (!options.length) {
    selectedModelId.value = ''
    return
  }

  const stillExists = options.some(item => item.id === selectedModelId.value)
  if (stillExists) {
    return
  }
  selectedModelId.value = options[0].id
}

async function loadAICatalog() {
  if (catalogLoading.value) return

  catalogLoading.value = true
  try {
    const result = await fetchAICatalog()
    const providers = (Array.isArray(result?.providers) ? result.providers : [])
      .filter(item => allowedBackends.has(item?.backend))
    catalogProviders.value = providers

    if (!providers.length) {
      selectedBackendKey.value = ''
      selectedModelId.value = ''
      return
    }

    const preferredBackend = providers.some(item => (item.backendKey || item.backend) === result?.lastSelectedAgent)
      ? result.lastSelectedAgent
      : (providers[0].backendKey || providers[0].backend)

    selectedBackendKey.value = preferredBackend
    const backendInfo = providers.find(item => (item.backendKey || item.backend) === preferredBackend)
    const preferredModelId = backendInfo?.currentModelId || ''
    const hasPreferred = Array.isArray(backendInfo?.models) && backendInfo.models.some(item => item.id === preferredModelId)
    selectedModelId.value = hasPreferred ? preferredModelId : ''
    applyDefaultModelForBackend()
  } catch (_error) {
    if (!catalogProviders.value.length) {
      catalogProviders.value = [
        { backendKey: 'gemini', backend: 'gemini', name: 'Gemini CLI', models: [] },
        { backendKey: 'codex', backend: 'codex', name: 'Codex CLI', models: [] }
      ]
      selectedBackendKey.value = 'gemini'
      selectedModelId.value = ''
    }
  } finally {
    catalogLoading.value = false
  }
}

onMounted(() => {
  pinnedSessionIds.value = readPinnedSessionIds()
  document.addEventListener('click', handleDocumentClick)
  void loadAICatalog()
    .finally(() => restoreChatSessionIfExists())
    .finally(() => loadSessionOptions().catch(() => undefined))
  resizeInput()
})

onBeforeUnmount(() => {
  saveSessionVisual()
  stopGreetingTyping()
  stopConfirmationPolling()
  clearThinkingHideTimer()
  document.removeEventListener('click', handleDocumentClick)
})

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatUserContent(text) {
  return escapeHtml(text).replace(/\n/g, '<br>')
}

function resolveAssistantMessageTone(text) {
  const raw = String(text || '').trim()
  if (!raw) return 'answer'
  const compact = raw.replace(/\s+/g, ' ').trim()
  const enPlanCount = (compact.match(/\bI will\b/gi) || []).length
  const zhPlanCount = (compact.match(/(我将|我会|接下来我会|先为您)/g) || []).length
  const hasToolVerb = /(search|verify|check|look up|google|查询|检索|搜索|核实)/i.test(compact)
  const sentenceCount = (compact.match(/[.!?。！？]/g) || []).length
  if ((enPlanCount >= 2 || zhPlanCount >= 2) && hasToolVerb && sentenceCount >= 2) {
    return 'thought'
  }
  return 'answer'
}

function applyInlineMarkdown(escapedText) {
  let html = String(escapedText || '')
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_match, label, url) => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`
  )
  html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>')
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
  return html
}

function formatAssistantContent(text) {
  const source = String(text || '').replace(/\r\n/g, '\n')
  if (!source.trim()) return ''

  const codeBlocks = []
  const tokenToBlock = new Map()
  const withCodeTokens = source.replace(/```([\w-]*)\n([\s\S]*?)```/g, (_full, lang, code) => {
    const token = `@@CODE_BLOCK_${codeBlocks.length}@@`
    const normalizedLang = escapeHtml(String(lang || '').trim().toLowerCase())
    const safeCode = escapeHtml(String(code || '').replace(/\n$/, ''))
    const langClass = normalizedLang ? `language-${normalizedLang}` : ''
    const html = `<pre class="md-code-block"><code class="${langClass}">${safeCode}</code></pre>`
    const block = { token, html }
    codeBlocks.push(block)
    tokenToBlock.set(token, block)
    return `\n${token}\n`
  })

  const output = []
  let paragraph = []
  let listItems = []

  const flushParagraph = () => {
    if (!paragraph.length) return
    const rendered = paragraph
      .map((line) => applyInlineMarkdown(escapeHtml(line)))
      .join('<br>')
    output.push(`<p>${rendered}</p>`)
    paragraph = []
  }

  const flushList = () => {
    if (!listItems.length) return
    output.push(`<ul>${listItems.map((item) => `<li>${item}</li>`).join('')}</ul>`)
    listItems = []
  }

  for (const rawLine of withCodeTokens.split('\n')) {
    const line = String(rawLine || '')
    const trimmed = line.trim()

    if (!trimmed) {
      flushParagraph()
      flushList()
      continue
    }

    if (tokenToBlock.has(trimmed)) {
      flushParagraph()
      flushList()
      output.push(trimmed)
      continue
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/)
    if (heading) {
      flushParagraph()
      flushList()
      const level = heading[1].length
      const content = applyInlineMarkdown(escapeHtml(heading[2]))
      output.push(`<h${level}>${content}</h${level}>`)
      continue
    }

    const listMatch = trimmed.match(/^[-*]\s+(.+)$/)
    if (listMatch) {
      flushParagraph()
      listItems.push(applyInlineMarkdown(escapeHtml(listMatch[1])))
      continue
    }

    paragraph.push(line)
  }

  flushParagraph()
  flushList()

  let html = output.join('')
  for (const block of codeBlocks) {
    html = html.replace(block.token, block.html)
  }

  if (!html) {
    return escapeHtml(source).replace(/\n/g, '<br>')
  }
  return html
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
  top: 0;
  transform: none;
  width: min(680px, calc(100vw - 96px));
  height: 600px;
  background: rgba(15, 23, 42, 0.95);
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

.halo-chat-dialog.expanded {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: min(1180px, calc(100vw - 64px));
  height: min(86vh, 920px);
  max-height: calc(100vh - 56px);
  z-index: 1400;
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
  padding: 14px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.session-btn {
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(167, 139, 250, 0.35);
  background: rgba(39, 22, 91, 0.45);
  color: #ede9fe;
  font-size: 13px;
  padding: 0 10px;
  cursor: pointer;
}

.session-btn:hover:not(:disabled) {
  background: rgba(109, 40, 217, 0.45);
}

.session-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.header-title {
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dialog-header-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.dialog-action-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: rgba(255, 255, 255, 0.45);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease, background 0.2s ease;
}

.expand-btn:hover {
  color: #cbd5e1;
  background: rgba(148, 163, 184, 0.22);
}

.close-btn:hover {
  color: #fff;
  background: rgba(239, 68, 68, 0.2);
}

.welcome-shell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 26px 20px 12px;
}

.welcome-title {
  margin: 0;
  color: #f8fafc;
  font-size: clamp(25px, 3vw, 32px);
  font-weight: 700;
  text-align: center;
  letter-spacing: 0.8px;
  line-height: 1.2;
}

.model-switcher {
  width: min(340px, 100%);
  background: rgba(15, 23, 42, 0.56);
  border: none;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 6px;
  box-shadow: none;
}

.model-switch-btn {
  border: none;
  background: transparent;
  color: rgba(226, 232, 240, 0.78);
  height: 40px;
  min-width: 40px;
  border-radius: 999px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  transition: color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease, padding 0.2s ease;
  padding: 0 12px;
}

.model-switch-btn:hover {
  color: #f8fafc;
}

.model-switch-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.model-switch-btn.active {
  color: #ffffff;
  background: rgba(148, 163, 184, 0.3);
  box-shadow: 0 0 0 1px rgba(203, 213, 225, 0.26);
}

.model-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.45);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.4);
}

.provider-icon {
  display: block;
  object-fit: contain;
}

.provider-icon-switch {
  width: 15px;
  height: 15px;
}

.model-label {
  display: inline-block;
  max-width: 0;
  margin-left: 0;
  opacity: 0;
  overflow: hidden;
  white-space: nowrap;
  transition: max-width 0.24s ease, opacity 0.24s ease, margin-left 0.24s ease;
}

.model-switch-btn.active .model-label {
  max-width: 108px;
  margin-left: 6px;
  opacity: 1;
}

.model-switch-btn:not(.active):hover .model-label {
  max-width: 108px;
  margin-left: 6px;
  opacity: 1;
}

.switch-divider {
  width: 1px;
  height: 22px;
  background: rgba(255, 255, 255, 0.22);
  margin: 0 6px;
  flex: 0 0 auto;
}

/* Messages */
.dialog-messages {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  margin: 0 16px 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-radius: 14px;
  border: 1px solid rgba(139, 92, 246, 0.16);
  background: rgba(2, 6, 20, 0.4);
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

.stream-step-panel {
  margin: 4px 0 0;
  padding: 0;
  border: none;
  background: transparent;
}

.stream-step-toggle {
  border: none;
  background: transparent;
  color: rgba(148, 163, 184, 0.9);
  font-size: 11px;
  height: 22px;
  padding: 0 2px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.stream-step-toggle:hover {
  color: rgba(203, 213, 225, 0.95);
}

.stream-step-list {
  margin-top: 4px;
  padding-right: 2px;
  max-height: 156px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stream-step-list::-webkit-scrollbar {
  width: 4px;
}

.stream-step-list::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.38);
  border-radius: 2px;
}

.stream-step-item {
  padding: 6px 8px;
  border-radius: 9px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(2, 6, 20, 0.25);
  opacity: 0.9;
}

.stream-step-item.is-running {
  border-color: rgba(125, 211, 252, 0.22);
}

.stream-step-item.is-success {
  border-color: rgba(110, 231, 183, 0.24);
}

.stream-step-item.is-error,
.stream-step-item.is-canceled {
  border-color: rgba(248, 113, 113, 0.24);
}

.stream-step-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.stream-step-title-wrap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.stream-step-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(148, 163, 184, 0.52);
  flex: 0 0 auto;
}

.stream-step-dot.is-running {
  background: rgba(125, 211, 252, 0.95);
  animation: stepDotPulse 1.2s ease-in-out infinite;
}

.stream-step-dot.is-success {
  background: #22c55e;
}

.stream-step-dot.is-error,
.stream-step-dot.is-canceled {
  background: rgba(248, 113, 113, 0.9);
}

.stream-step-title {
  color: rgba(226, 232, 240, 0.88);
  font-size: 12px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stream-step-status {
  color: rgba(148, 163, 184, 0.85);
  font-size: 11px;
  white-space: nowrap;
}

.stream-step-desc {
  margin-top: 4px;
  color: rgba(148, 163, 184, 0.9);
  font-size: 11px;
  line-height: 1.45;
}

.stream-step-detail {
  margin-top: 2px;
  color: rgba(148, 163, 184, 0.82);
  font-size: 11px;
  line-height: 1.4;
  word-break: break-word;
}

.halo-message {
  display: flex;
  gap: 10px;
  max-width: 92%;
  min-width: 0;
  font-size: 14px;
  line-height: 1.5;
}

.halo-message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.halo-message.is-plain-assistant {
  align-self: stretch;
  max-width: 100%;
  justify-content: center;
}

.halo-message.is-plain-assistant .msg-content {
  width: min(90%, 760px);
  padding: 0 6px;
  background: transparent;
  border: none;
  border-radius: 0;
  color: #e2e8f0;
  text-align: left;
  box-shadow: none;
  font-size: 15px;
  line-height: 1.72;
}

.halo-message.is-thought-trace .msg-content {
  width: min(90%, 760px);
  padding: 8px 4px;
  background: transparent;
  border: none;
  color: rgba(203, 213, 225, 0.9);
  font-size: 13px;
  line-height: 1.56;
}

.halo-message.is-greeting .msg-content {
  width: min(92%, 820px);
  text-align: center;
  font-size: 18px;
  line-height: 1.86;
}

.halo-message.assistant.is-confirmation .msg-content {
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
  max-width: 100%;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.message-markdown {
  word-break: break-word;
  overflow-wrap: anywhere;
}

.message-markdown p {
  margin: 0;
}

.message-markdown p + p {
  margin-top: 10px;
}

.message-markdown ul {
  margin: 8px 0 0;
  padding-left: 20px;
}

.message-markdown li + li {
  margin-top: 6px;
}

.message-markdown h1,
.message-markdown h2,
.message-markdown h3,
.message-markdown h4,
.message-markdown h5,
.message-markdown h6 {
  margin: 0 0 10px;
  font-weight: 700;
  line-height: 1.35;
}

.message-markdown h1 { font-size: 1.22em; }
.message-markdown h2 { font-size: 1.16em; }
.message-markdown h3 { font-size: 1.1em; }

.message-markdown code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.92em;
  background: rgba(15, 23, 42, 0.78);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 6px;
  padding: 1px 5px;
}

.message-markdown .md-code-block {
  margin: 10px 0 0;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(2, 6, 20, 0.7);
  overflow-x: hidden;
}

.message-markdown .md-code-block code {
  background: transparent;
  border: none;
  padding: 0;
  font-size: 12px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-markdown a {
  color: #93c5fd;
  text-decoration: underline;
}

.halo-chat-dialog.expanded .halo-message.is-plain-assistant .msg-content {
  width: min(92%, 900px);
  font-size: 18px;
  line-height: 1.82;
}

.halo-chat-dialog.expanded .halo-message.is-greeting .msg-content {
  width: min(92%, 980px);
  font-size: 24px;
  line-height: 1.95;
}

.thinking-strip {
  margin: 0 16px 8px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(2, 6, 20, 0.24);
  display: flex;
  align-items: flex-start;
  gap: 8px;
  opacity: 0.88;
}

.thinking-strip.active {
  opacity: 1;
}

.thinking-strip-icon {
  width: 8px;
  height: 8px;
  margin-top: 6px;
  border-radius: 50%;
  background: rgba(125, 211, 252, 0.95);
  flex: 0 0 auto;
  animation: stepDotPulse 1.2s ease-in-out infinite;
}

.thinking-strip-content {
  min-width: 0;
}

.thinking-strip-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: rgba(148, 163, 184, 0.9);
  font-size: 11px;
  line-height: 1.3;
}

.thinking-strip-text {
  margin-top: 3px;
  color: rgba(203, 213, 225, 0.95);
  font-size: 12px;
  line-height: 1.45;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.thinking-dots {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.thinking-dots i {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(148, 163, 184, 0.92);
  animation: thinkingDotPulse 1.1s ease-in-out infinite;
}

.thinking-dots i:nth-child(2) {
  animation-delay: 0.2s;
}

.thinking-dots i:nth-child(3) {
  animation-delay: 0.4s;
}

.confirm-card-title {
  font-size: 13px;
  font-weight: 600;
  color: #f8fafc;
}

.confirm-card-desc {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(226, 232, 240, 0.9);
}

.confirm-card-actions {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.confirm-card-action-btn {
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.38);
  background: rgba(15, 23, 42, 0.65);
  color: #e2e8f0;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.confirm-card-action-btn:hover:not(:disabled) {
  border-color: rgba(139, 92, 246, 0.72);
  color: #ede9fe;
  background: rgba(76, 29, 149, 0.3);
}

.confirm-card-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.confirm-card-result {
  margin-top: 8px;
  font-size: 12px;
  color: rgba(125, 211, 252, 0.9);
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

.provider-icon-assistant {
  width: 14px;
  height: 14px;
  filter: drop-shadow(0 0 4px rgba(139, 92, 246, 0.4));
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
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  margin: 16px;
  margin-top: 0;
}

.halo-search-input .input-wrapper {
  position: relative;
  z-index: 2;
  width: 100%;
}

.halo-search-input .composer-inline-toolbar {
  position: absolute;
  left: 16px;
  right: 60px;
  bottom: 10px;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  pointer-events: none;
}

.halo-search-input .composer-model-select-wrap {
  position: relative;
  max-width: min(124px, 42%);
  pointer-events: auto;
}

.halo-search-input .composer-model-select {
  width: 100%;
  height: 24px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.32);
  background: rgba(3, 6, 18, 0.86);
  color: rgba(241, 245, 249, 0.96);
  font-size: 11px;
  padding: 0 20px 0 8px;
  appearance: none;
  outline: none;
  box-shadow: none;
}

.halo-search-input .composer-model-select:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.halo-search-input .composer-model-chevron {
  position: absolute;
  right: 7px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 9px;
  color: rgba(226, 232, 240, 0.78);
  pointer-events: none;
}

.halo-search-input .search-field {
  background-color: #010201;
  border: none;
  width: 100%;
  min-height: 56px;
  max-height: 152px;
  border-radius: 10px;
  color: white;
  padding-right: 54px;
  padding-left: 16px;
  padding-top: 13px;
  padding-bottom: 38px;
  font-size: 14px;
  line-height: 1.55;
  resize: none;
  overflow-y: auto;
  font-family: inherit;
}

.halo-search-input .search-field::placeholder {
  color: #c0b9c0;
}

.halo-search-input .search-field:focus {
  outline: none;
}

.halo-search-input .send-btn {
  position: absolute;
  top: 50%;
  right: 4px;
  transform: translateY(-50%);
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
  position: absolute;
  inset: -4px;
  height: auto;
  width: auto;
  overflow: hidden;
  z-index: 1;
  border-radius: 12px;
  filter: blur(3px);
  pointer-events: none;
}

.halo-search-input .inner-glow {
  inset: -1px;
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
  inset: 1px;
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
  inset: -2px;
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
  inset: -18px -20px;
  overflow: hidden;
  filter: blur(30px);
  opacity: 0.4;
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
  top: 50%;
  right: 3px;
  transform: translateY(-50%);
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

@keyframes stepDotPulse {
  0%, 100% {
    transform: scale(0.86);
    opacity: 0.55;
  }
  50% {
    transform: scale(1.04);
    opacity: 1;
  }
}

@keyframes thinkingDotPulse {
  0%, 80%, 100% {
    opacity: 0.35;
    transform: scale(0.8);
  }
  40% {
    opacity: 1;
    transform: scale(1);
  }
}

.ai-layout-shell {
  display: flex;
  flex-direction: row;
  min-width: 0;
  height: 100%;
}

.ai-session-sider {
  width: 200px;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(2, 6, 20, 0.42);
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.session-btn.new-session {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.sider-history {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding-right: 2px;
}

.sider-history::-webkit-scrollbar {
  width: 4px;
}

.sider-history::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}

.sider-group {
  margin-bottom: 8px;
}

.sider-group-title {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.48);
  margin: 0 4px 6px;
}

.sider-item-wrap {
  position: relative;
  margin-bottom: 4px;
}

.sider-item {
  width: 100%;
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 8px 30px 8px 8px;
  color: inherit;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  text-align: left;
}

.sider-item:hover:not(:disabled) {
  border-color: rgba(139, 92, 246, 0.35);
}

.sider-item.active {
  border-color: rgba(139, 92, 246, 0.6);
  background: rgba(139, 92, 246, 0.16);
}

.sider-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sider-item-menu-trigger {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border: 0;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(226, 232, 240, 0.7);
  background: rgba(15, 23, 42, 0.5);
  opacity: 0;
  cursor: pointer;
  transition: opacity 0.16s ease, background 0.16s ease, color 0.16s ease;
}

.sider-item-wrap:hover .sider-item-menu-trigger,
.sider-item-menu-trigger.open {
  opacity: 1;
}

.sider-item-menu-trigger:hover:not(:disabled) {
  background: rgba(139, 92, 246, 0.35);
  color: #fff;
}

.sider-item-menu-trigger:disabled {
  cursor: not-allowed;
}

.sider-item-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  min-width: 112px;
  background: rgba(2, 6, 20, 0.96);
  border: 1px solid rgba(139, 92, 246, 0.32);
  border-radius: 10px;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.38);
  padding: 6px;
  z-index: 8;
}

.sider-item-menu-option {
  width: 100%;
  border: none;
  background: transparent;
  color: #e2e8f0;
  border-radius: 8px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
  font-size: 12px;
  cursor: pointer;
}

.sider-item-menu-option:hover {
  background: rgba(139, 92, 246, 0.2);
}

.sider-item-menu-option.danger {
  color: #fca5a5;
}

.sider-item-menu-option.danger:hover {
  background: rgba(220, 38, 38, 0.24);
}

.sider-item-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.4);
}

.provider-icon-session {
  width: 13px;
  height: 13px;
}

.sider-item-text {
  display: flex;
  align-items: center;
  min-width: 0;
}

.sider-item-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sider-item-title {
  color: #e2e8f0;
  font-size: 12px;
  line-height: 1.2;
}

.sider-empty {
  color: rgba(255, 255, 255, 0.42);
  font-size: 12px;
  text-align: center;
  padding: 14px 8px;
}

.ai-chat-pane {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.header-title-wrap {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.header-subtitle {
  color: rgba(255, 255, 255, 0.55);
  font-size: 11px;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .floating-toolbar {
    left: 8px;
    top: 8px;
  }

  .halo-chat-dialog {
    position: fixed;
    left: 8px;
    right: 8px;
    top: 72px;
    width: auto;
    height: calc(100vh - 84px);
    max-height: 620px;
  }

  .halo-chat-dialog.expanded {
    left: 8px;
    right: 8px;
    top: 8px;
    transform: none;
    width: auto;
    height: calc(100vh - 16px);
    max-height: none;
  }

  .ai-layout-shell {
    flex-direction: column;
  }

  .ai-session-sider {
    width: auto;
    max-height: 42%;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .halo-search-input .composer-inline-toolbar {
    left: 14px;
    right: 56px;
    bottom: 9px;
  }

  .halo-search-input .composer-model-select-wrap {
    max-width: min(120px, 50%);
  }

  .sider-item-menu-trigger {
    opacity: 1;
  }

  .halo-message.is-plain-assistant .msg-content {
    width: 100%;
    padding: 0 4px;
  }

  .halo-message.is-greeting .msg-content {
    font-size: 16px;
    line-height: 1.8;
  }

  .halo-chat-dialog.expanded .halo-message.is-greeting .msg-content {
    font-size: 19px;
    line-height: 1.84;
  }

  .thinking-strip {
    margin: 0 12px 8px;
  }
}
</style>
