import { loadJsonFile, saveJsonFile } from '../../shared/persistence.js'

export class MessageRepository {
  constructor({ filePath, maxMessagesPerSession = 200 } = {}) {
    this.filePath = filePath || ''
    this.maxMessagesPerSession = Math.max(20, Number(maxMessagesPerSession || 200))
    this.messages = new Map()
    this.restore()
  }

  restore() {
    if (!this.filePath) return
    const list = loadJsonFile(this.filePath, [])
    if (!Array.isArray(list)) return

    for (const item of list) {
      if (!item || typeof item !== 'object') continue
      const key = String(item.key || '')
      if (!key) continue
      const messages = Array.isArray(item.messages) ? item.messages : []
      this.messages.set(
        key,
        messages
          .filter((msg) => msg && typeof msg === 'object')
          .map((msg) => ({
            role: String(msg.role || ''),
            content: String(msg.content || ''),
            traceId: String(msg.traceId || ''),
            createdAt: Number(msg.createdAt || Date.now()),
          }))
      )
    }
  }

  persist() {
    if (!this.filePath) return
    const serializable = [...this.messages.entries()].map(([key, messages]) => ({ key, messages }))
    saveJsonFile(this.filePath, serializable)
  }

  sessionKey(tenantId, userId, chatSessionId) {
    return `${tenantId}:${userId}:${chatSessionId}`
  }

  append({ tenantId, userId, chatSessionId, role, content, traceId }) {
    const key = this.sessionKey(tenantId, userId, chatSessionId)
    const list = this.messages.get(key) || []
    const item = {
      role,
      content,
      traceId,
      createdAt: Date.now(),
    }
    list.push(item)
    if (list.length > this.maxMessagesPerSession) {
      list.splice(0, list.length - this.maxMessagesPerSession)
    }
    this.messages.set(key, list)
    this.persist()
    return item
  }

  list({ tenantId, userId, chatSessionId }) {
    const key = this.sessionKey(tenantId, userId, chatSessionId)
    return [...(this.messages.get(key) || [])]
  }

  listRecent({ tenantId, userId, chatSessionId, limit = 20 }) {
    const key = this.sessionKey(tenantId, userId, chatSessionId)
    const list = this.messages.get(key) || []
    const normalizedLimit = Math.max(0, Number(limit || 0))
    if (normalizedLimit === 0) {
      return []
    }
    if (list.length <= normalizedLimit) {
      return [...list]
    }
    return list.slice(list.length - normalizedLimit)
  }

  listPaginated({ tenantId, userId, chatSessionId, page = 1, pageSize = 50 }) {
    const key = this.sessionKey(tenantId, userId, chatSessionId)
    const normalizedPage = Math.max(1, Number(page || 1))
    const normalizedPageSize = Math.min(200, Math.max(1, Number(pageSize || 50)))
    const all = [...(this.messages.get(key) || [])]
    const total = all.length
    const start = (normalizedPage - 1) * normalizedPageSize
    const end = start + normalizedPageSize

    return {
      messages: all.slice(start, end),
      page: normalizedPage,
      pageSize: normalizedPageSize,
      total,
      hasMore: end < total,
    }
  }

  count({ tenantId, userId, chatSessionId }) {
    const key = this.sessionKey(tenantId, userId, chatSessionId)
    return (this.messages.get(key) || []).length
  }

  deleteBySession({ tenantId, userId, chatSessionId }) {
    const key = this.sessionKey(tenantId, userId, chatSessionId)
    const had = this.messages.has(key)
    if (!had) return false
    this.messages.delete(key)
    this.persist()
    return true
  }
}
