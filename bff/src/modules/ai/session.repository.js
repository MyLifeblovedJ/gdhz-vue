import { createId } from '../../shared/utils.js'

export class SessionRepository {
  constructor() {
    this.sessions = new Map()
  }

  sessionKey(tenantId, userId, chatSessionId) {
    return `${tenantId}:${userId}:${chatSessionId}`
  }

  get({ tenantId, userId, chatSessionId }) {
    const key = this.sessionKey(tenantId, userId, chatSessionId)
    return this.sessions.get(key) || null
  }

  getOrCreate({ tenantId, userId, chatSessionId }) {
    const resolvedChatSessionId = chatSessionId || createId()
    const key = this.sessionKey(tenantId, userId, resolvedChatSessionId)
    const existing = this.sessions.get(key)
    if (existing) {
      existing.lastActiveAt = Date.now()
      return { session: existing, created: false }
    }

    const session = {
      tenantId,
      userId,
      chatSessionId: resolvedChatSessionId,
      conversationId: createId(),
      backendKey: '',
      backend: '',
      modelId: '',
      providerId: '',
      customAgentId: '',
      status: 'active',
      initialized: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastActiveAt: Date.now(),
    }

    this.sessions.set(key, session)
    return { session, created: true }
  }

  syncSelection(session, selection) {
    const backendKey = selection?.backendKey || ''
    const backend = selection?.backend || ''
    const modelId = selection?.modelId || ''
    const providerId = selection?.providerId || ''
    const customAgentId = selection?.customAgentId || ''

    const changed =
      session.backendKey !== backendKey ||
      session.backend !== backend ||
      session.modelId !== modelId ||
      session.providerId !== providerId ||
      session.customAgentId !== customAgentId

    if (changed && session.initialized) {
      session.conversationId = createId()
      session.initialized = false
    }

    session.backendKey = backendKey
    session.backend = backend
    session.modelId = modelId
    session.providerId = providerId
    session.customAgentId = customAgentId
    session.updatedAt = Date.now()
    session.lastActiveAt = Date.now()

    return changed
  }

  markInitialized(session) {
    session.initialized = true
    session.updatedAt = Date.now()
    session.lastActiveAt = Date.now()
    session.status = 'active'
  }

  markError(session) {
    session.status = 'error'
    session.updatedAt = Date.now()
    session.lastActiveAt = Date.now()
  }
}
