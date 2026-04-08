export function formatRelativeTime(value, now = Date.now()) {
  const targetTime = new Date(value).getTime()
  const currentTime = typeof now === 'number' ? now : new Date(now).getTime()

  if (!Number.isFinite(targetTime) || !Number.isFinite(currentTime)) {
    return '--'
  }

  const diffMs = Math.max(0, currentTime - targetTime)
  const diffMinutes = Math.floor(diffMs / 60000)

  if (diffMinutes < 1) return '刚刚'
  if (diffMinutes < 60) return `${diffMinutes}分钟前`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}小时前`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}天前`
}
