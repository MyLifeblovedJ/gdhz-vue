import { createId } from '../../shared/utils.js'
import { loadJsonFile, saveJsonFile } from '../../shared/persistence.js'

export class SessionRepository {
  constructor({ filePath } = {}) {
    this.filePath = filePath || ''
    this.sessions = new Map()
    this.restore()
  }

  restore() {
    if (!this.filePath) return
    const list = loadJsonFile(this.filePath, [])
    if (!Array.isArray(list)) return

    for (const item of list) {
      if (!item || typeof item !== 'object') continue
      const session = {
        tenantId: String(item.tenantId || 'default'),
        userId: String(item.userId || 'anonymous'),
        chatSessionId: String(item.chatSessionId || ''),
        conversationId: String(item.conversationId || createId()),
        title: String(item.title || ''),
        backendKey: String(item.backendKey || ''),
        backend: String(item.backend || ''),
        modelId: String(item.modelId || ''),
        providerId: String(item.providerId || ''),
        customAgentId: String(item.customAgentId || ''),
        status: String(item.status || 'active'),
        initialized: !!item.initialized,
        needsRestore: !!item.needsRestore,
        releasedAt: Number(item.releasedAt || 0),
        createdAt: Number(item.createdAt || Date.now()),
        updatedAt: Number(item.updatedAt || Date.now()),
        lastActiveAt: Number(item.lastActiveAt || Date.now()),
      }

      if (!session.chatSessionId) continue
      const key = this.sessionKey(session.tenantId, session.userId, session.chatSessionId)
      this.sessions.set(key, session)
    }
  }

  persist() {
    if (!this.filePath) return
    saveJsonFile(this.filePath, [...this.sessions.values()])
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
      existing.updatedAt = Date.now()
      this.persist()
      return { session: existing, created: false }
    }

    const session = {
      tenantId,
      userId,
      chatSessionId: resolvedChatSessionId,
      conversationId: createId(),
      title: '',
      backendKey: '',
      backend: '',
      modelId: '',
      providerId: '',
      customAgentId: '',
      status: 'active',
      initialized: false,
      needsRestore: false,
      releasedAt: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastActiveAt: Date.now(),
    }

    this.sessions.set(key, session)
    this.persist()
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
      session.needsRestore = true
      session.releasedAt = Date.now()
    }

    session.backendKey = backendKey
    session.backend = backend
    session.modelId = modelId
    session.providerId = providerId
    session.customAgentId = customAgentId
    session.updatedAt = Date.now()
    session.lastActiveAt = Date.now()
    session.status = 'active'
    this.persist()

    return changed
  }

  ensureTitle(session, message, maxLength = 80) {
    if (session.title) {
      return session.title
    }
    const normalized = String(message || '').replace(/\s+/g, ' ').trim()
    if (!normalized) return ''
    session.title = normalized.slice(0, Math.max(8, maxLength))
    session.updatedAt = Date.now()
    this.persist()
    return session.title
  }

  updateTitle(session, title, maxLength = 80) {
    const normalized = String(title || '').replace(/\s+/g, ' ').trim().slice(0, Math.max(8, maxLength))
    if (!normalized) {
      return false
    }
    session.title = normalized
    session.updatedAt = Date.now()
    session.lastActiveAt = Date.now()
    this.persist()
    return true
  }

  markInitialized(session) {
    session.initialized = true
    session.updatedAt = Date.now()
    session.lastActiveAt = Date.now()
    session.status = 'active'
    this.persist()
  }

  markError(session) {
    session.status = 'error'
    session.updatedAt = Date.now()
    session.lastActiveAt = Date.now()
    this.persist()
  }

  markReleased(session) {
    // Keep upstream conversation id so AionUi can rebuild runtime task
    // from persistent storage on next message.
    session.needsRestore = true
    session.releasedAt = Date.now()
    session.status = 'released'
    session.updatedAt = Date.now()
    this.persist()
  }

  markRestoreConsumed(session) {
    session.needsRestore = false
    session.updatedAt = Date.now()
    session.lastActiveAt = Date.now()
    if (session.status === 'released') {
      session.status = 'active'
    }
    this.persist()
  }

  markActive(session) {
    session.status = 'active'
    session.updatedAt = Date.now()
    session.lastActiveAt = Date.now()
    this.persist()
  }

  listIdleSessions({ idleBefore }) {
    return [...this.sessions.values()].filter((session) => {
      if (!session.initialized) return false
      if (session.status !== 'active' && session.status !== 'error') return false
      return session.lastActiveAt <= idleBefore
    })
  }

  listByUser({ tenantId, userId, page = 1, pageSize = 20 }) {
    const normalizedPage = Math.max(1, Number(page || 1))
    const normalizedPageSize = Math.min(100, Math.max(1, Number(pageSize || 20)))
    const all = [...this.sessions.values()]
      .filter((item) => item.tenantId === tenantId && item.userId === userId)
      .sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0))

    const total = all.length
    const start = (normalizedPage - 1) * normalizedPageSize
    const end = start + normalizedPageSize
    const data = all.slice(start, end)

    return {
      data,
      page: normalizedPage,
      pageSize: normalizedPageSize,
      total,
      hasMore: end < total,
    }
  }

  removeSession({ tenantId, userId, chatSessionId }) {
    const key = this.sessionKey(tenantId, userId, chatSessionId)
    const existing = this.sessions.get(key)
    if (!existing) return null
    this.sessions.delete(key)
    this.persist()
    return existing
  }

  trimOverflowForUser({ tenantId, userId, maxSessions, keepChatSessionId = '' }) {
    const maxAllowed = Math.max(1, Number(maxSessions || 1))
    const list = [...this.sessions.values()]
      .filter((item) => item.tenantId === tenantId && item.userId === userId)
      .sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0))

    if (list.length <= maxAllowed) {
      return []
    }

    const overflow = list.slice(maxAllowed).filter((session) => session.chatSessionId !== keepChatSessionId)
    for (const session of overflow) {
      const key = this.sessionKey(session.tenantId, session.userId, session.chatSessionId)
      this.sessions.delete(key)
    }
    this.persist()
    return overflow
  }
}
