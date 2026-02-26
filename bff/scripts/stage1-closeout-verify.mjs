#!/usr/bin/env node
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as sleep } from 'node:timers/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..', '..')

const env = process.env

const BFF_BASE_URL = env.BFF_BASE_URL || 'http://127.0.0.1:3001'
const AIONUI_BASE_URL = env.AIONUI_BASE_URL || 'http://127.0.0.1:25808'
const AIONUI_USERNAME = env.AIONUI_USERNAME || 'admin'
const AIONUI_PASSWORD = env.AIONUI_PASSWORD || ''
const TEST_TENANT_ID = env.TEST_TENANT_ID || 'gd'
const HEARTBEAT_WAIT_MS = Number.parseInt(env.HEARTBEAT_WAIT_MS || '36000', 10)
const REQUEST_TIMEOUT_MS = Number.parseInt(env.REQUEST_TIMEOUT_MS || '180000', 10)

function parseCsv(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const PREFERRED_BACKENDS = parseCsv(env.PREFERRED_BACKENDS || 'gemini,codex')

function normalizeText(input) {
  return String(input || '').replace(/\s+/g, '')
}

function nowIso() {
  return new Date().toISOString()
}

function splitSetCookieHeader(headerValue) {
  if (!headerValue) return []

  const result = []
  let current = ''
  let inExpires = false

  for (let i = 0; i < headerValue.length; i += 1) {
    const char = headerValue[i]
    current += char

    const lower = current.toLowerCase()
    if (lower.endsWith('expires=')) {
      inExpires = true
    }

    if (inExpires && char === ';') {
      inExpires = false
    }

    if (!inExpires && char === ',') {
      current = current.slice(0, -1).trim()
      if (current) result.push(current)
      current = ''
    }
  }

  const tail = current.trim()
  if (tail) result.push(tail)
  return result
}

function parseSetCookieLines(headers) {
  if (typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie()
  }
  return splitSetCookieHeader(headers.get('set-cookie'))
}

function parseCookieMap(setCookieLines) {
  const map = new Map()
  for (const line of setCookieLines || []) {
    const firstPart = String(line || '').split(';')[0]
    const index = firstPart.indexOf('=')
    if (index <= 0) continue
    const key = firstPart.slice(0, index).trim()
    const value = firstPart.slice(index + 1).trim()
    if (!key) continue
    map.set(key, value)
  }
  return map
}

function cookieHeaderFromMap(cookieMap) {
  return Array.from(cookieMap.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ')
}

async function requestJson(url, { method = 'GET', headers = {}, body, timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const finalHeaders = {
      Accept: 'application/json',
      ...headers,
    }

    let payload = body
    if (body != null && typeof body === 'object' && !Array.isArray(body)) {
      finalHeaders['Content-Type'] = finalHeaders['Content-Type'] || 'application/json'
      payload = JSON.stringify(body)
    }

    const response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: payload,
      signal: controller.signal,
    })

    const text = await response.text()
    let json = null
    try {
      json = text ? JSON.parse(text) : null
    } catch {
      json = null
    }

    return {
      ok: response.ok,
      status: response.status,
      headers: response.headers,
      json,
      text,
    }
  } finally {
    clearTimeout(timer)
  }
}

function assertOk(condition, message, details = undefined) {
  if (condition) return
  const error = new Error(message)
  if (details !== undefined) {
    error.details = details
  }
  throw error
}

async function getCatalog() {
  const response = await requestJson(`${BFF_BASE_URL}/api/ai/catalog`, {
    method: 'GET',
    timeoutMs: 30_000,
  })
  assertOk(response.ok, '调用 /api/ai/catalog 失败', response.json || response.text)
  const providers = Array.isArray(response.json?.providers) ? response.json.providers : []
  assertOk(providers.length > 0, '/api/ai/catalog providers 为空', response.json)
  return response.json
}

function pickProvider(catalog) {
  const providers = Array.isArray(catalog?.providers) ? catalog.providers : []
  for (const backend of PREFERRED_BACKENDS) {
    const matched = providers.find((item) => item.backend === backend || item.backendKey === backend)
    if (matched) return matched
  }
  return providers[0] || null
}

function makeStrictEchoPrompt(token) {
  return `请严格只输出以下字符串，不要输出任何其他字符（包括空格、换行、标点）：${token}`
}

