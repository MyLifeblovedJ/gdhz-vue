import { execSync } from 'node:child_process'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const FALLBACK_DETECTABLE_BACKENDS = [
  { backend: 'claude', name: 'Claude Code', cliCommand: 'claude', enabled: true },
  { backend: 'qwen', name: 'Qwen Code', cliCommand: 'qwen', enabled: true },
  { backend: 'iflow', name: 'iFlow CLI', cliCommand: 'iflow', enabled: true },
  { backend: 'codex', name: 'Codex', cliCommand: 'codex', enabled: true },
  { backend: 'codebuddy', name: 'CodeBuddy', cliCommand: 'codebuddy', enabled: true },
  { backend: 'goose', name: 'Goose', cliCommand: 'goose', enabled: true },
  { backend: 'auggie', name: 'Augment Code', cliCommand: 'auggie', enabled: true },
  { backend: 'kimi', name: 'Kimi CLI', cliCommand: 'kimi', enabled: true },
  { backend: 'opencode', name: 'OpenCode', cliCommand: 'opencode', enabled: true },
  { backend: 'droid', name: 'Factory Droid', cliCommand: 'droid', enabled: true },
  { backend: 'copilot', name: 'GitHub Copilot', cliCommand: 'copilot', enabled: true },
  { backend: 'qoder', name: 'Qoder CLI', cliCommand: 'qodercli', enabled: true },
  { backend: 'vibe', name: 'Mistral Vibe', cliCommand: 'vibe-acp', enabled: true },
  { backend: 'openclaw-gateway', name: 'OpenClaw', cliCommand: 'openclaw', enabled: true },
  { backend: 'nanobot', name: 'Nano Bot', cliCommand: 'nanobot', enabled: true },
]

const GEMINI_FALLBACK_MODELS = [
  { id: 'auto', label: 'Auto (Gemini 3)' },
  { id: 'auto-gemini-2.5', label: 'Auto (Gemini 2.5)' },
  { id: 'gemini-3-pro-preview', label: 'gemini-3-pro-preview' },
  { id: 'gemini-3-flash-preview', label: 'gemini-3-flash-preview' },
  { id: 'gemini-2.5-pro', label: 'gemini-2.5-pro' },
  { id: 'gemini-2.5-flash', label: 'gemini-2.5-flash' },
  { id: 'gemini-2.5-flash-lite', label: 'gemini-2.5-flash-lite' },
]

const CODEX_FALLBACK_MODELS = [
  { id: 'gpt-5.3-codex', label: 'GPT-5.3 Codex' },
  { id: 'gpt-5.3-codex-spark', label: 'GPT-5.3 Codex Spark' },
  { id: 'gpt-5.2-codex', label: 'GPT-5.2 Codex' },
  { id: 'gpt-5.1-codex-max', label: 'GPT-5.1 Codex Max' },
  { id: 'gpt-5.2', label: 'GPT-5.2' },
  { id: 'gpt-5.1-codex-mini', label: 'GPT-5.1 Codex Mini' },
]

let detectableBackendsCache = null
let detectableBackendsCacheSource = 'fallback'

