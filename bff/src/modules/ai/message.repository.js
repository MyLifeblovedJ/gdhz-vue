import { loadJsonFile, saveJsonFile } from '../../shared/persistence.js'

export class MessageRepository {
  constructor({ filePath } = {}) {
    this.filePath = filePath || ''
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
    this.messages.set(key, list)
    this.persist()
    return item
  }

  list({ tenantId, userId, chatSessionId }) {
    const key = this.sessionKey(tenantId, userId, chatSessionId)
    return [...(this.messages.get(key) || [])]
  }
}
