import { describe, expect, it } from 'vitest'
import { clampEventTimes } from '../events'
import { makeExcerpt } from '../notes'

describe('makeExcerpt', () => {
  it('空内容 → null', () => {
    expect(makeExcerpt('')).toBe(null)
    expect(makeExcerpt(null)).toBe(null)
    expect(makeExcerpt(undefined)).toBe(null)
  })

  it('短内容不加省略号', () => {
    expect(makeExcerpt('你好')).toBe('你好')
    expect(makeExcerpt('a'.repeat(160))).toBe('a'.repeat(160))
  })

  it('第 161 个字符开始截断并加 …', () => {
    const out = makeExcerpt('a'.repeat(161))
    expect(out).toBe('a'.repeat(160) + '…')
    expect(out).toHaveLength(161)
  })
})

describe('clampEventTimes', () => {
  const base = {
    start_time: '2026-10-04T10:00:00',
    end_time: '2026-10-04T11:00:00'
  }

  it('区间正常就原样返回', () => {
    const next = { ...base, end_time: '2026-10-04T12:00:00' }
    expect(clampEventTimes(next, { end_time: next.end_time })).toBe(next)
  })

  it('只改 end 且比 start 早 → start 拉到 end', () => {
    const next = { ...base, end_time: '2026-10-04T09:00:00' }
    const out = clampEventTimes(next, { end_time: '2026-10-04T09:00:00' })
    expect(out.start_time).toBe('2026-10-04T09:00:00')
    expect(out.end_time).toBe('2026-10-04T09:00:00')
  })

  it('只改 start 且比 end 晚 → end 拉到 start', () => {
    const next = { ...base, start_time: '2026-10-04T13:00:00' }
    const out = clampEventTimes(next, { start_time: '2026-10-04T13:00:00' })
    expect(out.end_time).toBe('2026-10-04T13:00:00')
    expect(out.start_time).toBe('2026-10-04T13:00:00')
  })

  it('两个都传且反了 → 按 end 优先（和后端一致）', () => {
    const next = {
      start_time: '2026-10-04T13:00:00',
      end_time: '2026-10-04T09:00:00'
    }
    const out = clampEventTimes(next, {
      start_time: next.start_time,
      end_time: next.end_time
    })
    expect(out.start_time).toBe('2026-10-04T09:00:00')
    expect(out.end_time).toBe('2026-10-04T09:00:00')
  })
})
