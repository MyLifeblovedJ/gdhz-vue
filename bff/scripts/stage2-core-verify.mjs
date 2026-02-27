#!/usr/bin/env node
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..', '..')

process.env.AI_MAX_SESSIONS_PER_USER = process.env.AI_MAX_SESSIONS_PER_USER || '2'
process.env.AI_MAX_MESSAGES_PER_SESSION = process.env.AI_MAX_MESSAGES_PER_SESSION || '20'
process.env.AI_SESSION_TITLE_MAX_LENGTH = process.env.AI_SESSION_TITLE_MAX_LENGTH || '24'

const [{ AiService }, { SessionRepository }, { MessageRepository }, { createId }] = await Promise.all([
  import('../src/modules/ai/ai.service.js'),
  import('../src/modules/ai/session.repository.js'),
  import('../src/modules/ai/message.repository.js'),
  import('../src/shared/utils.js'),
])

function assert(condition, message, details = undefined) {
  if (condition) return
  const error = new Error(message)
  if (details !== undefined) {
    error.details = details
  }
  throw error
}

class MockAionUiClient {
  constructor() {
    this.created = []
    this.resetCalls = []
  }

  async ensureReady() {
    return true
  }

  async getAiCatalog() {
    return {
      providers: [],
      modelProviders: [],
      lastSelectedAgent: 'codex',
      agents: [
        {
          key: 'codex',
          backend: 'codex',
          name: 'Codex',
          cachedModelInfo: {
            currentModelId: 'gpt-5.2-codex',
            availableModels: [{ id: 'gpt-5.2-codex', label: 'GPT-5.2 Codex' }],
          },
        },
      ],
    }
  }

  resolveConversationConfig(selection = {}) {
    return {
      backendKey: selection.backendKey || selection.backend || 'codex',
      backend: selection.backend || selection.backendKey || 'codex',
      modelId: selection.modelId || 'gpt-5.2-codex',
      providerId: selection.providerId || '',
      customAgentId: selection.customAgentId || '',
    }
  }

  async createConversation({ conversationId, selection }) {
    this.created.push({
      conversationId,
      backend: selection?.backend || '',
      modelId: selection?.modelId || '',
    })
    return {
      conversationId,
    }
  }

  async ask({ conversationId, input }) {
    return `sync:${conversationId.slice(0, 6)}:${String(input || '').slice(0, 18)}`
  }

  async askStream({ conversationId, input, onChunk }) {
    const chunks = [`stream:${conversationId.slice(0, 4)}:`, String(input || '').slice(0, 16)]
    for (const chunk of chunks) {
      if (typeof onChunk === 'function') onChunk(chunk)
    }
    return chunks.join('')
  }

  async resetConversation({ conversationId }) {
    this.resetCalls.push(conversationId)
    return true
  }
}

