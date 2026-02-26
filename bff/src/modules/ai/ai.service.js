import { config } from '../../shared/config.js'
import { createId, createTraceId, normalizeErrorMessage, sleep } from '../../shared/utils.js'

export class AiService {
  constructor({ aionuiClient, sessionRepository, messageRepository }) {
    this.aionuiClient = aionuiClient
    this.sessionRepository = sessionRepository
    this.messageRepository = messageRepository
    this.conversationLocks = new Map()
    this.recyclerTimer = null
    this.releasingIdleSessions = false
  }

  async warmup() {
    await this.aionuiClient.ensureReady()
    this.startSessionRecycler()
  }

  shutdown() {
    if (this.recyclerTimer) {
      clearInterval(this.recyclerTimer)
      this.recyclerTimer = null
    }
  }

  startSessionRecycler() {
    if (this.recyclerTimer) return
    const intervalMs = Math.max(15_000, Number(config.ai.recycleScanIntervalMs || 60_000))
    void this.releaseIdleSessions().catch((error) => {
      console.warn('[ai-service] initial release idle sessions failed:', normalizeErrorMessage(error, 'release failed'))
    })
    this.recyclerTimer = setInterval(() => {
      void this.releaseIdleSessions().catch((error) => {
        console.warn('[ai-service] release idle sessions failed:', normalizeErrorMessage(error, 'release failed'))
      })
    }, intervalMs)

    if (typeof this.recyclerTimer.unref === 'function') {
      this.recyclerTimer.unref()
    }
  }

  async chat({ tenantId, userId, chatSessionId, message, context, selection }) {
    const traceId = createTraceId()
    const catalog = await this.aionuiClient.getAiCatalog()
    const resolvedSelection = this.aionuiClient.resolveConversationConfig(selection, catalog)

    const { session } = this.sessionRepository.getOrCreate({
      tenantId,
      userId,
      chatSessionId,
    })
    this.sessionRepository.markActive(session)
    this.sessionRepository.syncSelection(session, {
      backendKey: resolvedSelection.backendKey,
      backend: resolvedSelection.backend,
      modelId: resolvedSelection.modelId,
      providerId: resolvedSelection.providerId,
      customAgentId: resolvedSelection.customAgentId,
    })

    const reply = await this.runConversationTask(session.conversationId, async () => {
      const firstTurn = !session.initialized
      await this.ensureConversationReady(session, resolvedSelection)

      const input = this.buildChatInput({ message, context })

      try {
        const content = await this.aionuiClient.ask({
          conversationId: session.conversationId,
          input,
          timeouts: config.ai,
        })
        return content
      } catch (error) {
        if (this.shouldRetryAfterCreate(error, firstTurn)) {
          session.initialized = false
          await this.ensureConversationReady(session, resolvedSelection)
          return this.aionuiClient.ask({
            conversationId: session.conversationId,
            input,
            timeouts: config.ai,
          })
        }
        throw error
      }
    }).catch((error) => {
      this.sessionRepository.markError(session)
      throw error
    })

    const normalizedReply = (reply || '').trim()
    this.messageRepository.append({
      tenantId,
      userId,
      chatSessionId: session.chatSessionId,
      role: 'user',
      content: message,
      traceId,
    })
    this.messageRepository.append({
      tenantId,
      userId,
      chatSessionId: session.chatSessionId,
      role: 'assistant',
      content: normalizedReply,
      traceId,
    })

    return {
      chatSessionId: session.chatSessionId,
      reply: normalizedReply,
      traceId,
      selection: {
        backendKey: session.backendKey,
        backend: session.backend,
        modelId: session.modelId,
        providerId: session.providerId,
        customAgentId: session.customAgentId,
      },
    }
  }

  async releaseIdleSessions() {
    if (this.releasingIdleSessions) return
    this.releasingIdleSessions = true

    try {
      const idleBefore = Date.now() - Math.max(60_000, Number(config.ai.sessionIdleReleaseMs || 30 * 60 * 1000))
      const targets = this.sessionRepository.listIdleSessions({ idleBefore })
      if (!targets.length) return

      for (const session of targets) {
        if (this.conversationLocks.has(session.conversationId)) {
          continue
        }

        try {
          await this.runConversationTask(session.conversationId, async () => {
            await this.aionuiClient.resetConversation({ conversationId: session.conversationId })
            this.sessionRepository.markReleased(session)
          })
        } catch (error) {
          console.warn(
            `[ai-service] release conversation failed: ${session.conversationId}`,
            normalizeErrorMessage(error, 'unknown error')
          )
        }
      }
    } finally {
      this.releasingIdleSessions = false
    }
  }

