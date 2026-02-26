import cors from 'cors'
import express from 'express'
import { config } from './shared/config.js'
import { AionUiClient } from './modules/ai/aionui.client.js'
import { AionUiCatalogService } from './modules/ai/aionui.catalog.js'
import { MessageRepository } from './modules/ai/message.repository.js'
import { SessionRepository } from './modules/ai/session.repository.js'
import { AiService } from './modules/ai/ai.service.js'
import { createAiRouter } from './modules/ai/ai.controller.js'

const app = express()

app.use(express.json({ limit: '2mb' }))
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true)
        return
      }
      if (config.allowedOrigins.includes('*')) {
        callback(null, true)
        return
      }
      if (config.allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }
      callback(new Error(`CORS blocked: ${origin}`))
    },
    credentials: false,
  })
)

const catalogService = new AionUiCatalogService({
  configFile: config.aionui.configFile,
  acpTypesFile: config.aionui.acpTypesFile,
})
const aionuiClient = new AionUiClient({
  catalogService,
})
const sessionRepository = new SessionRepository()
const messageRepository = new MessageRepository()
const aiService = new AiService({
  aionuiClient,
  sessionRepository,
  messageRepository,
})

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'gdhz-bff',
    timestamp: Date.now(),
  })
})

app.use('/api/ai', createAiRouter(aiService))

app.use((error, _req, res, _next) => {
  if (error?.message?.startsWith('CORS blocked')) {
    res.status(403).json({
      success: false,
      error: '跨域请求未被允许',
    })
    return
  }

  res.status(500).json({
    success: false,
    error: error?.message || '服务异常',
  })
})

const server = app.listen(config.port, () => {
  console.log(`[gdhz-bff] listening on http://0.0.0.0:${config.port}`)
})

void aiService.warmup().then(
  () => {
    console.log('[gdhz-bff] AionUi warmup success')
  },
  (error) => {
    console.warn('[gdhz-bff] AionUi warmup failed:', error.message)
  }
)

process.on('SIGINT', () => {
  server.close(() => {
    process.exit(0)
  })
})

process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0)
  })
})
