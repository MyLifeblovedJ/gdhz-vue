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
      const { tenantId, userId } = resolveUserContext(req)

      if (!chatSessionId) {
        res.json({
          chatSessionId: '',
          messages: [],
        })
        return
      }

      const messages = aiService.listHistory({
        tenantId,
        userId,
        chatSessionId,
      })

      res.json({
        chatSessionId,
        messages,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: normalizeErrorMessage(error, '历史记录读取失败'),
      })
    }
  })

  return router
}
