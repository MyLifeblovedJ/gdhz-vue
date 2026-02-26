function readNumber(name, fallback) {
  const raw = process.env[name]
  if (!raw) return fallback
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function splitCsv(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function toWebSocketUrl(baseUrl) {
  try {
    const url = new URL(baseUrl)
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${url.host}`
  } catch {
    return 'ws://127.0.0.1:25808'
  }
}

const aionuiBaseUrl = process.env.AIONUI_BASE_URL || 'http://127.0.0.1:25808'

export const config = {
  port: readNumber('BFF_PORT', 3001),
  allowedOrigins: splitCsv(process.env.BFF_ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000'),
  ai: {
    firstChunkTimeoutMs: readNumber('AI_FIRST_CHUNK_TIMEOUT_MS', 30_000),
    idleTimeoutMs: readNumber('AI_IDLE_TIMEOUT_MS', 15_000),
    totalTimeoutMs: readNumber('AI_TOTAL_TIMEOUT_MS', 120_000),
    finishCooldownMs: readNumber('AI_FINISH_COOLDOWN_MS', 300),
    createReadyDelayMs: readNumber('AI_CREATE_READY_DELAY_MS', 700),
  },
  aionui: {
    baseUrl: aionuiBaseUrl,
    wsUrl: process.env.AIONUI_WS_URL || toWebSocketUrl(aionuiBaseUrl),
    configFile: process.env.AIONUI_CONFIG_FILE || '',
    acpTypesFile: process.env.AIONUI_ACP_TYPES_FILE || '',
    username: process.env.AIONUI_USERNAME || 'admin',
    password: process.env.AIONUI_PASSWORD || '',
    defaultBackend: process.env.AIONUI_DEFAULT_BACKEND || process.env.AIONUI_ACP_BACKEND || 'gemini',
    defaultModelId: process.env.AIONUI_DEFAULT_MODEL_ID || '',
    defaultProviderId: process.env.AIONUI_DEFAULT_PROVIDER_ID || '',
    acpAgentName: process.env.AIONUI_ACP_AGENT_NAME || '',
    workspace: process.env.AIONUI_WORKSPACE || '',
    model: {
      id: process.env.AIONUI_MODEL_ID || 'gdhz-default-model',
      platform: process.env.AIONUI_MODEL_PLATFORM || 'openai',
      name: process.env.AIONUI_MODEL_NAME || 'GDHZ Default Model',
      baseUrl: process.env.AIONUI_MODEL_BASE_URL || 'https://api.openai.com/v1',
      useModel: process.env.AIONUI_MODEL_USE_MODEL || 'gpt-4o-mini',
    },
  },
}
