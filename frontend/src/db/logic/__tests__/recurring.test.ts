import { describe, expect, it } from 'vitest'
import { shouldResetRecurringTask } from '../recurring'
import type { Task } from '@/types/models'

/**
 * 逐条镜像 `backend/tests/test_recurring.py` —— 日期也用同一批（2026-09）。
 * 这些用例是移植正确性的规格书，改行为前先改它们。
 */

const MONDAY = new Date(Date.UTC(2026, 8, 21)) // weekday 0
const TUESDAY = new Date(Date.UTC(2026, 8, 22)) // weekday 1
const SATURDAY = new Date(Date.UTC(2026, 8, 26)) // weekday 5

type Seed = Pick<Task, 'is_recurring' | 'recurrence_type' | 'status' | 'last_completed' | 'recurrence_days'>

function seed(overrides: Partial<Seed> = {}): Seed {
  return {
    is_recurring: true,
    recurrence_type: 'daily',
    status: 'done',
    last_completed: '2026-09-20T12:00:00',
    recurrence_days: null,
    ...overrides
  }
}

describe('shouldResetRecurringTask', () => {
  it('非循环永不重置', () => {
    expect(shouldResetRecurringTask(seed({ is_recurring: false }), TUESDAY)).toBe(false)
  })

  it('recurrence_type=none 永不重置', () => {
    expect(shouldResetRecurringTask(seed({ recurrence_type: 'none' }), TUESDAY)).toBe(false)
  })

  it('daily：隔天就重置', () => {
    expect(shouldResetRecurringTask(seed({ recurrence_type: 'daily' }), TUESDAY)).toBe(true)
  })

  it('daily：同一天不重置', () => {
    expect(
      shouldResetRecurringTask(
        seed({ recurrence_type: 'daily', last_completed: '2026-09-22T08:00:00' }),
        TUESDAY
      )
    ).toBe(false)
  })

  it('没有 last_completed 且已完成 → 重置', () => {
    expect(
      shouldResetRecurringTask(
        seed({ recurrence_type: 'daily', last_completed: null, status: 'done' }),
        TUESDAY
      )
    ).toBe(true)
  })

  it('没有 last_completed 且还是待办 → 不动', () => {
    expect(
      shouldResetRecurringTask(
        seed({ recurrence_type: 'daily', last_completed: null, status: 'todo' }),
        TUESDAY
      )
    ).toBe(false)
  })

  it('weekdays：周一会重置', () => {
    expect(
      shouldResetRecurringTask(
        seed({ recurrence_type: 'weekdays', last_completed: '2026-09-20T09:00:00' }),
        MONDAY
      )
    ).toBe(true)
  })

  it('weekdays：周末不动', () => {
    expect(
      shouldResetRecurringTask(
        seed({ recurrence_type: 'weekdays', last_completed: '2026-09-25T09:00:00' }),
        SATURDAY
      )
    ).toBe(false)
  })

  it('weekly：同星期几会重置', () => {
    // 上周一完成；这周一刚好一周
    expect(
      shouldResetRecurringTask(
        seed({ recurrence_type: 'weekly', last_completed: '2026-09-14T09:00:00' }),
        MONDAY
      )
    ).toBe(true)
  })

  it('weekly：别的星期几不动', () => {
    expect(
      shouldResetRecurringTask(
        seed({ recurrence_type: 'weekly', last_completed: '2026-09-14T09:00:00' }),
        TUESDAY
      )
    ).toBe(false)
  })

  it('monthly：同日号会重置', () => {
    // 8/21 完成；9/21 同日号
    expect(
      shouldResetRecurringTask(
        seed({ recurrence_type: 'monthly', last_completed: '2026-08-21T09:00:00' }),
        MONDAY
      )
    ).toBe(true)
  })

  it('monthly：别的日号不动', () => {
    expect(
      shouldResetRecurringTask(
        seed({ recurrence_type: 'monthly', last_completed: '2026-08-21T09:00:00' }),
        TUESDAY
      )
    ).toBe(false)
  })

  it('custom：只在 recurrence_days 里那几天重置', () => {
    const t = seed({
      recurrence_type: 'custom',
      recurrence_days: [0, 2], // 周一、周三
      last_completed: '2026-09-20T09:00:00'
    })
    expect(shouldResetRecurringTask(t, MONDAY)).toBe(true)
    expect(shouldResetRecurringTask(t, TUESDAY)).toBe(false)
  })

  it('custom：没有 recurrence_days 就永不重置', () => {
    expect(
      shouldResetRecurringTask(
        seed({ recurrence_type: 'custom', recurrence_days: null }),
        TUESDAY
      )
    ).toBe(false)
  })

  it('带时区的 last_completed 按 UTC 日历日比较', () => {
    // UTC-5 的 2026-09-21 20:00 == UTC 的 2026-09-22 01:00 → 相对 TUESDAY 是「今天」
    const aware = new Date('2026-09-21T20:00:00-05:00').toISOString()
    expect(shouldResetRecurringTask(seed({ recurrence_type: 'daily', last_completed: aware }), TUESDAY)).toBe(
      false
    )
  })
})