function tryParseJson(raw) {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function decodeConfigText(raw) {
  const trimmed = String(raw || '').trim()
  if (!trimmed) return {}

  const jsonDirect = tryParseJson(trimmed)
  if (jsonDirect && typeof jsonDirect === 'object') {
    return jsonDirect
  }

  try {
    const uriEncoded = Buffer.from(trimmed, 'base64').toString('utf8')
    const decoded = decodeURIComponent(uriEncoded)
    const parsed = tryParseJson(decoded)
    if (parsed && typeof parsed === 'object') {
      return parsed
    }
  } catch {
    // noop
  }

  return {}
}

function normalizeModelInfo(modelInfo) {
  if (!modelInfo || typeof modelInfo !== 'object') {
    return null
  }

  const available = Array.isArray(modelInfo.availableModels)
    ? modelInfo.availableModels
        .map((item) => ({
          id: item?.id || '',
          label: item?.label || item?.name || item?.id || '',
        }))
        .filter((item) => item.id)
    : []

  return {
    currentModelId: modelInfo.currentModelId || '',
    availableModels: available,
  }
}

function resolveDefaultModelId(rawValue) {
  if (typeof rawValue === 'string') {
    return rawValue.trim()
  }
  if (rawValue && typeof rawValue === 'object') {
    const modelId = typeof rawValue.useModel === 'string' ? rawValue.useModel.trim() : ''
    if (modelId) {
      return modelId
    }
  }
  return ''
}

function withFallbackModelInfo(modelInfo, fallbackModels, preferredModelId = '') {
  const fallback = Array.isArray(fallbackModels) ? fallbackModels.filter((item) => item?.id) : []
  const normalized = modelInfo && typeof modelInfo === 'object' ? modelInfo : { currentModelId: '', availableModels: [] }
  const availableModelsFromSource = Array.isArray(normalized.availableModels) ? normalized.availableModels : []
  const mergedModels = []
  const seen = new Set()

  const pushUnique = (list) => {
    for (const item of list) {
      const id = String(item?.id || '').trim()
      if (!id || seen.has(id)) continue
      seen.add(id)
      mergedModels.push({
        id,
        label: String(item?.label || item?.name || id),
      })
    }
  }

  pushUnique(availableModelsFromSource)
  pushUnique(fallback)

  const availableModels = mergedModels.length > 0 ? mergedModels : fallback

  const availableModelIds = new Set(availableModels.map((item) => item.id))
  let currentModelId = normalized.currentModelId || preferredModelId || availableModels[0]?.id || ''

  if (currentModelId && !availableModelIds.has(currentModelId)) {
    if (preferredModelId && availableModelIds.has(preferredModelId)) {
      currentModelId = preferredModelId
    } else {
      currentModelId = availableModels[0]?.id || ''
    }
  }

  return {
    currentModelId,
    availableModels,
  }
}

function existsCli(cmd) {
  if (!cmd) return false

  const isWindows = process.platform === 'win32'
  const command = isWindows ? `where ${cmd}` : `command -v ${cmd}`

  try {
    execSync(command, {
      stdio: 'ignore',
      timeout: 1000,
      shell: true,
    })
    return true
  } catch {
    if (!isWindows) {
      return false
    }
  }

  try {
    execSync(`powershell -NoProfile -NonInteractive -Command "Get-Command -All ${cmd} | Select-Object -First 1 | Out-Null"`, {
      stdio: 'ignore',
      timeout: 1000,
    })
    return true
  } catch {
    return false
  }
}

async function tryReadFile(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8')
  } catch {
    return ''
  }
}

async function resolveAionUiConfigPath(configFile) {
  const candidates = [
    configFile,
    process.env.AIONUI_CONFIG_FILE,
    path.join(os.homedir(), '.config', 'AionUi', 'config', 'aionui-config.txt'),
    path.join(os.homedir(), '.aionui-config', 'aionui-config.txt'),
  ].filter(Boolean)

  for (const candidate of candidates) {
    try {
      await fs.access(candidate)
      return candidate
    } catch {
      // try next
    }
  }

  return ''
}

async function resolveAcpTypesPath(acpTypesFile) {
  const candidates = [
    acpTypesFile,
    process.env.AIONUI_ACP_TYPES_FILE,
    path.join(process.cwd(), '..', '..', 'AionUi', 'src', 'types', 'acpTypes.ts'),
    '/usr/local/project/dzh/AionUi/src/types/acpTypes.ts',
  ].filter(Boolean)

  for (const candidate of candidates) {
    try {
      await fs.access(candidate)
      return candidate
    } catch {
      // try next
    }
  }

  return ''
}

function parseDetectableBackendsFromAcpTypes(raw) {
  const sourceText = String(raw || '')
  if (!sourceText) return []

  const start = sourceText.indexOf('export const ACP_BACKENDS_ALL')
  if (start < 0) return []

  const end = sourceText.indexOf('export const ACP_ENABLED_BACKENDS', start)
  const section = end > start ? sourceText.slice(start, end) : sourceText.slice(start)

  const result = []
  const pattern = /(['"]?[\w-]+['"]?)\s*:\s*{([\s\S]*?)\n\s*},/g
  let match = pattern.exec(section)

  while (match) {
    const key = String(match[1] || '').replace(/^['"]|['"]$/g, '')
    const body = String(match[2] || '')
    const enabled = /enabled:\s*(true|false)/.exec(body)?.[1] === 'true'
    const cliCommand = /cliCommand:\s*'([^']+)'/.exec(body)?.[1] || ''
    const name = /name:\s*'([^']+)'/.exec(body)?.[1] || key

    if (enabled && cliCommand && key !== 'gemini' && key !== 'custom') {
      result.push({
        backend: key,
        name,
        cliCommand,
        enabled: true,
      })
    }

    match = pattern.exec(section)
  }

  return result
}

