import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { repoCreate } from '@/db/repo'
import { getNotifications, getRecentTasks, getStats, getUpcomingEvents } from '../dashboard'
import type { Event, Task } from '@/types/models'

const NOW = new Date('2026-10-04T15:00:00Z')

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
})

function taskSeed(overrides: Partial<Task> = {}): Partial<Task> {
  return {
    title: '任务',
    description: null,
    status: 'todo',
    priority: 'medium',
    due_date: null,
    tags: [],
    is_pinned: false,
    is_recurring: false,
    recurrence_type: 'none',
    recurrence_days: null,
    last_completed: null,
    completed_at: null,
    ...overrides
  }
}

function eventSeed(overrides: Partial<Event> = {}): Partial<Event> {
  return {
    title: '日程',
    description: null,
    start_time: '2026-10-04T10:00:00Z',
    end_time: '2026-10-04T11:00:00Z',
    location: null,
    is_all_day: false,
    reminder_minutes: 15,
    color: '#409eff',
    recurrence: null,
    ...overrides
  }
}

describe('getStats', () => {
  it('空库 → 全 0', async () => {
    const s = await getStats(NOW)
    expect(s.tasks).toEqual({ total: 0, completed: 0, pending: 0, completion_rate: 0 })
    expect(s.events).toEqual({ today: 0, upcoming: 0 })
    expect(s.notes).toBe(0)
    expect(s.bookmarks).toBe(0)
    expect(s.snippets).toBe(0)
    expect(s.task_trend).toHaveLength(7)
  })

  it('任务计数 + 完成率', async () => {
    await repoCreate<Task>('tasks', taskSeed({ status: 'done' }))
    await repoCreate<Task>('tasks', taskSeed({ status: 'done' }))
    await repoCreate<Task>('tasks', taskSeed({ status: 'todo' }))
    await repoCreate<Task>('tasks', taskSeed({ status: 'in_progress' }))
    await repoCreate<Task>('tasks', taskSeed({ status: 'custom_status' })) // 既非终态也非进行中

    const s = await getStats(NOW)
    expect(s.tasks?.total).toBe(5)
    expect(s.tasks?.completed).toBe(2)
    expect(s.tasks?.pending).toBe(2)
    expect(s.tasks?.completion_rate).toBe(40)
  })

  it('今日 vs 未来 7 天日程', async () => {
    await repoCreate<Event>('events', eventSeed()) // 今天
    await repoCreate<Event>(
      'events',
      eventSeed({ start_time: '2026-10-06T10:00:00Z', end_time: '2026-10-06T11:00:00Z' })
    ) // 本周内
    await repoCreate<Event>(
      'events',
      eventSeed({ start_time: '2026-11-01T10:00:00Z', end_time: '2026-11-01T11:00:00Z' })
    ) // 超出 7 天

    const s = await getStats(NOW)
    expect(s.events?.today).toBe(1)
    expect(s.events?.upcoming).toBe(2)
  })

  it('趋势图：按 completed_at 归到 UTC 日历日，7 根柱按 MM-DD', async () => {
    await repoCreate<Task>(
      'tasks',
      taskSeed({ status: 'done', completed_at: '2026-10-04T01:00:00Z' })
    )
    await repoCreate<Task>(
      'tasks',
      taskSeed({ status: 'done', completed_at: '2026-10-04T23:00:00Z' })
    )
    await repoCreate<Task>(
      'tasks',
      taskSeed({ status: 'done', completed_at: '2026-10-01T12:00:00Z' })
    )
    // 还没完成的不进趋势
    await repoCreate<Task>('tasks', taskSeed({ status: 'todo', completed_at: null }))

    const s = await getStats(NOW)
    expect(s.task_trend?.map((d) => d.date)).toEqual([
      '09-28',
      '09-29',
      '09-30',
      '10-01',
      '10-02',
      '10-03',
      '10-04'
    ])
    expect(s.task_trend?.map((d) => d.count)).toEqual([0, 0, 0, 1, 0, 0, 2])
  })
})

describe('getRecentTasks', () => {
  it('只取待办，置顶优先，其次到期早', async () => {
    await repoCreate<Task>('tasks', taskSeed({ title: '已完成', status: 'done' }))
    await repoCreate<Task>(
      'tasks',
      taskSeed({ title: '后到期', due_date: '2026-10-20T00:00:00Z' })
    )
    await repoCreate<Task>('tasks', taskSeed({ title: '先到期', due_date: '2026-10-05T00:00:00Z' }))
    await repoCreate<Task>('tasks', taskSeed({ title: '置顶的', is_pinned: true }))

    const rows = await getRecentTasks(5, )
    expect(rows.map((t) => t.title)).toEqual(['置顶的', '先到期', '后到期'])
  })

  it('遵守 limit', async () => {
    for (let i = 0; i < 8; i++) await repoCreate<Task>('tasks', taskSeed({ title: `T${i}` }))
    expect(await getRecentTasks(3)).toHaveLength(3)
  })
})

describe('getUpcomingEvents', () => {
  it('只要还没结束的，按开始时间', async () => {
    await repoCreate<Event>(
      'events',
      eventSeed({ title: '已结束', start_time: '2026-10-01T10:00:00Z', end_time: '2026-10-01T11:00:00Z' })
    )
    await repoCreate<Event>(
      'events',
      eventSeed({ title: '晚些', start_time: '2026-10-05T18:00:00Z', end_time: '2026-10-05T19:00:00Z' })
    )
    await repoCreate<Event>(
      'events',
      eventSeed({ title: '早些', start_time: '2026-10-05T08:00:00Z', end_time: '2026-10-05T09:00:00Z' })
    )

    const rows = await getUpcomingEvents(5, NOW)
    expect(rows.map((e) => e.title)).toEqual(['早些', '晚些'])
  })
})

describe('getNotifications', () => {
  it('逾期任务 + 今日日程，按时间排序', async () => {
    await repoCreate<Task>(
      'tasks',
      taskSeed({ title: '逾期的', due_date: '2026-10-03T00:00:00Z', status: 'todo' })
    )
    await repoCreate<Event>(
      'events',
      eventSeed({ title: '今天开个会', start_time: '2026-10-04T20:00:00Z', end_time: '2026-10-04T21:00:00Z' })
    )
    // 明天的不算
    await repoCreate<Event>(
      'events',
      eventSeed({ title: '明天', start_time: '2026-10-05T10:00:00Z', end_time: '2026-10-05T11:00:00Z' })
    )
    // 明天到期的不算逾期
    await repoCreate<Task>(
      'tasks',
      taskSeed({ title: '明天到期', due_date: '2026-10-05T00:00:00Z', status: 'todo' })
    )

    const items = await getNotifications(10, NOW)
    expect(items.map((i) => i.title)).toEqual(['任务已逾期：逾期的', '今日日程：今天开个会'])
    expect(items[0].icon).toBe('WarningFilled')
    expect(items[0].link).toBe('/tasks')
    expect(items[1].icon).toBe('Calendar')
    expect(items[1].link).toBe('/calendar')
  })

  it('完成的任务不进通知', async () => {
    await repoCreate<Task>(
      'tasks',
      taskSeed({ title: '逾期但做完了', due_date: '2026-10-03T00:00:00Z', status: 'done' })
    )
    expect(await getNotifications(10, NOW)).toEqual([])
  })
})
