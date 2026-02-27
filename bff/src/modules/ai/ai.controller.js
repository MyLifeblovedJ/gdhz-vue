import express from 'express'
import { normalizeErrorMessage } from '../../shared/utils.js'

function resolveUserContext(req) {
  return {
    tenantId: req.header('x-tenant-id') || 'default',
    userId: req.header('x-user-id') || 'anonymous',
  }
}

export function createAiRouter(aiService) {
  const router = express.Router()

  router.post('/chat', async (req, res) => {
    try {
      const { chatSessionId = null, message, context = {}, selection = {} } = req.body || {}
      if (typeof message !== 'string' || !message.trim()) {
        res.status(400).json({
          success: false,
          error: 'message 不能为空',
        })
        return
      }

      const { tenantId, userId } = resolveUserContext(req)
      const result = await aiService.chat({
        tenantId,
        userId,
        chatSessionId,
        message: message.trim(),
        context,
        selection,
      })

      res.json(result)
    } catch (error) {
      res.status(502).json({
        success: false,
        error: normalizeErrorMessage(error, '聊天接口调用失败'),
      })
    }
  })

  router.post('/chat/stream', async (req, res) => {
    const { chatSessionId = null, message, context = {}, selection = {} } = req.body || {}
    if (typeof message !== 'string' || !message.trim()) {
      res.status(400).json({
        success: false,
        error: 'message 不能为空',
      })
      return
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders?.()

    const writeEvent = (event, payload) => {
      try {
        res.write(`event: ${event}\n`)
        res.write(`data: ${JSON.stringify(payload || {})}\n\n`)
      } catch {
        // ignore write errors when connection has been closed
      }
    }

    let closed = false
    req.on('close', () => {
      closed = true
    })

    try {
      const { tenantId, userId } = resolveUserContext(req)
      let sentMeta = false

      const result = await aiService.chatStream({
        tenantId,
        userId,
        chatSessionId,
        message: message.trim(),
        context,
        selection,
        onChunk: (text) => {
          if (closed) return
          if (!sentMeta) {
            sentMeta = true
            writeEvent('meta', {
              chatSessionId: chatSessionId || undefined,
            })
          }
          writeEvent('delta', { text })
        },
      })

      if (!closed) {
        writeEvent('done', result)
      }
    } catch (error) {
      if (!closed) {
        writeEvent('error', {
          error: normalizeErrorMessage(error, '聊天接口调用失败'),
        })
      }
    } finally {
      if (!closed) {
        res.end()
      }
    }
  })

  router.get('/catalog', async (_req, res) => {
    try {
      const result = await aiService.listCatalog()
      res.json(result)
    } catch (error) {
      res.status(502).json({
        success: false,
        error: normalizeErrorMessage(error, '拉取 AI 目录失败'),
      })
    }
  })

  router.post('/summary/current', async (req, res) => {
    try {
      const {
        region = 'gd',
        timeRange = '24h',
        detailLevel = 'standard',
        snapshot = {},
        selection = {},
      } = req.body || {}

      const result = await aiService.buildCurrentSummary({
        region,
        timeRange,
        detailLevel,
        snapshot,
        selection,
      })

      res.json(result)
    } catch (error) {
      res.status(502).json({
        success: false,
        error: normalizeErrorMessage(error, '摘要接口调用失败'),
      })
    }
  })

  router.get('/history', async (req, res) => {
    try {
      const chatSessionId = String(req.query.chatSessionId || '').trim()
      const page = Number.parseInt(String(req.query.page || '1'), 10)
      const pageSize = Number.parseInt(String(req.query.pageSize || '200'), 10)
      const { tenantId, userId } = resolveUserContext(req)

      if (!chatSessionId) {
        res.json({
          chatSessionId: '',
          messages: [],
          page: 1,
          pageSize,
          total: 0,
          hasMore: false,
        })
        return
      }

      const result = aiService.listHistory({
        tenantId,
        userId,
        chatSessionId,
        page,
        pageSize,
      })

      res.json({
        chatSessionId,
        messages: result.messages,
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        hasMore: result.hasMore,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: normalizeErrorMessage(error, '历史记录读取失败'),
      })
    }
  })

  router.get('/sessions', async (req, res) => {
    try {
      const page = Number.parseInt(String(req.query.page || '1'), 10)
      const pageSize = Number.parseInt(String(req.query.pageSize || '20'), 10)
      const { tenantId, userId } = resolveUserContext(req)

      const result = aiService.listSessions({
        tenantId,
        userId,
        page,
        pageSize,
      })

      res.json(result)
    } catch (error) {
      res.status(500).json({
        success: false,
        error: normalizeErrorMessage(error, '会话列表读取失败'),
      })
    }
  })

  router.patch('/sessions/:chatSessionId', async (req, res) => {
    try {
      const chatSessionId = String(req.params.chatSessionId || '').trim()
      const title = String(req.body?.title || '').trim()
      if (!chatSessionId || !title) {
        res.status(400).json({
          success: false,
          error: 'chatSessionId 和 title 不能为空',
        })
        return
      }

      const { tenantId, userId } = resolveUserContext(req)
      const result = aiService.renameSession({
        tenantId,
        userId,
        chatSessionId,
        title,
      })
      if (!result) {
        res.status(404).json({
          success: false,
          error: '会话不存在或标题无效',
        })
        return
      }
      res.json({
        success: true,
        session: result,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: normalizeErrorMessage(error, '重命名会话失败'),
      })
    }
  })

  router.delete('/sessions/:chatSessionId', async (req, res) => {
    try {
      const chatSessionId = String(req.params.chatSessionId || '').trim()
      if (!chatSessionId) {
        res.status(400).json({
          success: false,
          error: 'chatSessionId 不能为空',
        })
        return
      }
      const { tenantId, userId } = resolveUserContext(req)
      const removed = await aiService.removeSession({
        tenantId,
        userId,
        chatSessionId,
      })
      if (!removed) {
        res.status(404).json({
          success: false,
          error: '会话不存在',
        })
        return
      }

      res.json({ success: true, chatSessionId })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: normalizeErrorMessage(error, '删除会话失败'),
      })
    }
  })

  return router
}
