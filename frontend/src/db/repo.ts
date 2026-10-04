import { db } from './index'
import { toPlain } from './plain'
import { clampEventTimes } from './logic/events'
import { makeExcerpt } from './logic/notes'
import { computeProgress } from './logic/projects'
import { resetRecurringTasks } from './logic/recurring'
import type { Bookmark, Event, Note, Project, Snippet, Task } from '@/types/models'

/**
 * 通用 CRUD + 挂钩表 —— `useResourceList` 只调这里。
 *
 * 曾经这些钩子活在 FastAPI 的各个路由里（`backend/app/api/*`）。现在集中在
 * 这一张表：改业务规则只改这一处，六域的 composable 都不用动。
 */

export type TableName = 'tasks' | 'events' | 'notes' | 'bookmarks' | 'snippets' | 'projects'

export interface ListParams {
  skip: number
  limit: number
  [k: string]: unknown
}

export interface ListResult<T> {
  items: T[]
  total: number
}

function nowIso(): string {
  return new Date().toISOString()
}

/** `YYYY-MM-DD` → 本地零点（对齐后端 `_parse_dt` 对 10 位字符串的处理）。 */
function parseDateOnly(value: string): Date | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function byCreatedAtDesc(a: { created_at: string }, b: { created_at: string }): number {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
}

function paginate<T>(rows: T[], skip: number, limit: number): ListResult<T> {
  const total = rows.length
  return { items: rows.slice(skip, skip + limit), total }
}

// ---------------------------------------------------------------- notes

/**
 * 列表行：去掉 `content`、加上 `excerpt`。
 *
 * `useNotes.openNote` 靠 `source.content !== undefined` 判断「要不要再拉一次正文」，
 * 所以列表行**绝不能**带 `content` —— 带了就永远只看到摘要。
 */
function presentNote(row: Note): Note {
  const { content, ...rest } = row
  return { ...rest, excerpt: makeExcerpt(content) } as Note
}

// ---------------------------------------------------------------- list

async function listTasks(params: ListParams): Promise<ListResult<Task>> {
  // 对齐后端：每次列表之前先把到期的循环任务打回待办（不受分页影响）。
  await resetRecurringTasks()

  let rows = await db.tasks.toArray()
  if (typeof params.task_status === 'string' && params.task_status) {
    rows = rows.filter((t) => t.status === params.task_status)
  }
  if (params.show_recurring === false) {
    rows = rows.filter((t) => !t.is_recurring)
  }
  if (typeof params.search === 'string' && params.search) {
    const q = params.search.toLowerCase()
    rows = rows.filter((t) => t.title.toLowerCase().includes(q))
  }
  rows.sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
    return byCreatedAtDesc(a, b)
  })
  return paginate(rows, params.skip, params.limit)
}

async function listEvents(params: ListParams): Promise<ListResult<Event>> {
  let rows = await db.events.toArray()

  // 重叠规则（对齐后端）：end_time >= start_date && start_time <= end_date
  const startDt = typeof params.start_date === 'string' ? parseDateOnly(params.start_date) : null
  if (startDt) {
    rows = rows.filter((e) => new Date(e.end_time).getTime() >= startDt.getTime())
  }
  const endDt = typeof params.end_date === 'string' ? parseDateOnly(params.end_date) : null
  if (endDt) {
    rows = rows.filter((e) => new Date(e.start_time).getTime() <= endDt.getTime())
  }

  rows.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
  return paginate(rows, params.skip, params.limit)
}

async function listNotes(params: ListParams): Promise<ListResult<Note>> {
  let rows = await db.notes.toArray()

  // 后端默认只取顶层（parent_id IS NULL）。`useNotes` 从不传 parent_id，
  // 但接口保留这个口子，免得以后加子笔记时又要改 repo。
  const parent = params.parent_id
  if (parent === undefined || parent === null || parent === '' || parent === 'null') {
    rows = rows.filter((n) => n.parent_id == null)
  } else {
    const pid = Number(parent)
    rows = rows.filter((n) => n.parent_id === pid)
  }

  if (typeof params.search === 'string' && params.search) {
    const q = params.search.toLowerCase()
    rows = rows.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        (n.content ?? '').toLowerCase().includes(q) ||
        (n.excerpt ?? '').toLowerCase().includes(q)
    )
  }

  rows.sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })
  return paginate(rows.map(presentNote), params.skip, params.limit)
}

async function listBookmarks(params: ListParams): Promise<ListResult<Bookmark>> {
  let rows = await db.bookmarks.toArray()
  if (typeof params.category === 'string' && params.category) {
    rows = rows.filter((b) => b.category === params.category)
  }
  if (typeof params.search === 'string' && params.search) {
    const q = params.search.toLowerCase()
    rows = rows.filter(
      (b) => b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q)
    )
  }
  rows.sort(byCreatedAtDesc)
  return paginate(rows, params.skip, params.limit)
}