async function callChat({ tenantId, userId, chatSessionId, message, provider }) {
  const start = Date.now()
  const response = await requestJson(`${BFF_BASE_URL}/api/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tenantId,
      'x-user-id': userId,
    },
    body: {
      chatSessionId,
      message,
      selection: {
        backend: provider.backend,
        backendKey: provider.backendKey,
        modelId: provider.currentModelId || '',
      },
    },
  })

  assertOk(response.ok, '调用 /api/ai/chat 失败', response.json || response.text)

  return {
    latencyMs: Date.now() - start,
    payload: response.json,
  }
}

async function triggerTokenInvalidation() {
  assertOk(AIONUI_PASSWORD, '未提供 AIONUI_PASSWORD，无法执行强制 token 过期演练')

  const loginResponse = await requestJson(`${AIONUI_BASE_URL}/login`, {
    method: 'POST',
    body: {
      username: AIONUI_USERNAME,
      password: AIONUI_PASSWORD,
    },
    timeoutMs: 20_000,
  })

  assertOk(loginResponse.ok && loginResponse.json?.success && loginResponse.json?.token, 'AionUi 登录失败，无法触发 token 失效', loginResponse.json || loginResponse.text)

  const cookieMap = parseCookieMap(parseSetCookieLines(loginResponse.headers))
  const csrfToken = cookieMap.get('aionui-csrf-token') || loginResponse.headers.get('x-csrf-token') || ''
  const cookieHeader = cookieHeaderFromMap(cookieMap)

  const changePasswordResponse = await requestJson(`${AIONUI_BASE_URL}/api/auth/change-password`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${loginResponse.json.token}`,
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: {
      currentPassword: AIONUI_PASSWORD,
      newPassword: AIONUI_PASSWORD,
      _csrf: csrfToken || undefined,
    },
    timeoutMs: 20_000,
  })

  assertOk(
    changePasswordResponse.ok && changePasswordResponse.json?.success,
    '调用 /api/auth/change-password 失败，无法触发 token 失效',
    changePasswordResponse.json || changePasswordResponse.text
  )

  return {
    hasCsrfToken: !!csrfToken,
    cookieCount: cookieMap.size,
    message: changePasswordResponse.json?.message || '',
  }
}

async function verifyAuthExpiredRecovery(provider) {
  const nonce = randomUUID().slice(0, 8)
  const userId = `verify-auth-${nonce}`
  const chatSessionId = `verify-auth-session-${nonce}`
  const beforeToken = `AUTH_BEFORE_${nonce}`
  const afterToken = `AUTH_AFTER_${nonce}`

  const before = await callChat({
    tenantId: TEST_TENANT_ID,
    userId,
    chatSessionId,
    message: makeStrictEchoPrompt(beforeToken),
    provider,
  })

  const beforeReply = String(before.payload?.reply || '')
  assertOk(normalizeText(beforeReply).includes(beforeToken), '强制过期演练前置聊天未返回预期 token', {
    expected: beforeToken,
    got: beforeReply,
  })

  const invalidation = await triggerTokenInvalidation()

  await sleep(HEARTBEAT_WAIT_MS)

  const after = await callChat({
    tenantId: TEST_TENANT_ID,
    userId,
    chatSessionId,
    message: makeStrictEchoPrompt(afterToken),
    provider,
  })

  const afterReply = String(after.payload?.reply || '')
  assertOk(normalizeText(afterReply).includes(afterToken), '强制过期后聊天未恢复', {
    expected: afterToken,
    got: afterReply,
  })

  return {
    pass: true,
    userId,
    chatSessionId,
    waitMs: HEARTBEAT_WAIT_MS,
    beforeLatencyMs: before.latencyMs,
    afterLatencyMs: after.latencyMs,
    invalidation,
  }
}

async function verifyDualUserIsolation(provider) {
  const nonce = randomUUID().slice(0, 8)
  const sharedSessionId = `verify-shared-session-${nonce}`
  const userA = `verify-user-a-${nonce}`
  const userB = `verify-user-b-${nonce}`
  const tokenA = '1111'
  const tokenB = '2222'

  const [respA, respB] = await Promise.all([
    callChat({
      tenantId: TEST_TENANT_ID,
      userId: userA,
      chatSessionId: sharedSessionId,
      message: `请严格只输出数字 ${tokenA}，不要输出任何其他字符。`,
      provider,
    }),
    callChat({
      tenantId: TEST_TENANT_ID,
      userId: userB,
      chatSessionId: sharedSessionId,
      message: `请严格只输出数字 ${tokenB}，不要输出任何其他字符。`,
      provider,
    }),
  ])

  const replyA = String(respA.payload?.reply || '')
  const replyB = String(respB.payload?.reply || '')

  const normalizedA = normalizeText(replyA)
  const normalizedB = normalizeText(replyB)

  assertOk(normalizedA.includes(tokenA), '并发隔离校验失败：用户A回复不含自己的 token', {
    expected: tokenA,
    got: replyA,
  })
  assertOk(normalizedB.includes(tokenB), '并发隔离校验失败：用户B回复不含自己的 token', {
    expected: tokenB,
    got: replyB,
  })
  assertOk(!normalizedA.includes(tokenB), '并发隔离校验失败：用户A回复串入用户B token', { replyA, tokenB })
  assertOk(!normalizedB.includes(tokenA), '并发隔离校验失败：用户B回复串入用户A token', { replyB, tokenA })

  return {
    pass: true,
    sharedSessionId,
    userA,
    userB,
    latencyA: respA.latencyMs,
    latencyB: respB.latencyMs,
  }
}

