import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../index'
import { repoCreate, repoGet, repoList, repoRemove, repoUpdate } from '../repo'
import type { Event, Note, Project, Task } from '@/types/models'

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
})

function taskSeed(overrides: Partial<Task> = {}): Partial<Task> {
  return {
    title: '写周报',
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

describe('repo 基础往返', () => {
  it('建 → 查 → 改 → 列 → 删', async () => {
    const created = await repoCreate<Task>('tasks', taskSeed())
    expect(typeof created.id).toBe('number')

    const got = await repoGet<Task>('tasks', created.id)
    expect(got?.title).toBe('写周报')

    const updated = await repoUpdate<Task>('tasks', created.id, { title: '写月报' })
    expect(updated?.title).toBe('写月报')
    expect(updated?.updated_at).not.toBe(created.updated_at)

    const list = await repoList<Task>('tasks', { skip: 0, limit: 50 })
    expect(list.total).toBe(1)
    expect(list.items[0].title).toBe('写月报')

    expect(await repoRemove('tasks', created.id)).toBe(true)
    expect((await repoList<Task>('tasks', { skip: 0, limit: 50 })).total).toBe(0)
  })

  it('改不存在的行返回 null', async () => {
    expect(await repoUpdate<Task>('tasks', 999, { title: 'x' })).toBe(null)
    expect(await repoGet<Task>('tasks', 999)).toBe(null)
  })
})

describe('tasks 钩子', () => {
  it('从非 done 变 done → 盖 completed_at', async () => {
    const t = await repoCreate<Task>('tasks', taskSeed())
    const out = await repoUpdate<Task>('tasks', t.id, { status: 'done' })
    expect(out?.completed_at).toBeTruthy()
    expect(out?.last_completed).toBe(null) // 非循环不记 last_completed
  })

  it('循环任务变 done → 同时记 last_completed', async () => {
    const t = await repoCreate<Task>(
      'tasks',
      taskSeed({ is_recurring: true, recurrence_type: 'daily' })
    )
    const out = await repoUpdate<Task>('tasks', t.id, { status: 'done' })
    expect(out?.completed_at).toBeTruthy()
    expect(out?.last_completed).toBeTruthy()
    expect(out?.last_completed).toBe(out?.completed_at)
  })

  it('已经是 done 再改别的字段 → 不动时间戳', async () => {
    const t = await repoCreate<Task>('tasks', taskSeed({ status: 'done', completed_at: '2026-01-01T00:00:00' }))
    const out = await repoUpdate<Task>('tasks', t.id, { title: '改个标题' })
    expect(out?.completed_at).toBe('2026-01-01T00:00:00')
  })

  it('列表前会把到期的循环任务打回待办', async () => {
    const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    await repoCreate<Task>(
      'tasks',
      taskSeed({
        title: '每日打卡',
        status: 'done',
        is_recurring: true,
        recurrence_type: 'daily',
        last_completed: yesterday,
        completed_at: yesterday
      })
    )
    const list = await repoList<Task>('tasks', { skip: 0, limit: 50 })
    expect(list.items[0].status).toBe('todo')
    expect(list.items[0].completed_at).toBe(null)
  })

  it('排序：置顶在前，其余按创建时间倒序', async () => {
    await repoCreate<Task>('tasks', taskSeed({ title: '普通A' }))
    await new Promise((r) => setTimeout(r, 2))
    await repoCreate<Task>('tasks', taskSeed({ title: '普通B' }))
    await repoCreate<Task>('tasks', taskSeed({ title: '置顶', is_pinned: true }))

    const list = await repoList<Task>('tasks', { skip: 0, limit: 50 })
    expect(list.items.map((t) => t.title)).toEqual(['置顶', '普通B', '普通A'])
  })
})

describe('notes 钩子', () => {
  it('列表行有 excerpt、没有 content；repoGet 才有正文', async () => {
    const body = 'x'.repeat(200)
    const created = await repoCreate<Note>('notes', {
      title: '笔记',
      content: body,
      note_type: 'note',
      parent_id: null,
      tags: [],
      is_pinned: false,
      is_favorite: false,
      checklist_items: null
    })

    const list = await repoList<Note>('notes', { skip: 0, limit: 50 })
    const row = list.items[0]
    // useNotes.openNote 靠 content !== undefined 判断要不要再拉一次
    expect(row.content).toBeUndefined()
    expect(row.excerpt).toBe('x'.repeat(160) + '…')

    const full = await repoGet<Note>('notes', created.id)
    expect(full?.content).toBe(body)
    expect(full?.excerpt).toBe('x'.repeat(160) + '…')
  })

  it('默认只取顶层（parent_id 为空）', async () => {
    await repoCreate<Note>('notes', {
      title: '顶层',
      content: 'a',
      note_type: 'note',
      parent_id: null,
      tags: [],
      is_pinned: false,
      is_favorite: false,
      checklist_items: null
    })
    await repoCreate<Note>('notes', {
      title: '子笔记',
      content: 'b',
      note_type: 'note',
      parent_id: 1,
      tags: [],
      is_pinned: false,
      is_favorite: false,
      checklist_items: null
    })

    const list = await repoList<Note>('notes', { skip: 0, limit: 50 })
    expect(list.items).toHaveLength(1)
    expect(list.items[0].title).toBe('顶层')

    const children = await repoList<Note>('notes', { skip: 0, limit: 50, parent_id: 1 })
    expect(children.items).toHaveLength(1)
    expect(children.items[0].title).toBe('子笔记')
  })

  it('改 content 时 excerpt 跟着重算', async () => {
    const n = await repoCreate<Note>('notes', {
      title: 't',
      content: '旧内容',
      note_type: 'note',
      parent_id: null,
      tags: [],
      is_pinned: false,
      is_favorite: false,
      checklist_items: null
    })
    const out = await repoUpdate<Note>('notes', n.id, { content: '新内容' })
    expect(out?.excerpt).toBe('新内容')
  })
})

describe('projects 钩子', () => {
  function projectSeed(subtasks: Project['subtasks']): Partial<Project> {
    return {
      name: '项目',
      description: null,
      status: 'in_progress',
      priority: 'medium',
      progress: 0,
      deadline: null,
      color: '#409eff',
      tags: [],
      members: 1,
      subtasks
    }
  }

  it('create 时按 subtasks 重算 progress（覆盖客户端给的值）', async () => {
    const p = await repoCreate<Project>(
      'projects',
      projectSeed([
        { id: 1, title: 'a', status: 'done', priority: 'low' },
        { id: 2, title: 'b', status: 'todo', priority: 'low' }
      ])
    )
    expect(p.progress).toBe(50)
  })

  it('update 带 subtasks 就重算', async () => {
    const p = await repoCreate<Project>('projects', projectSeed([]))
    expect(p.progress).toBe(0)

    const out = await repoUpdate<Project>('projects', p.id, {
      subtasks: [
        { id: 1, title: 'a', status: 'done', priority: 'low' },
        { id: 2, title: 'b', status: 'done', priority: 'low' },
        { id: 3, title: 'c', status: 'todo', priority: 'low' }
      ],
      progress: 0 // 陈旧值，应该被覆盖
    })
    expect(out?.progress).toBe(67)
  })

  it('不带 subtasks 的更新不动 progress', async () => {
    const p = await repoCreate<Project>(
      'projects',
      projectSeed([{ id: 1, title: 'a', status: 'done', priority: 'low' }])
    )
    expect(p.progress).toBe(100)
    const out = await repoUpdate<Project>('projects', p.id, { name: '改名' })
    expect(out?.progress).toBe(100)
  })
})

describe('events 钩子', () => {
  function eventSeed(overrides: Partial<Event> = {}): Partial<Event> {
    return {
      title: '会议',
      description: null,
      start_time: '2026-10-04T10:00:00',
      end_time: '2026-10-04T11:00:00',
      location: null,
      is_all_day: false,
      reminder_minutes: 15,
      color: '#409eff',
      recurrence: null,
      ...overrides
    }
  }

  it('日期窗口按重叠过滤（不是包含）', async () => {
    await repoCreate<Event>('events', eventSeed({ title: '窗口内', start_time: '2026-10-06T10:00:00', end_time: '2026-10-06T11:00:00' }))
    // 跨窗口边界：10-05 开始，10-08 结束，和 [10-06, 10-07] 重叠
    await repoCreate<Event>('events', eventSeed({ title: '跨界', start_time: '2026-10-05T10:00:00', end_time: '2026-10-08T11:00:00' }))
    await repoCreate<Event>('events', eventSeed({ title: '窗口外', start_time: '2026-10-20T10:00:00', end_time: '2026-10-20T11:00:00' }))

    const list = await repoList<Event>('events', {
      skip: 0,
      limit: 50,
      start_date: '2026-10-06',
      end_date: '2026-10-07'
    })
    expect(list.items.map((e) => e.title).sort()).toEqual(['窗口内', '跨界'].sort())
  })

  it('只改 end 且反了 → start 被拉到 end', async () => {
    const e = await repoCreate<Event>('events', eventSeed())
    const out = await repoUpdate<Event>('events', e.id, { end_time: '2026-10-04T09:00:00' })
    expect(out?.start_time).toBe('2026-10-04T09:00:00')
    expect(out?.end_time).toBe('2026-10-04T09:00:00')
  })

  it('排序按开始时间', async () => {
    await repoCreate<Event>('events', eventSeed({ title: '晚', start_time: '2026-10-04T18:00:00', end_time: '2026-10-04T19:00:00' }))
    await repoCreate<Event>('events', eventSeed({ title: '早', start_time: '2026-10-04T08:00:00', end_time: '2026-10-04T09:00:00' }))
    const list = await repoList<Event>('events', { skip: 0, limit: 50 })
    expect(list.items.map((e) => e.title)).toEqual(['早', '晚'])
  })
})

describe('分页', () => {
  it('total 是总数，items 是当页', async () => {
    for (let i = 0; i < 7; i++) {
      await repoCreate<Task>('tasks', taskSeed({ title: `T${i}` }))
    }
    const page = await repoList<Task>('tasks', { skip: 5, limit: 50 })
    expect(page.total).toBe(7)
    expect(page.items).toHaveLength(2)
  })
})
