const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const USER_ID_STORAGE_KEY = 'gdhz.ai.userId.v1'

function getLocalUserId() {
  try {
    const existing = window.localStorage.getItem(USER_ID_STORAGE_KEY)
    if (existing) return existing
    const next = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `gdhz-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
    window.localStorage.setItem(USER_ID_STORAGE_KEY, next)
    return next
  } catch {
    return 'anonymous'
  }
}

function buildRequestHeaders(extraHeaders = {}) {
  return {
    ...extraHeaders,
    'x-tenant-id': 'gdhz',
    'x-user-id': getLocalUserId(),
  }
}

async function requestJson(path, payload) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: buildRequestHeaders({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify(payload || {}),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = data?.error || data?.message || 'AI 服务请求失败'
    throw new Error(message)
  }

  return data
}

async function requestJsonWithMethod(path, { method = 'GET', payload, headers = {} } = {}) {
  const finalHeaders = buildRequestHeaders(headers)
  const hasPayload = payload !== undefined
  if (hasPayload && !('Content-Type' in finalHeaders)) {
    finalHeaders['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: hasPayload ? JSON.stringify(payload) : undefined,
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = data?.error || data?.message || 'AI 服务请求失败'
    throw new Error(message)
  }

  return data
}

function parseSseEventBlock(block) {
  const lines = String(block || '').split(/\r?\n/)
  let event = 'message'
  const dataLines = []

  for (const line of lines) {
    if (!line) continue
    if (line.startsWith(':')) continue
    if (line.startsWith('event:')) {
      event = line.slice(6).trim() || 'message'
      continue
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart())
    }
  }

  const dataRaw = dataLines.join('\n')
  let payload = {}
  if (dataRaw) {
    try {
      payload = JSON.parse(dataRaw)
    } catch {
      payload = { text: dataRaw }
    }
  }

  return { event, payload }
}

export async function chatWithAI({ chatSessionId = null, message, context = {}, selection = {} }) {
  return requestJson('/ai/chat', {
    chatSessionId,
    message,
    context,
    selection,
  })
}

export async function chatWithAIStream({
  chatSessionId = null,
  message,
  context = {},
  selection = {},
  onMeta = () => {},
  onDelta = () => {},
}) {
  const response = await fetch(`${API_BASE_URL}/ai/chat/stream`, {
    method: 'POST',
    headers: buildRequestHeaders({
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    }),
    body: JSON.stringify({
      chatSessionId,
      message,
      context,
      selection,
    }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    const messageText = data?.error || data?.message || 'AI 服务请求失败'
    throw new Error(messageText)
  }

  if (!response.body) {
    throw new Error('流式响应不可用')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let donePayload = null

  const consumeBuffer = () => {
    const parts = buffer.split(/\r?\n\r?\n/)
    buffer = parts.pop() || ''
    for (const part of parts) {
      const trimmed = part.trim()
      if (!trimmed) continue
      const { event, payload } = parseSseEventBlock(trimmed)
      if (event === 'meta') {
        onMeta(payload)
      } else if (event === 'delta') {
        onDelta(String(payload?.text || ''))
      } else if (event === 'done') {
        donePayload = payload || {}
      } else if (event === 'error') {
        throw new Error(String(payload?.error || 'AI 服务请求失败'))
      }
    }
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    consumeBuffer()
  }

  buffer += decoder.decode()
  if (buffer.trim()) {
    const { event, payload } = parseSseEventBlock(buffer.trim())
    if (event === 'meta') {
      onMeta(payload)
    } else if (event === 'delta') {
      onDelta(String(payload?.text || ''))
    } else if (event === 'done') {
      donePayload = payload || {}
    } else if (event === 'error') {
      throw new Error(String(payload?.error || 'AI 服务请求失败'))
    }
  }

  return donePayload || {
    chatSessionId,
    reply: '',
  }
}

export async function fetchCurrentSummary({
  region = 'gd',
  timeRange = '24h',
  detailLevel = 'standard',
  snapshot = {},
  selection = {},
}) {
  return requestJson('/ai/summary/current', {
    region,
    timeRange,
    detailLevel,
    snapshot,
    selection,
  })
}

export async function fetchChatHistory(chatSessionId, { page = 1, pageSize = 200 } = {}) {
  const params = new URLSearchParams()
  params.set('chatSessionId', String(chatSessionId || ''))
  params.set('page', String(page))
  params.set('pageSize', String(pageSize))
  const response = await fetch(`${API_BASE_URL}/ai/history?${params.toString()}`, {
    headers: buildRequestHeaders(),
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = data?.error || data?.message || '读取聊天历史失败'
    throw new Error(message)
  }

  return data
}

export async function fetchAICatalog() {
  const response = await fetch(`${API_BASE_URL}/ai/catalog`, {
    headers: buildRequestHeaders(),
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = data?.error || data?.message || '读取 AI 目录失败'
    throw new Error(message)
  }

  return data
}

export async function fetchAISessions({ page = 1, pageSize = 20 } = {}) {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('pageSize', String(pageSize))
  const response = await fetch(`${API_BASE_URL}/ai/sessions?${params.toString()}`, {
    headers: buildRequestHeaders(),
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = data?.error || data?.message || '读取会话列表失败'
    throw new Error(message)
  }

  return data
}

export async function renameAISession(chatSessionId, title) {
  return requestJsonWithMethod(`/ai/sessions/${encodeURIComponent(chatSessionId || '')}`, {
    method: 'PATCH',
    payload: { title },
  })
}

export async function deleteAISession(chatSessionId) {
  return requestJsonWithMethod(`/ai/sessions/${encodeURIComponent(chatSessionId || '')}`, {
    method: 'DELETE',
  })
}
