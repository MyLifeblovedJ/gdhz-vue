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
    this.evictOverflowSessions({ tenantId, userId, keepChatSessionId: session.chatSessionId })
    this.sessionRepository.ensureTitle(session, message, config.ai.sessionTitleMaxLength)
    this.sessionRepository.syncSelection(session, {
      backendKey: resolvedSelection.backendKey,
      backend: resolvedSelection.backend,
      modelId: resolvedSelection.modelId,
      providerId: resolvedSelection.providerId,
      customAgentId: resolvedSelection.customAgentId,
    })
    const shouldConsumeRestore = !!session.needsRestore
    const input = this.buildChatInputWithHistoryContext({
      tenantId,
      userId,
      chatSessionId: session.chatSessionId,
      message,
      context,
      needsRestore: shouldConsumeRestore,
    })

    const reply = await this.runConversationTask(session.conversationId, async () => {
      const firstTurn = !session.initialized
      return this.executeChatWithRecovery({
        session,
        resolvedSelection,
        input,
        firstTurn,
        requestFn: () =>
          this.aionuiClient.ask({
            conversationId: session.conversationId,
            input,
            timeouts: config.ai,
          }),
      })
    }).catch((error) => {
      this.sessionRepository.markError(session)
      throw error
    })

    if (shouldConsumeRestore) {
      this.sessionRepository.markRestoreConsumed(session)
    }

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

  async chatStream({ tenantId, userId, chatSessionId, message, context, selection, onChunk, onEvent, onMeta }) {
    const traceId = createTraceId()
    const catalog = await this.aionuiClient.getAiCatalog()
    const resolvedSelection = this.aionuiClient.resolveConversationConfig(selection, catalog)

    const { session } = this.sessionRepository.getOrCreate({
      tenantId,
      userId,
      chatSessionId,
    })
    this.sessionRepository.markActive(session)
    this.evictOverflowSessions({ tenantId, userId, keepChatSessionId: session.chatSessionId })
    this.sessionRepository.ensureTitle(session, message, config.ai.sessionTitleMaxLength)
    this.sessionRepository.syncSelection(session, {
      backendKey: resolvedSelection.backendKey,
      backend: resolvedSelection.backend,
      modelId: resolvedSelection.modelId,
      providerId: resolvedSelection.providerId,
      customAgentId: resolvedSelection.customAgentId,
    })
    const shouldConsumeRestore = !!session.needsRestore
    const input = this.buildChatInputWithHistoryContext({
      tenantId,
      userId,
      chatSessionId: session.chatSessionId,
      message,
      context,
      needsRestore: shouldConsumeRestore,
    })
    if (typeof onMeta === 'function') {
      onMeta({
        chatSessionId: session.chatSessionId,
      })
    }

    this.messageRepository.append({
      tenantId,
      userId,
      chatSessionId: session.chatSessionId,
      role: 'user',
      content: message,
      traceId,
    })

    let reply = ''
    try {
      reply = await this.runConversationTask(session.conversationId, async () => {
        const firstTurn = !session.initialized
        return this.executeChatWithRecovery({
          session,
          resolvedSelection,
          input,
          firstTurn,
          requestFn: () =>
            this.aionuiClient.askStream({
              conversationId: session.conversationId,
              input,
              timeouts: config.ai,
              onChunk,
              onEvent: (eventPayload) => {
                if (typeof onEvent !== 'function') return
                onEvent({
                  ...(eventPayload && typeof eventPayload === 'object' ? eventPayload : {}),
                  chatSessionId: session.chatSessionId,
                })
              },
            }),
        })
      })
    } catch (error) {
      this.sessionRepository.markError(session)
      const errorText = normalizeErrorMessage(error, 'AI 服务请求失败')
      this.messageRepository.append({
        tenantId,
        userId,
        chatSessionId: session.chatSessionId,
        role: 'assistant',
        content: `请求失败：${errorText}`,
        traceId,
      })
      throw error
    }

    if (shouldConsumeRestore) {
      this.sessionRepository.markRestoreConsumed(session)
    }

    const normalizedReply = (reply || '').trim()
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

  getSessionById({ tenantId, userId, chatSessionId }) {
    if (!chatSessionId) return null
    return this.sessionRepository.get({ tenantId, userId, chatSessionId })
  }

  async listConfirmations({ tenantId, userId, chatSessionId }) {
    const session = this.getSessionById({ tenantId, userId, chatSessionId })
    if (!session) {
      return []
    }
    return this.aionuiClient.listConfirmations({
      conversationId: session.conversationId,
    })
  }

  async confirm({ tenantId, userId, chatSessionId, callId, data, msgId }) {
    const session = this.getSessionById({ tenantId, userId, chatSessionId })
    if (!session) {
      throw new Error('会话不存在')
    }
    this.sessionRepository.markActive(session)
    return this.aionuiClient.confirmMessage({
      conversationId: session.conversationId,
      msgId: msgId || callId,
      callId,
      data,
    })
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

  listHistory({ tenantId, userId, chatSessionId, page = 1, pageSize = 200 }) {
    if (!chatSessionId) {
      return {
        messages: [],
        page: 1,
        pageSize: Number(pageSize || 200),
        total: 0,
        hasMore: false,
      }
    }
    return this.messageRepository.listPaginated({
      tenantId,
      userId,
      chatSessionId,
      page,
      pageSize,
    })
  }

  listSessions({ tenantId, userId, page = 1, pageSize = 20 }) {
    const sessionsPage = this.sessionRepository.listByUser({
      tenantId,
      userId,
      page,
      pageSize,
    })

    const sessions = sessionsPage.data.map((session) => ({
      chatSessionId: session.chatSessionId,
      title: session.title || '未命名会话',
      status: session.status,
      backendKey: session.backendKey,
      backend: session.backend,
      modelId: session.modelId,
      updatedAt: session.updatedAt,
      lastActiveAt: session.lastActiveAt,
      createdAt: session.createdAt,
      messageCount: this.messageRepository.count({
        tenantId,
        userId,
        chatSessionId: session.chatSessionId,
      }),
    }))

    return {
      sessions,
      page: sessionsPage.page,
      pageSize: sessionsPage.pageSize,
      total: sessionsPage.total,
      hasMore: sessionsPage.hasMore,
    }
  }

  renameSession({ tenantId, userId, chatSessionId, title }) {
    const session = this.sessionRepository.get({ tenantId, userId, chatSessionId })
    if (!session) {
      return null
    }
    const ok = this.sessionRepository.updateTitle(session, title, config.ai.sessionTitleMaxLength)
    if (!ok) {
      return null
    }
    return {
      chatSessionId: session.chatSessionId,
      title: session.title,
      updatedAt: session.updatedAt,
    }
  }

  async removeSession({ tenantId, userId, chatSessionId }) {
    const session = this.sessionRepository.removeSession({
      tenantId,
      userId,
      chatSessionId,
    })
    if (!session) {
      return false
    }
    this.messageRepository.deleteBySession({
      tenantId,
      userId,
      chatSessionId,
    })

    await this.removeConversationWithFallback({ conversationId: session.conversationId })
    return true
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

  buildChatInputWithHistoryContext({ tenantId, userId, chatSessionId, message, context, needsRestore }) {
    const baseInput = this.buildChatInput({ message, context })
    if (!needsRestore) {
      return baseInput
    }

    const historyPrefix = this.buildHistoryContext({
      tenantId,
      userId,
      chatSessionId,
      maxTurns: config.ai.historyRecallMaxTurns,
      maxCharsPerMessage: config.ai.historyRecallMaxCharsPerMsg,
      maxTotalChars: config.ai.historyRecallMaxTotalChars,
    })

    if (!historyPrefix) {
      return baseInput
    }

    return `${historyPrefix}\n\n${baseInput}`
  }

  buildHistoryContext({
    tenantId,
    userId,
    chatSessionId,
    maxTurns = config.ai.historyRecallMaxTurns,
    maxCharsPerMessage = config.ai.historyRecallMaxCharsPerMsg,
    maxTotalChars = config.ai.historyRecallMaxTotalChars,
  }) {
    const turns = Math.max(0, Number(maxTurns || 0))
    if (!turns) {
      return ''
    }

    const perMessageLimit = Math.max(80, Number(maxCharsPerMessage || 500))
    const totalLimit = Math.max(500, Number(maxTotalChars || 6000))
    const history = this.messageRepository.listRecent({
      tenantId,
      userId,
      chatSessionId,
      limit: turns * 2,
    })

    if (!history.length) {
      return ''
    }

    const lines = ['【以下是你与用户此前的对话片段，请结合上下文继续回答】']
    let totalChars = 0

    for (const item of history) {
      if (!item || typeof item !== 'object') continue
      const role = String(item.role || '')
      if (role !== 'user' && role !== 'assistant') continue

      let content = String(item.content || '').replace(/\s+/g, ' ').trim()
      if (!content) continue
      if (role === 'assistant' && content.startsWith('请求失败：')) continue

      if (content.length > perMessageLimit) {
        content = `${content.slice(0, perMessageLimit)}...`
      }

      const line = `[${role === 'assistant' ? 'AI' : '用户'}] ${content}`
      if ((totalChars + line.length) > totalLimit) {
        break
      }
      lines.push(line)
      totalChars += line.length
    }

    if (lines.length === 1) {
      return ''
    }

    lines.push('【以上是历史上下文，以下是用户当前问题】')
    return lines.join('\n')
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

  async executeChatWithRecovery({ session, resolvedSelection, input, firstTurn, requestFn }) {
    let selfHealRetried = false

    const requestWithReadyConversation = async () => {
      await this.ensureConversationReady(session, resolvedSelection)
      return requestFn()
    }

    try {
      return await requestWithReadyConversation()
    } catch (error) {
      if (this.shouldRetryAfterCreate(error, firstTurn)) {
        session.initialized = false
        try {
          await this.ensureConversationReady(session, resolvedSelection)
          return await requestFn()
        } catch (retryError) {
          if (!selfHealRetried && this.shouldSelfHealRetry(retryError)) {
            selfHealRetried = true
            return this.retryWithSelfHeal({ session, resolvedSelection, requestFn })
          }
          throw retryError
        }
      }

      if (!selfHealRetried && this.shouldSelfHealRetry(error)) {
        selfHealRetried = true
        return this.retryWithSelfHeal({ session, resolvedSelection, requestFn })
      }
      throw error
    }
  }

  async retryWithSelfHeal({ session, resolvedSelection, requestFn }) {
    session.conversationId = createId()
    session.initialized = false
    await this.ensureConversationReady(session, resolvedSelection)
    return requestFn()
  }

  shouldRetryAfterCreate(error, firstTurn) {
    if (!firstTurn) {
      return false
    }

    const message = normalizeErrorMessage(error, '')
    return (
      message.includes('create-conversation') ||
      message.includes('MCP server to be ready') ||
      message.includes('UNIQUE constraint failed: conversations.id') ||
      message.includes('conversation not found') ||
      message.includes('首包超时') ||
      message.includes('请求失败')
    )
  }

  shouldSelfHealRetry(error) {
    const message = normalizeErrorMessage(error, '')
    return (
      message.includes('conversation not found') ||
      message.includes('Conversation not found') ||
      message.includes('UNIQUE constraint failed: conversations.id')
    )
  }

  async removeConversationWithFallback({ conversationId }) {
    if (!conversationId) return
    try {
      await this.aionuiClient.removeConversation({ conversationId })
    } catch {
      try {
        await this.aionuiClient.resetConversation({ conversationId })
      } catch {
        // ignore cleanup errors
      }
    }
  }

  async ensureConversationReady(session, resolvedSelection) {
    if (session.initialized) {
      return
    }

    let lastError = null
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        await this.aionuiClient.createConversation({
          conversationId: session.conversationId,
          selection: resolvedSelection,
        })
        lastError = null
        break
      } catch (error) {
        lastError = error
        const message = normalizeErrorMessage(error, '')
        const canRetry =
          attempt === 0 &&
          (
            message.includes('create-conversation') ||
            message.includes('WebSocket') ||
            message.includes('连接')
          )

        if (!canRetry) {
          throw error
        }

        if (typeof this.aionuiClient.reconnectWebSocket === 'function') {
          try {
            await this.aionuiClient.reconnectWebSocket()
          } catch {
            // ignore reconnect failure and keep retrying create
          }
        }
        await sleep(300)
      }
    }

    if (lastError) {
      throw lastError
    }

    await sleep(config.ai.createReadyDelayMs)
    this.sessionRepository.markInitialized(session)
  }

  evictOverflowSessions({ tenantId, userId, keepChatSessionId }) {
    const overflow = this.sessionRepository.trimOverflowForUser({
      tenantId,
      userId,
      maxSessions: config.ai.maxSessionsPerUser,
      keepChatSessionId,
    })
    if (!overflow.length) return

    for (const session of overflow) {
      if (session.chatSessionId === keepChatSessionId) {
        continue
      }
      this.messageRepository.deleteBySession({
        tenantId,
        userId,
        chatSessionId: session.chatSessionId,
      })
      void this.aionuiClient
        .removeConversation({ conversationId: session.conversationId })
        .catch(() => this.aionuiClient.resetConversation({ conversationId: session.conversationId }))
        .catch(() => undefined)
    }
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
