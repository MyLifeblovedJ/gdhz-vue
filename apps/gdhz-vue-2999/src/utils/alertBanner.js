const ALERT_LEVEL_PATTERNS = [
  { level: 'red', pattern: /红色(?:警报|预警)|红色/ },
  { level: 'orange', pattern: /橙色(?:警报|预警)|橙色/ },
  { level: 'yellow', pattern: /黄色(?:警报|预警)|黄色/ },
  { level: 'blue', pattern: /蓝色(?:警报|预警)|蓝色/ },
]

export function parseAlertBannerMessage(message = '') {
  const rawMessage = String(message || '').trim()
  const matched = rawMessage.match(/^【([^】]+)】\s*(.*)$/)
  const title = matched?.[1]?.trim() || ''
  const body = matched?.[2]?.trim() || rawMessage
  const level = ALERT_LEVEL_PATTERNS.find(({ pattern }) => pattern.test(title))?.level || null

  return {
    title,
    body,
    level,
  }
}

export function duplicateAlertBannerMessages(messages = []) {
  const parsedMessages = messages.map(parseAlertBannerMessage)
  return [...parsedMessages, ...parsedMessages]
}
