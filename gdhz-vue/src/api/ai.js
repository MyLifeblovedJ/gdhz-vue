const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

async function requestJson(path, payload) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload || {}),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = data?.error || data?.message || 'AI 服务请求失败'
    throw new Error(message)
  }

  return data
}

export async function chatWithAI({ chatSessionId = null, message, context = {}, selection = {} }) {
  return requestJson('/ai/chat', {
    chatSessionId,
    message,
    context,
    selection,
  })
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

export async function fetchChatHistory(chatSessionId) {
  const response = await fetch(`${API_BASE_URL}/ai/history?chatSessionId=${encodeURIComponent(chatSessionId || '')}`)
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = data?.error || data?.message || '读取聊天历史失败'
    throw new Error(message)
  }

  return data
}

export async function fetchAICatalog() {
  const response = await fetch(`${API_BASE_URL}/ai/catalog`)
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = data?.error || data?.message || '读取 AI 目录失败'
    throw new Error(message)
  }

  return data
}