async function run() {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'gdhz-stage2-'))
  const cleanup = async () => rm(tmpDir, { recursive: true, force: true })

  const report = {
    startedAt: new Date().toISOString(),
    config: {
      AI_MAX_SESSIONS_PER_USER: Number(process.env.AI_MAX_SESSIONS_PER_USER || 0),
      AI_MAX_MESSAGES_PER_SESSION: Number(process.env.AI_MAX_MESSAGES_PER_SESSION || 0),
      AI_SESSION_TITLE_MAX_LENGTH: Number(process.env.AI_SESSION_TITLE_MAX_LENGTH || 0),
    },
    checks: [],
  }

  try {
    const sessionPath = path.join(tmpDir, 'ai-sessions.json')
    const messagePath = path.join(tmpDir, 'ai-messages.json')
    const client = new MockAionUiClient()
    const sessionRepository = new SessionRepository({ filePath: sessionPath })
    const messageRepository = new MessageRepository({ filePath: messagePath, maxMessagesPerSession: Number(process.env.AI_MAX_MESSAGES_PER_SESSION || 20) })
    const aiService = new AiService({
      aionuiClient: client,
      sessionRepository,
      messageRepository,
    })

    const tenantId = 'gdhz'
    const userA = `stage2-userA-${createId().slice(0, 6)}`
    const userB = `stage2-userB-${createId().slice(0, 6)}`
    const selection = { backend: 'codex', backendKey: 'codex', modelId: 'gpt-5.2-codex' }

    const chunks = []
    const first = await aiService.chatStream({
      tenantId,
      userId: userA,
      chatSessionId: null,
      message: 'first topic for stage2 verification',
      context: { page: 'overview' },
      selection,
      onChunk: (text) => chunks.push(text),
    })

    assert(first.chatSessionId, 'chatStream should return chatSessionId')
    assert(String(first.reply || '').length > 0, 'chatStream should return reply')
    assert(chunks.length >= 1, 'chatStream should emit chunks')
    report.checks.push({
      name: 'chatStream',
      pass: true,
      chatSessionId: first.chatSessionId,
      chunkCount: chunks.length,
    })

    const historyPage1 = aiService.listHistory({
      tenantId,
      userId: userA,
      chatSessionId: first.chatSessionId,
      page: 1,
      pageSize: 1,
    })
    const historyPage2 = aiService.listHistory({
      tenantId,
      userId: userA,
      chatSessionId: first.chatSessionId,
      page: 2,
      pageSize: 1,
    })
    assert(historyPage1.total >= 2, 'history total should include user + assistant messages')
    assert(historyPage1.messages.length === 1, 'history page1 size should be 1')
    assert(historyPage2.messages.length >= 1, 'history page2 should have at least one message')
    report.checks.push({
      name: 'historyPagination',
      pass: true,
      total: historyPage1.total,
      page1HasMore: historyPage1.hasMore,
    })

    const renamed = aiService.renameSession({
      tenantId,
      userId: userA,
      chatSessionId: first.chatSessionId,
      title: 'renamed-session-title',
    })
    assert(renamed?.title === 'renamed-session-title', 'rename session should take effect')
    report.checks.push({
      name: 'sessionRename',
      pass: true,
      title: renamed.title,
    })

    const second = await aiService.chat({
      tenantId,
      userId: userA,
      chatSessionId: null,
      message: 'second session message',
      context: {},
      selection,
    })
    const third = await aiService.chat({
      tenantId,
      userId: userA,
      chatSessionId: null,
      message: 'third session message',
      context: {},
      selection,
    })

    const sessionsAfterOverflow = aiService.listSessions({
      tenantId,
      userId: userA,
      page: 1,
      pageSize: 20,
    })
    const idsAfterOverflow = sessionsAfterOverflow.sessions.map((item) => item.chatSessionId)
    assert(sessionsAfterOverflow.total <= Number(process.env.AI_MAX_SESSIONS_PER_USER || 2), 'session overflow should be evicted')
    assert(!idsAfterOverflow.includes(first.chatSessionId), 'oldest session should be evicted when overflow')
    const evictedHistory = aiService.listHistory({
      tenantId,
      userId: userA,
      chatSessionId: first.chatSessionId,
      page: 1,
      pageSize: 10,
    })
    assert(evictedHistory.total === 0, 'evicted session history should be removed')
    report.checks.push({
      name: 'sessionOverflowEviction',
      pass: true,
      keptSessionIds: idsAfterOverflow,
      evictedSessionId: first.chatSessionId,
    })

    let trimSessionId = null
    for (let i = 0; i < 11; i += 1) {
      const result = await aiService.chat({
        tenantId,
        userId: userB,
        chatSessionId: trimSessionId,
        message: `trim-message-${i}`,
        context: {},
        selection,
      })
      trimSessionId = result.chatSessionId
    }
    assert(trimSessionId, 'trim test should produce chatSessionId')
    const trimmedHistory = aiService.listHistory({
      tenantId,
      userId: userB,
      chatSessionId: trimSessionId,
      page: 1,
      pageSize: 50,
    })
    assert(
      trimmedHistory.total <= Number(process.env.AI_MAX_MESSAGES_PER_SESSION || 20),
      'message count should respect maxMessagesPerSession'
    )
    report.checks.push({
      name: 'messageTrim',
      pass: true,
      totalAfterTrim: trimmedHistory.total,
    })

    const removed = await aiService.removeSession({
      tenantId,
      userId: userA,
      chatSessionId: second.chatSessionId,
    })
    assert(removed, 'removeSession should return true')
    const sessionsAfterDelete = aiService.listSessions({
      tenantId,
      userId: userA,
      page: 1,
      pageSize: 20,
    })
    assert(!sessionsAfterDelete.sessions.some((item) => item.chatSessionId === second.chatSessionId), 'removed session should disappear from list')
    report.checks.push({
      name: 'sessionDelete',
      pass: true,
      remaining: sessionsAfterDelete.total,
    })

    assert(client.resetCalls.length >= 1, 'resetConversation should be called during eviction/delete')
    report.checks.push({
      name: 'resetConversationHook',
      pass: true,
      resetCallCount: client.resetCalls.length,
    })

    report.result = 'PASS'
    report.finishedAt = new Date().toISOString()

    const verificationDir = path.join(projectRoot, 'doc', 'verification')
    await mkdir(verificationDir, { recursive: true })
    const reportPath = path.join(verificationDir, `stage2-core-verify-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`)
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

    console.log(JSON.stringify({ ...report, reportPath }, null, 2))
  } catch (error) {
    report.result = 'FAIL'
    report.finishedAt = new Date().toISOString()
    report.error = {
      message: error?.message || 'unknown error',
      details: error?.details || null,
    }
    console.error(JSON.stringify(report, null, 2))
    process.exitCode = 1
  } finally {
    await cleanup()
  }
}

await run()