async function loadDetectableBackends(acpTypesFile) {
  if (detectableBackendsCache && Array.isArray(detectableBackendsCache) && detectableBackendsCache.length) {
    return {
      backends: detectableBackendsCache,
      source: detectableBackendsCacheSource,
    }
  }

  const acpTypesPath = await resolveAcpTypesPath(acpTypesFile)
  if (acpTypesPath) {
    const raw = await tryReadFile(acpTypesPath)
    const parsed = parseDetectableBackendsFromAcpTypes(raw)
    if (parsed.length > 0) {
      detectableBackendsCache = parsed
      detectableBackendsCacheSource = acpTypesPath
      return {
        backends: detectableBackendsCache,
        source: detectableBackendsCacheSource,
      }
    }
  }

  detectableBackendsCache = FALLBACK_DETECTABLE_BACKENDS
  detectableBackendsCacheSource = 'fallback'
  return {
    backends: detectableBackendsCache,
    source: detectableBackendsCacheSource,
  }
}

export class AionUiCatalogService {
  constructor({ configFile = '', acpTypesFile = '' } = {}) {
    this.configFile = configFile
    this.acpTypesFile = acpTypesFile
    this.cache = null
    this.cacheAt = 0
  }

  async getCatalog({ force = false } = {}) {
    const now = Date.now()
    if (!force && this.cache && now - this.cacheAt < 10_000) {
      return this.cache
    }

    const configPath = await resolveAionUiConfigPath(this.configFile)
    const raw = configPath ? await tryReadFile(configPath) : ''
    const configJson = decodeConfigText(raw)

    const cachedModels =
      configJson['acp.cachedModels'] && typeof configJson['acp.cachedModels'] === 'object'
        ? configJson['acp.cachedModels']
        : {}

    const modelProviders = Array.isArray(configJson['model.config']) ? configJson['model.config'] : []
    const lastSelectedAgent = typeof configJson['guid.lastSelectedAgent'] === 'string' ? configJson['guid.lastSelectedAgent'] : ''

    const geminiDefaultModelId = resolveDefaultModelId(configJson['gemini.defaultModel'])
    const codexDefaultModelId = resolveDefaultModelId(configJson['codex.defaultModel'])

    const { backends: detectableBackends, source: detectableSource } = await loadDetectableBackends(this.acpTypesFile)
    const agents = this.detectAgents(configJson, cachedModels, detectableBackends, {
      geminiDefaultModelId,
      codexDefaultModelId,
    })

    this.cache = {
      agents,
      cachedModels,
      modelProviders,
      lastSelectedAgent,
      source: configPath || 'not-found',
      detectableSource,
      updatedAt: now,
    }
    this.cacheAt = now

    return this.cache
  }

  detectAgents(configJson, cachedModels, detectableBackends, options = {}) {
    const geminiDefaultModelId = options.geminiDefaultModelId || 'auto'
    const codexDefaultModelId = options.codexDefaultModelId || CODEX_FALLBACK_MODELS[0]?.id || ''
    const detected = []

    // 与 AionUi AcpDetector 保持一致：始终包含 Gemini
    const geminiModelInfo = withFallbackModelInfo(normalizeModelInfo(cachedModels.gemini), GEMINI_FALLBACK_MODELS, geminiDefaultModelId)
    detected.push({
      key: 'gemini',
      backend: 'gemini',
      name: 'Gemini CLI',
      cliPath: '',
      cachedModelInfo: geminiModelInfo,
    })

    for (const item of detectableBackends || []) {
      if (!item.enabled) continue
      if (!existsCli(item.cliCommand)) continue

      let cachedModelInfo = normalizeModelInfo(cachedModels[item.backend])
      if (item.backend === 'codex') {
        cachedModelInfo = withFallbackModelInfo(cachedModelInfo, CODEX_FALLBACK_MODELS, codexDefaultModelId)
      }

      detected.push({
        key: item.backend,
        backend: item.backend,
        name: item.name,
        cliPath: item.cliCommand,
        cachedModelInfo,
      })
    }

    let customIndex = 0
    const customAgents = Array.isArray(configJson['acp.customAgents']) ? configJson['acp.customAgents'] : []
    for (const custom of customAgents) {
      if (!custom?.enabled) continue
      if (!custom?.defaultCliPath && !custom?.isPreset) continue

      const customAgentId = custom?.id || `idx-${customIndex}`
      customIndex += 1
      detected.push({
        key: `custom:${customAgentId}`,
        backend: 'custom',
        name: custom?.name || 'Custom Agent',
        cliPath: custom?.defaultCliPath || '',
        customAgentId,
        isPreset: !!custom?.isPreset,
        presetAgentType: custom?.presetAgentType || '',
        context: custom?.context || '',
        avatar: custom?.avatar || '',
        cachedModelInfo: normalizeModelInfo(cachedModels.custom),
      })
    }

    return detected
  }
}
