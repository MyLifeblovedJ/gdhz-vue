import { describe, expect, it } from 'vitest'
import { formatRelativeTime } from './relativeTime'

const now = '2026-03-17T10:00:00+08:00'

describe('formatRelativeTime', () => {
  it('returns 刚刚 for updates within one minute', () => {
    expect(formatRelativeTime('2026-03-17T09:59:40+08:00', now)).toBe('刚刚')
  })

  it('returns 1分钟前 for updates around one minute ago', () => {
    expect(formatRelativeTime('2026-03-17T09:58:40+08:00', now)).toBe('1分钟前')
  })

  it('returns minutes for updates within one hour', () => {
    expect(formatRelativeTime('2026-03-17T09:01:00+08:00', now)).toBe('59分钟前')
  })

  it('returns hours for older updates', () => {
    expect(formatRelativeTime('2026-03-17T08:00:00+08:00', now)).toBe('2小时前')
  })
})
