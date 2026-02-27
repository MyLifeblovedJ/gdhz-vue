import EventEmitter from 'node:events'
import WebSocket from 'ws'
import { config } from '../../shared/config.js'
import { createId, normalizeErrorMessage, safeJsonParse } from '../../shared/utils.js'

function splitSetCookieHeader(headerValue) {
  if (!headerValue) return []

  const result = []
  let current = ''
  let inExpires = false

  for (let i = 0; i < headerValue.length; i += 1) {
    const char = headerValue[i]
    current += char

    const lower = current.toLowerCase()
    if (lower.endsWith('expires=')) {
      inExpires = true
    }

    if (inExpires && char === ';') {
      inExpires = false
    }

    if (!inExpires && char === ',') {
      current = current.slice(0, -1).trim()
      if (current) {
        result.push(current)
      }
      current = ''
    }
  }

  const tail = current.trim()
  if (tail) {
    result.push(tail)
  }

  return result
}

function parseCookie(setCookieLine) {
  const [pair] = String(setCookieLine || '').split(';')
  const index = pair.indexOf('=')
  if (index <= 0) return null
  const name = pair.slice(0, index).trim()
  const value = pair.slice(index + 1).trim()
  if (!name) return null
  return { name, value }
}

function buildBridgeRequestId(name) {
  return `${name}${Math.random().toString(16).slice(2, 10)}`
}

function buildGeminiGoogleAuthModel(useModel = 'default') {
  return {
    id: 'gemini-placeholder',
    name: 'Gemini',
    platform: 'gemini-with-google-auth',
    baseUrl: '',
    apiKey: '',
    useModel: useModel || 'default',
  }
}

export class AionUiClient {
  constructor({ catalogService } = {}) {
    this.events = new EventEmitter()
    this.events.setMaxListeners(200)

    this.cookieJar = new Map()
    this.token = ''
    this.csrfToken = ''

    this.socket = null
    this.connectingPromise = null
    this.loginPromise = null
    this.refreshPromise = null

    this.catalogService = catalogService
  }

  on(eventName, handler) {
    this.events.on(eventName, handler)
    return () => this.events.off(eventName, handler)
  }

  async ensureReady() {
    await this.ensureAuthenticated()
    await this.ensureWebSocket()
  }

  async ensureAuthenticated() {
    if (this.token) return
    await this.login()
  }

  async login() {
    if (this.loginPromise) return this.loginPromise

    this.loginPromise = (async () => {
      if (!config.aionui.password) {
        throw new Error('未配置 AIONUI_PASSWORD，无法登录 AionUi')
      }

      const response = await this.requestJson('/login', {
        body: {
          username: config.aionui.username,
          password: config.aionui.password,
        },
        withCsrf: false,
      })

      if (!response?.success || !response?.token) {
        throw new Error(normalizeErrorMessage(response, 'AionUi 登录失败'))
      }

      this.token = response.token
      return this.token
    })().finally(() => {
      this.loginPromise = null
    })

    return this.loginPromise
  }

  async refreshAuth() {
    if (this.refreshPromise) return this.refreshPromise

    this.refreshPromise = (async () => {
      try {
        if (!this.token) {
          await this.login()
          return this.token
        }

        const response = await this.requestJson('/api/auth/refresh', {
          body: { token: this.token },
          withCsrf: true,
        })

        if (!response?.success || !response?.token) {
          await this.login()
          return this.token
        }

        this.token = response.token
        return this.token
      } catch {
        await this.login()
        return this.token
      }
    })().finally(() => {
      this.refreshPromise = null
    })

    return this.refreshPromise
  }

  async ensureWebSocket() {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return
    }

    if (this.connectingPromise) {
      return this.connectingPromise
    }

    this.connectingPromise = (async () => {
      await this.ensureAuthenticated()

      const headers = {
        Authorization: `Bearer ${this.token}`,
      }

      const cookieHeader = this.buildCookieHeader()
      if (cookieHeader) {
        headers.Cookie = cookieHeader
      }

      await new Promise((resolve, reject) => {
        const ws = new WebSocket(config.aionui.wsUrl, { headers })
        let settled = false

        const timeout = setTimeout(() => {
          if (settled) return
          settled = true
          try {
            ws.terminate()
          } catch {
            // noop
          }
          reject(new Error('连接 AionUi WebSocket 超时'))
        }, 10_000)

        ws.once('open', () => {
          if (settled) return
          settled = true
          clearTimeout(timeout)
          this.socket = ws
          this.attachSocket(ws)
          resolve()
        })

        ws.once('error', (error) => {
          if (settled) return
          settled = true
          clearTimeout(timeout)
          reject(error)
        })
      })
    })().finally(() => {
      this.connectingPromise = null
    })