  async buildCurrentSummary({ region, timeRange, detailLevel, snapshot, selection }) {
    const traceId = createTraceId()
    const conversationId = createId()
    const catalog = await this.aionuiClient.getAiCatalog()
    const resolvedSelection = this.aionuiClient.resolveConversationConfig(selection, catalog)

    const summary = await this.runConversationTask(conversationId, async () => {
      await this.aionuiClient.createConversation({
        conversationId,
        selection: resolvedSelection,
      })
      await sleep(config.ai.createReadyDelayMs)

      const prompt = this.buildSummaryPrompt({
        region,
        timeRange,
        detailLevel,
        snapshot,
      })

      return this.aionuiClient.ask({
        conversationId,
        input: prompt,
        timeouts: config.ai,
      })
    })

    return {
      snapshot,
      summaryText: (summary || '').trim(),
      generatedAt: Date.now(),
      traceId,
      selection: {
        backendKey: resolvedSelection.backendKey,
        backend: resolvedSelection.backend,
        modelId: resolvedSelection.modelId,
        providerId: resolvedSelection.providerId,
        customAgentId: resolvedSelection.customAgentId,
      },
    }
  }

  listHistory({ tenantId, userId, chatSessionId }) {
    if (!chatSessionId) {
      return []
    }
    return this.messageRepository.list({ tenantId, userId, chatSessionId })
  }

  async listCatalog() {
    const catalog = await this.aionuiClient.getAiCatalog({ force: true })
    const agents = Array.isArray(catalog.agents) ? catalog.agents : []
    const modelProviders = Array.isArray(catalog.modelProviders) ? catalog.modelProviders : []
    const visibleBackends = new Set(config.ai.visibleBackends || [])

    const providers = agents
      .filter((agent) => visibleBackends.size === 0 || visibleBackends.has(agent.backend))
      .map((agent) => ({
        backendKey: agent.key || agent.backend,
        backend: agent.backend,
        name: agent.name,
        cliPath: agent.cliPath || '',
        customAgentId: agent.customAgentId || '',
        isPreset: !!agent.isPreset,
        presetAgentType: agent.presetAgentType || '',
        supportedTransports: agent.supportedTransports || [],
        models: Array.isArray(agent.cachedModelInfo?.availableModels) ? agent.cachedModelInfo.availableModels : [],
        currentModelId: agent.cachedModelInfo?.currentModelId || '',
      }))

    const fallbackSelectedAgent = providers[0]?.backendKey || providers[0]?.backend || ''
    const normalizedLastSelectedAgent = providers.some((item) => item.backendKey === catalog.lastSelectedAgent || item.backend === catalog.lastSelectedAgent)
      ? catalog.lastSelectedAgent || ''
      : fallbackSelectedAgent

    return {
      providers,
      modelProviders,
      lastSelectedAgent: normalizedLastSelectedAgent,
    }
  }

  buildChatInput({ message, context }) {
    if (!context || typeof context !== 'object') {
      return message
    }

    return [
      message,
      '',
      '【业务上下文】',
      JSON.stringify(context, null, 2),
      '请结合上下文回答，若上下文与问题冲突，以用户当前问题为准。',
    ].join('\n')
  }

  buildSummaryPrompt({ region, timeRange, detailLevel, snapshot }) {
    return [
      '你是广东省海洋灾害综合决策系统的应急研判助手。',
      '请严格基于给定 snapshot 生成中文摘要，不得编造任何数字。',
      `region=${region || 'gd'}`,
      `timeRange=${timeRange || '24h'}`,
      `detailLevel=${detailLevel || 'standard'}`,
      '',
      'snapshot=',
      JSON.stringify(snapshot || {}, null, 2),
      '',
      '输出要求：',
      '1. 输出 1 段 120-220 字摘要。',
      '2. 仅输出自然语言，不要 Markdown 标题和列表。',
      '3. 如果 snapshot 缺少关键字段，明确写“数据不足”，不要猜测。',
    ].join('\n')
  }

  shouldRetryAfterCreate(error, firstTurn) {
    if (!firstTurn) {
      return false
    }

    const message = normalizeErrorMessage(error, '')
    return (
      message.includes('conversation not found') ||
      message.includes('首包超时') ||
      message.includes('请求失败')
    )
  }

  async ensureConversationReady(session, resolvedSelection) {
    if (session.initialized) {
      return
    }

    await this.aionuiClient.createConversation({
      conversationId: session.conversationId,
      selection: resolvedSelection,
    })
    await sleep(config.ai.createReadyDelayMs)
    this.sessionRepository.markInitialized(session)
  }

  runConversationTask(conversationId, task) {
    const previous = this.conversationLocks.get(conversationId) || Promise.resolve()

    const current = previous
      .catch(() => {
        // 避免前一个任务失败导致队列断裂
      })
      .then(task)

    this.conversationLocks.set(conversationId, current)

    return current.finally(() => {
      if (this.conversationLocks.get(conversationId) === current) {
        this.conversationLocks.delete(conversationId)
      }
    })
  }
}