async function verifyTailPacketCooldown(provider) {
  const nonce = randomUUID().slice(0, 8)
  const userId = `verify-tail-${nonce}`
  const chatSessionId = `verify-tail-session-${nonce}`
  const tokenFirst = `TAIL_A_${nonce}`
  const tokenSecond = `TAIL_B_${nonce}`
  const repeatedFirst = Array.from({ length: 24 }, () => tokenFirst).join('|')

  const firstPrompt = [
    '不要调用任何工具，不要执行代码。',
    `请原样输出以下文本，不要添加任何其他字符：${repeatedFirst}`,
  ].join('\n')

  const secondPrompt = makeStrictEchoPrompt(tokenSecond)

  const firstPromise = callChat({
    tenantId: TEST_TENANT_ID,
    userId,
    chatSessionId,
    message: firstPrompt,
    provider,
  })

  await sleep(200)

  const secondPromise = callChat({
    tenantId: TEST_TENANT_ID,
    userId,
    chatSessionId,
    message: secondPrompt,
    provider,
  })

  const [first, second] = await Promise.all([firstPromise, secondPromise])

  const firstReply = String(first.payload?.reply || '')
  const secondReply = String(second.payload?.reply || '')
  const normalizedSecond = normalizeText(secondReply)

  assertOk(firstReply.includes(tokenFirst), '尾包干扰校验失败：第一问未返回预期 token', {
    expected: tokenFirst,
    got: firstReply,
  })
  assertOk(normalizedSecond.includes(tokenSecond), '尾包干扰校验失败：第二问未返回预期 token', {
    expected: tokenSecond,
    got: secondReply,
  })
  assertOk(!normalizedSecond.includes(tokenFirst), '尾包干扰校验失败：第二问疑似混入上一问 token', {
    tokenFirst,
    secondReply,
  })

  return {
    pass: true,
    userId,
    chatSessionId,
    firstLatencyMs: first.latencyMs,
    secondLatencyMs: second.latencyMs,
  }
}

async function main() {
  const report = {
    startedAt: nowIso(),
    environment: {
      bffBaseUrl: BFF_BASE_URL,
      aionuiBaseUrl: AIONUI_BASE_URL,
      tenantId: TEST_TENANT_ID,
      preferredBackends: PREFERRED_BACKENDS,
      heartbeatWaitMs: HEARTBEAT_WAIT_MS,
      requestTimeoutMs: REQUEST_TIMEOUT_MS,
    },
    checks: {},
    passed: false,
  }

  try {
    const health = await requestJson(`${BFF_BASE_URL}/api/health`, { method: 'GET', timeoutMs: 10_000 })
    assertOk(health.ok && health.json?.status === 'ok', 'BFF 健康检查失败', health.json || health.text)

    const catalog = await getCatalog()
    const provider = pickProvider(catalog)
    assertOk(provider, '无法从 /api/ai/catalog 选择可用供应商', catalog)

    report.environment.selectedProvider = {
      backend: provider.backend,
      backendKey: provider.backendKey,
      currentModelId: provider.currentModelId || '',
      modelCount: Array.isArray(provider.models) ? provider.models.length : 0,
    }

    console.log(`[1/3] auth-expired 演练开始 (${provider.backend}/${provider.currentModelId || 'default'})`)
    report.checks.authExpiredRecovery = await verifyAuthExpiredRecovery(provider)
    console.log('[1/3] PASS')

    console.log('[2/3] 双用户并发隔离校验开始')
    report.checks.dualUserIsolation = await verifyDualUserIsolation(provider)
    console.log('[2/3] PASS')

    console.log('[3/3] 尾包干扰校验开始')
    report.checks.tailPacketCooldown = await verifyTailPacketCooldown(provider)
    console.log('[3/3] PASS')

    report.passed = true
  } catch (error) {
    report.error = {
      message: error?.message || String(error),
      details: error?.details,
      stack: error?.stack || '',
    }
    report.passed = false
    console.error('验证失败:', report.error.message)
    if (report.error.details !== undefined) {
      console.error('失败细节:', JSON.stringify(report.error.details, null, 2))
    }
    process.exitCode = 1
  } finally {
    report.finishedAt = nowIso()

    const datePart = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19)
    const outDir = path.resolve(projectRoot, 'doc', 'verification')
    await mkdir(outDir, { recursive: true })
    const outFile = path.join(outDir, `stage1-closeout-${datePart}.json`)
    await writeFile(outFile, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

    console.log(`报告文件: ${outFile}`)
    console.log(`总结果: ${report.passed ? 'PASS' : 'FAIL'}`)
  }
}

await main()