    return this.connectingPromise
  }

  attachSocket(ws) {
    ws.on('message', (raw) => {
      const payload = safeJsonParse(String(raw))
      if (!payload || typeof payload !== 'object') {
        return
      }

      const { name, data } = payload
      if (typeof name !== 'string') {
        return
      }

      if (name === 'ping') {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ name: 'pong', data: { timestamp: Date.now() } }))
        }
        return
      }

      if (name === 'auth-expired') {
        void this.handleAuthExpired()
        return
      }

      this.events.emit(name, data)
    })

    ws.on('close', () => {
      if (this.socket === ws) {
        this.socket = null
      }
    })

    ws.on('error', () => {
      if (this.socket === ws) {
        this.socket = null
      }
    })
  }

  async handleAuthExpired() {
    try {
      await this.refreshAuth()
      await this.reconnectWebSocket()
    } catch {
      this.events.emit('connection-error', new Error('AionUi 认证过期且重连失败'))
    }
  }

  async reconnectWebSocket() {
    if (this.socket) {
      try {
        this.socket.close()
      } catch {
        // noop
      }
      this.socket = null
    }
    await this.ensureWebSocket()
  }

  async getAiCatalog({ force = false } = {}) {
    if (!this.catalogService) {
      throw new Error('未配置 AionUi 目录服务')
    }
    return this.catalogService.getCatalog({ force })
  }

  resolveConversationConfig(selection = {}, catalog = {}) {
    const agents = Array.isArray(catalog.agents) ? catalog.agents : []
    const modelProviders = Array.isArray(catalog.modelProviders) ? catalog.modelProviders : []

    const requestedKey = selection.backendKey || selection.backend || config.aionui.defaultBackend
    const requestedBackend = selection.backend || config.aionui.defaultBackend
    const selectedAgent =
      agents.find((item) => item.key === requestedKey) ||
      agents.find((item) => item.backend === requestedKey) ||
      agents.find((item) => item.backend === selection.backend) ||
      agents[0] ||
      null
    const backend = selectedAgent?.backend || requestedBackend

    const preferredProviderId = selection.providerId || config.aionui.defaultProviderId
    const selectedProvider =
      modelProviders.find((item) => item.id === preferredProviderId) ||
      modelProviders.find((item) => item.id === selection.providerId) ||
      modelProviders[0] ||
      null

    const cachedModelInfo = selectedAgent?.cachedModelInfo || catalog.cachedModels?.[backend] || null
    const availableModels = Array.isArray(cachedModelInfo?.availableModels) ? cachedModelInfo.availableModels : []

    const presetAgentType = selectedAgent?.presetAgentType || ''
    let conversationType = 'acp'
    let routedBackend = backend

    if (backend === 'gemini') {
      conversationType = 'gemini'
    } else if (backend === 'codex') {
      conversationType = 'codex'
    } else if (backend === 'openclaw-gateway') {
      conversationType = 'openclaw-gateway'
    } else if (backend === 'nanobot') {
      conversationType = 'nanobot'
    } else if (backend === 'custom') {
      if (presetAgentType === 'gemini') {
        conversationType = 'gemini'
        routedBackend = 'gemini'
      } else if (presetAgentType === 'codex') {
        conversationType = 'codex'
        routedBackend = 'codex'
      } else if (presetAgentType === 'claude' || presetAgentType === 'codebuddy' || presetAgentType === 'opencode') {
        conversationType = 'acp'
        routedBackend = presetAgentType
      } else {
        conversationType = 'acp'
        routedBackend = 'custom'
      }
    }

    const requestedModelId = selection.modelId || config.aionui.defaultModelId
    const implicitDefaultModelId = conversationType === 'gemini' ? 'auto' : 'default'
    const fallbackModelId =
      requestedModelId ||
      cachedModelInfo?.currentModelId ||
      selectedProvider?.useModel ||
      availableModels[0]?.id ||
      implicitDefaultModelId

    // Keep Gemini default behavior aligned with AionUi:
    // when no explicit provider is selected, use Google Auth Gemini placeholder
    // instead of forcing an OpenAI-style API provider.
    const modelPayload = selectedProvider
      ? { ...selectedProvider, useModel: requestedModelId || selectedProvider.useModel || fallbackModelId }
      : conversationType === 'gemini'
        ? buildGeminiGoogleAuthModel(fallbackModelId)
        : {
            ...config.aionui.model,
            useModel: requestedModelId || config.aionui.model.useModel || fallbackModelId,
          }

    return {
      backendKey: selectedAgent?.key || backend,
      backend,
      routedBackend,
      conversationType,
      agentName: selectedAgent?.name || config.aionui.acpAgentName || '',
      cliPath: selectedAgent?.cliPath || '',
      customAgentId: selectedAgent?.customAgentId || '',
      isPreset: !!selectedAgent?.isPreset,
      presetContext: selectedAgent?.context || '',
      modelId: fallbackModelId,
      providerId: modelPayload?.id || selectedProvider?.id || config.aionui.model.id || '',
      modelPayload,
      selectedAgent,
    }
  }

  async createConversation({ conversationId, selection }) {
    await this.ensureReady()
    const catalog = await this.getAiCatalog()
    const resolved = this.resolveConversationConfig(selection, catalog)

    const name = `gdhz-${conversationId.slice(0, 8)}`
    const workspace = config.aionui.workspace || undefined

    let payload = null

    if (resolved.conversationType === 'gemini') {
      payload = {
        id: conversationId,
        type: 'gemini',
        name,
        model: resolved.modelPayload,
        extra: {
          workspace,
          webSearchEngine: 'default',
          presetRules: resolved.isPreset ? resolved.presetContext || undefined : undefined,
          presetAssistantId: resolved.isPreset ? resolved.customAgentId || undefined : undefined,
        },
      }
    } else if (resolved.conversationType === 'codex') {
      payload = {
        id: conversationId,
        type: 'codex',
        name,
        model: resolved.modelPayload,
        extra: {
          workspace,
          cliPath: resolved.cliPath || undefined,
          codexModel: resolved.modelId || undefined,
          presetContext: resolved.isPreset ? resolved.presetContext || undefined : undefined,
          presetAssistantId: resolved.isPreset ? resolved.customAgentId || undefined : undefined,
        },
      }
    } else if (resolved.conversationType === 'openclaw-gateway') {
      payload = {
        id: conversationId,
        type: 'openclaw-gateway',
        name,
        model: resolved.modelPayload,
        extra: {
          workspace,
          backend: 'openclaw-gateway',
          cliPath: resolved.cliPath || undefined,
          agentName: resolved.agentName || undefined,
        },
      }
    } else if (resolved.conversationType === 'nanobot') {
      payload = {
        id: conversationId,
        type: 'nanobot',
        name,
        model: resolved.modelPayload,
        extra: {
          workspace,
        },
      }
    } else {
      payload = {
        id: conversationId,
        type: 'acp',
        name,
        model: resolved.modelPayload,
        extra: {
          workspace,
          backend: resolved.routedBackend || resolved.backend,
          customAgentId: (resolved.routedBackend || resolved.backend) === 'custom' ? resolved.customAgentId || undefined : undefined,
          currentModelId: resolved.modelId,
          cliPath: resolved.cliPath || undefined,
          agentName: resolved.agentName || undefined,
          presetContext: resolved.isPreset ? resolved.presetContext || undefined : undefined,
          presetAssistantId: resolved.isPreset ? resolved.customAgentId || undefined : undefined,
        },
      }
    }

    // Callback reliability for create-conversation is not stable across providers;
    // send the command and rely on first-turn retry (`conversation not found`) in service layer.
    await this.invokeBridgeProvider('create-conversation', payload, {
      timeoutMs: Math.max(20_000, Number(config.ai.createConversationTimeoutMs || 60_000)),
      waitForCallback: false,
    })

    return {
      backend: resolved.backend,
      backendKey: resolved.backendKey,
      modelId: resolved.modelId,
      providerId: resolved.modelPayload?.id || '',
      agentName: resolved.agentName || '',
      availableModels: Array.isArray(resolved.selectedAgent?.cachedModelInfo?.availableModels)
        ? resolved.selectedAgent.cachedModelInfo.availableModels
        : [],
    }
  }

  async resetConversation({ conversationId }) {
    if (!conversationId) return
    await this.ensureReady()
    await this.invokeBridgeProvider(
      'reset-conversation',
      { id: conversationId },
      { timeoutMs: 10_000 }
    )
  }

  async emitBridgeEvent(name, data) {
    await this.ensureWebSocket()
    this.sendRaw({ name, data })
  }

  async invokeBridgeProvider(name, data, { timeoutMs = 20_000, waitForCallback = true } = {}) {
    await this.ensureWebSocket()

    const requestId = buildBridgeRequestId(name)
    const callbackEventName = `subscribe.callback-${name}${requestId}`
    const eventPayload = {
      id: requestId,
      data,
    }

    if (!waitForCallback) {
      this.sendRaw({
        name: `subscribe-${name}`,
        data: eventPayload,
      })
      return {
        success: true,
        requestId,
      }
    }

    return new Promise((resolve, reject) => {
      let finished = false
      let timeout = null

      const cleanup = () => {
        if (timeout) {
          clearTimeout(timeout)
          timeout = null
        }
        this.events.off(callbackEventName, onCallback)
      }

      const finish = (handler) => {
        if (finished) return
        finished = true
        cleanup()
        handler()
      }

      const onCallback = (callbackData) => {
        finish(() => {
          resolve(callbackData)
        })
      }

      this.events.on(callbackEventName, onCallback)

      timeout = setTimeout(() => {
        finish(() => {
          reject(new Error(`AionUi provider 调用超时: ${name}`))
        })
      }, timeoutMs)

      try {
        this.sendRaw({
          name: `subscribe-${name}`,
          data: eventPayload,
        })
      } catch (error) {
        finish(() => {
          reject(error)
        })
      }
    })
  }

  sendRaw(payload) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('AionUi WebSocket 未连接')
    }
    this.socket.send(JSON.stringify(payload))
  }

  async ask({ conversationId, input, timeouts }) {
    const msgId = createId()

    const replyPromise = this.waitForReply({
      conversationId,
      msgId,
      timeouts,
    })
    // waitForReply may reject before provider callback returns;
    // attach a sink handler early to avoid unhandled rejection crash.
    void replyPromise.catch(() => undefined)

    let sendResult = null
    try {
      sendResult = await this.invokeBridgeProvider(
        'chat.send.message',
        {
          input,
          msg_id: msgId,
          conversation_id: conversationId,
        },
        { waitForCallback: false }
      )
    } catch (error) {
      const message = normalizeErrorMessage(error, 'AionUi 发送消息失败')
      this.events.emit('chat.response.stream', {
        conversation_id: conversationId,
        type: 'error',
        data: { message },
      })
      await replyPromise.catch(() => undefined)
      throw error
    }

    if (sendResult && typeof sendResult === 'object' && sendResult.success === false) {
      const message = sendResult.msg || normalizeErrorMessage(sendResult, 'AionUi 发送消息失败')
      this.events.emit('chat.response.stream', {
        conversation_id: conversationId,
        type: 'error',
        data: { message },
      })
      await replyPromise.catch(() => undefined)
      throw new Error(message)
    }

    return replyPromise
  }

  async askStream({ conversationId, input, timeouts, onChunk }) {
    const msgId = createId()

    const replyPromise = this.waitForReply({
      conversationId,
      msgId,
      timeouts,
      onChunk,
    })
    void replyPromise.catch(() => undefined)

    let sendResult = null
    try {
      sendResult = await this.invokeBridgeProvider(
        'chat.send.message',
        {
          input,
          msg_id: msgId,
          conversation_id: conversationId,
        },
        { waitForCallback: false }
      )
    } catch (error) {
      const message = normalizeErrorMessage(error, 'AionUi 发送消息失败')
      this.events.emit('chat.response.stream', {
        conversation_id: conversationId,
        msg_id: msgId,
        type: 'error',
        data: { message },
      })
      await replyPromise.catch(() => undefined)
      throw error
    }

    if (sendResult && typeof sendResult === 'object' && sendResult.success === false) {
      const message = sendResult.msg || normalizeErrorMessage(sendResult, 'AionUi 发送消息失败')
      this.events.emit('chat.response.stream', {
        conversation_id: conversationId,
        msg_id: msgId,
        type: 'error',
        data: { message },
      })
      await replyPromise.catch(() => undefined)
      throw new Error(message)
    }

    return replyPromise
  }

  waitForReply({ conversationId, msgId, timeouts, onChunk }) {
    return new Promise((resolve, reject) => {
      const chunks = []
      let finished = false
      let gotContent = false
      let gotFinish = false
      let firstChunkTimer = null
      let idleTimer = null
      let totalTimer = null
      let finishTimer = null

      const clearTimers = () => {
        if (firstChunkTimer) clearTimeout(firstChunkTimer)
        if (idleTimer) clearTimeout(idleTimer)
        if (totalTimer) clearTimeout(totalTimer)
        if (finishTimer) clearTimeout(finishTimer)
      }

      const finish = (callback) => {
        if (finished) return
        finished = true
        this.events.off('chat.response.stream', onStream)
        clearTimers()
        callback()
      }

      const resetIdleTimer = () => {
        if (idleTimer) clearTimeout(idleTimer)
        idleTimer = setTimeout(() => {
          finish(() => {
            if (chunks.length > 0) {
              resolve(chunks.join(''))
              return
            }
            reject(new Error('AI 响应空闲超时'))
          })
        }, timeouts.idleTimeoutMs)
      }

      const scheduleFinish = () => {
        if (finishTimer) {
          clearTimeout(finishTimer)
        }
        finishTimer = setTimeout(() => {
          finish(() => resolve(chunks.join('')))
        }, timeouts.finishCooldownMs)
      }

      const onStream = (message) => {
        if (!message || typeof message !== 'object') return
        if (message.conversation_id !== conversationId) return

        // Some providers emit status/error chunks with synthetic msg_id values.
        // We route by conversation_id and keep per-conversation queueing in service
        // to avoid cross-turn interference.

        if (firstChunkTimer) {
          clearTimeout(firstChunkTimer)
          firstChunkTimer = null
        }

        if (message.type === 'content' && typeof message.data === 'string') {
          resetIdleTimer()
          chunks.push(message.data)
          if (typeof onChunk === 'function') {
            onChunk(message.data)
          }
          gotContent = true
          if (gotFinish) {
            scheduleFinish()
          }
          return
        }

        if (message.type === 'finish' || message.type === 'finished') {
          gotFinish = true
          scheduleFinish()
          return
        }

        if (message.type === 'error') {
          finish(() => {
            reject(new Error(normalizeErrorMessage(message.data, 'AionUi 返回错误')))
          })
        }
      }

      this.events.on('chat.response.stream', onStream)

      firstChunkTimer = setTimeout(() => {
        finish(() => {
          reject(new Error('AI 首包超时'))
        })
      }, timeouts.firstChunkTimeoutMs)

      totalTimer = setTimeout(() => {
        finish(() => {
          if (gotContent) {
            resolve(chunks.join(''))
            return
          }
          reject(new Error('AI 总超时'))
        })
      }, timeouts.totalTimeoutMs)
    })
  }

  async requestJson(path, options = {}) {
    const method = options.method || 'POST'
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }

    const cookieHeader = this.buildCookieHeader()
    if (cookieHeader) {
      headers.Cookie = cookieHeader
    }

    let body = options.body
    if (options.withCsrf && method !== 'GET' && method !== 'HEAD') {
      body = this.withCsrf(body)
    }

    const response = await fetch(new URL(path, config.aionui.baseUrl), {
      method,
      headers,
      body: body == null ? undefined : JSON.stringify(body),
    })

    this.captureResponseState(response)

    const contentType = response.headers.get('content-type') || ''
    let payload = null
    if (contentType.includes('application/json')) {
      payload = await response.json()
    } else {
      const text = await response.text()
      payload = { message: text }
    }

    if (!response.ok) {
      const message = normalizeErrorMessage(payload, `请求失败(${response.status})`)
      throw new Error(message)
    }

    return payload
  }

  withCsrf(body) {
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      return {
        ...body,
        _csrf: this.csrfToken || undefined,
      }
    }
    return body
  }

  captureResponseState(response) {
    let setCookieHeaders = []
    if (typeof response.headers.getSetCookie === 'function') {
      setCookieHeaders = response.headers.getSetCookie()
    } else {
      setCookieHeaders = splitSetCookieHeader(response.headers.get('set-cookie'))
    }

    for (const line of setCookieHeaders) {
      const parsed = parseCookie(line)
      if (!parsed) continue
      this.cookieJar.set(parsed.name, parsed.value)
      if (parsed.name === 'aionui-csrf-token') {
        this.csrfToken = parsed.value
      }
    }

    const csrfHeader = response.headers.get('x-csrf-token')
    if (csrfHeader) {
      this.csrfToken = csrfHeader
    }
  }

  buildCookieHeader() {
    if (this.cookieJar.size === 0) {
      return ''
    }

    return Array.from(this.cookieJar.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ')
  }
}
