import { randomUUID } from 'node:crypto'

export function createTraceId() {
  return randomUUID()
}

export function createId() {
  return randomUUID()
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function safeJsonParse(raw) {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function normalizeErrorMessage(value, fallback = '请求失败') {
  if (typeof value === 'string' && value.trim()) {
    return value
  }
  if (value && typeof value === 'object') {
    const objectValue = value
    if (typeof objectValue.error === 'string' && objectValue.error.trim()) {
      return objectValue.error
    }
    if (typeof objectValue.message === 'string' && objectValue.message.trim()) {
      return objectValue.message
    }
    if (typeof objectValue.msg === 'string' && objectValue.msg.trim()) {
      return objectValue.msg
    }
  }
  return fallback
}
