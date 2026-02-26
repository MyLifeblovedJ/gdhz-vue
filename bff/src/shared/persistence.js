import fs from 'node:fs'
import path from 'node:path'

function ensureDir(filePath) {
  const dir = path.dirname(filePath)
  fs.mkdirSync(dir, { recursive: true })
}

export function loadJsonFile(filePath, fallback) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8')
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

export function saveJsonFile(filePath, value) {
  ensureDir(filePath)
  const tempFile = `${filePath}.tmp`
  fs.writeFileSync(tempFile, JSON.stringify(value, null, 2), 'utf8')
  fs.renameSync(tempFile, filePath)
}