async function listSnippets(params: ListParams): Promise<ListResult<Snippet>> {
  let rows = await db.snippets.toArray()
  if (typeof params.language === 'string' && params.language) {
    rows = rows.filter((s) => s.language === params.language)
  }
  if (typeof params.search === 'string' && params.search) {
    const q = params.search.toLowerCase()
    rows = rows.filter(
      (s) => s.title.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
    )
  }
  rows.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
  return paginate(rows, params.skip, params.limit)
}

async function listProjects(params: ListParams): Promise<ListResult<Project>> {
  let rows = await db.projects.toArray()
  if (typeof params.status === 'string' && params.status) {
    rows = rows.filter((p) => p.status === params.status)
  }
  if (typeof params.search === 'string' && params.search) {
    const q = params.search.toLowerCase()
    rows = rows.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q)
    )
  }
  rows.sort(byCreatedAtDesc)
  return paginate(rows, params.skip, params.limit)
}

export async function repoList<T>(table: TableName, params: ListParams): Promise<ListResult<T>> {
  switch (table) {
    case 'tasks':
      return (await listTasks(params)) as ListResult<T>
    case 'events':
      return (await listEvents(params)) as ListResult<T>
    case 'notes':
      return (await listNotes(params)) as ListResult<T>
    case 'bookmarks':
      return (await listBookmarks(params)) as ListResult<T>
    case 'snippets':
      return (await listSnippets(params)) as ListResult<T>
    case 'projects':
      return (await listProjects(params)) as ListResult<T>
  }
}

// ---------------------------------------------------------------- one

export async function repoGet<T>(table: TableName, id: number): Promise<T | null> {
  const row = await db.table(table).get(id)
  return (row as T) ?? null
}

// ---------------------------------------------------------------- create

function withTimestamps(
  payload: Record<string, unknown>
): Record<string, unknown> & { created_at: string; updated_at: string } {
  const now = nowIso()
  return {
    ...payload,
    created_at: (payload.created_at as string | undefined) ?? now,
    updated_at: (payload.updated_at as string | undefined) ?? now
  }
}

/**
 * 把要落库的值洗成纯对象 —— 见 `./plain`。
 */
export async function repoCreate<T>(table: TableName, payload: Partial<T>): Promise<T> {
  const raw = toPlain(payload) as Record<string, unknown>

  if (table === 'projects') {
    const p = withTimestamps(raw) as unknown as Project
    // 对齐后端 `_sync_progress`：payload 带 subtasks 就强制按它重算进度。
    if ('subtasks' in raw) {
      p.progress = computeProgress(p.subtasks)
    }
    const id = await db.projects.add(p)
    return { ...p, id } as T
  }

  if (table === 'notes') {
    const n = withTimestamps(raw) as unknown as Note
    n.excerpt = makeExcerpt(n.content)
    const id = await db.notes.add(n)
    return { ...n, id } as T
  }

  const row = withTimestamps(raw)
  const id = await db.table(table).add(row)
  return { ...row, id } as T
}

// ---------------------------------------------------------------- update

export async function repoUpdate<T>(
  table: TableName,
  id: number,
  payload: Partial<T>
): Promise<T | null> {
  const existing = await db.table(table).get(id)
  if (!existing) return null

  // payload 可能来自 Vue 的 reactive 树 —— 先洗成纯对象再碰 Dexie（见 toPlain）
  const patch: Record<string, unknown> = {
    ...toPlain(payload as object),
    updated_at: nowIso()
  }

  if (table === 'tasks') {
    const prev = existing as Task
    // 对齐 `api/tasks.py:93-97`：从非 done 变 done 时盖时间戳；
    // 循环任务还要记 last_completed，下个周期靠它判断要不要复活。
    if (patch.status === 'done' && prev.status !== 'done') {
      const now = nowIso()
      patch.completed_at = now
      if (prev.is_recurring) patch.last_completed = now
    }
  }

  if (table === 'events') {
    const next = { ...(existing as Event), ...(patch as Partial<Event>) } as Event
    const clamped = clampEventTimes(next, payload as { start_time?: string; end_time?: string })
    await db.table(table).put(clamped)
    return clamped as T
  }

  if (table === 'projects' && 'subtasks' in patch) {
    // 对齐 `_sync_progress`：改了 subtasks 就重算，防止客户端的陈旧 progress 覆盖。
    patch.progress = computeProgress(patch.subtasks as Project['subtasks'])
  }

  if (table === 'notes' && 'content' in patch) {
    patch.excerpt = makeExcerpt(patch.content as string | null | undefined)
  }

  await db.table(table).update(id, patch)
  return (await db.table(table).get(id)) as T
}

// ---------------------------------------------------------------- delete

export async function repoRemove(table: TableName, id: number): Promise<boolean> {
  await db.table(table).delete(id)
  return true
}
