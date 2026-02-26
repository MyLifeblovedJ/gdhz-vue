export class MessageRepository {
  constructor() {
    this.messages = new Map()
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
    return item
  }

  list({ tenantId, userId, chatSessionId }) {
    const key = this.sessionKey(tenantId, userId, chatSessionId)
    return [...(this.messages.get(key) || [])]
  }
}
