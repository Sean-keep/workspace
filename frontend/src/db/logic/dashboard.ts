import { db } from '@/db'
import type { Event, Task } from '@/types/models'
import type { NotificationItem } from '@/utils/api-types'

/**
 * 仪表盘聚合 —— 逐条译自 `backend/app/api/dashboard.py`。
 *
 * 原来是 SQL 的 count / GROUP BY；现在是对本地表做一次内存遍历。
 * 输出形状和旧接口完全一致，六个 Dashboard 组件不用动。
 */

/** 后端的终态 / 进行中判定。 */
export const TERMINAL_STATUSES = new Set(['done', 'completed'])
export const PENDING_STATUSES = new Set(['todo', 'in_progress'])

export interface DashboardStats {
  tasks?: { total: number; completed: number; pending: number; completion_rate: number }
  events?: { today: number; upcoming: number }
  notes?: number
  bookmarks?: number
  snippets?: number
  task_trend?: { date: string; count: number }[]
}

export interface RecentTask {
  id: number
  title: string
  status: string
  priority: string | null
  due_date: string | null
}

export interface UpcomingEvent {
  id: number
  title: string
  start_time: string
  end_time: string
  color: string | null
  is_all_day?: boolean
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

/** `MM-DD`，和后端 `day.strftime("%m-%d")` 一致。 */
function mmdd(d: Date): string {
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${m}-${day}`
}

export async function getStats(now: Date = new Date()): Promise<DashboardStats> {
  const [tasks, events, notes, bookmarks, snippets] = await Promise.all([
    db.tasks.toArray(),
    db.events.toArray(),
    db.notes.count(),
    db.bookmarks.count(),
    db.snippets.count()
  ])

  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => TERMINAL_STATUSES.has(t.status)).length
  const pendingTasks = tasks.filter((t) => PENDING_STATUSES.has(t.status)).length

  const todayStart = startOfUtcDay(now)
  const todayEnd = new Date(todayStart.getTime() + 24 * 3600 * 1000)
  const weekEnd = new Date(todayStart.getTime() + 7 * 24 * 3600 * 1000)

  const windowEvents = events.filter((e) => {
    const start = new Date(e.start_time).getTime()
    return start >= todayStart.getTime() && start < weekEnd.getTime()
  })
  const todayEvents = windowEvents.filter(
    (e) => new Date(e.start_time).getTime() < todayEnd.getTime()
  ).length

  // 近 7 天完成趋势：按 completed_at 的 UTC 日历日归桶。
  const trendStart = new Date(todayStart.getTime() - 6 * 24 * 3600 * 1000)
  const countsByDay = new Map<string, number>()
  for (const t of tasks) {
    if (!TERMINAL_STATUSES.has(t.status) || !t.completed_at) continue
    const completed = new Date(t.completed_at)
    const ts = completed.getTime()
    if (ts < trendStart.getTime() || ts >= todayEnd.getTime()) continue
    const key = mmdd(startOfUtcDay(completed))
    countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1)
  }

  const task_trend: { date: string; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const day = new Date(todayStart.getTime() - i * 24 * 3600 * 1000)
    task_trend.push({ date: mmdd(day), count: countsByDay.get(mmdd(day)) ?? 0 })
  }

  return {
    tasks: {
      total: totalTasks,
      completed: completedTasks,
      pending: pendingTasks,
      completion_rate: totalTasks ? Math.round((completedTasks / totalTasks) * 1000) / 10 : 0
    },
    events: { today: todayEvents, upcoming: windowEvents.length },
    notes,
    bookmarks,
    snippets,
    task_trend
  }
}

/** 待办任务：置顶 → 无到期 → 到期早 → 新建晚。 */
export async function getRecentTasks(limit = 5): Promise<RecentTask[]> {
  const rows = await db.tasks.filter((t) => PENDING_STATUSES.has(t.status)).toArray()
  rows.sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
    const aDue = a.due_date ? new Date(a.due_date).getTime() : Number.POSITIVE_INFINITY
    const bDue = b.due_date ? new Date(b.due_date).getTime() : Number.POSITIVE_INFINITY
    if (aDue !== bDue) return aDue - bDue
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
  return rows.slice(0, limit).map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority ?? null,
    due_date: t.due_date ?? null
  }))
}

/** 还没结束的日程，按开始时间。 */
export async function getUpcomingEvents(limit = 5, now: Date = new Date()): Promise<UpcomingEvent[]> {
  const rows = await db.events.filter((e) => new Date(e.end_time).getTime() >= now.getTime()).toArray()
  rows.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
  return rows.slice(0, limit).map((e) => ({
    id: e.id,
    title: e.title,
    start_time: e.start_time,
    end_time: e.end_time,
    color: e.color ?? null,
    is_all_day: e.is_all_day
  }))
}

/**
 * 通知 = 真实数据派生（逾期任务 + 今日日程），按时间排序。
 * 形状即 `utils/api-types.ts` 的 `NotificationItem`。
 */
export async function getNotifications(limit = 10, now: Date = new Date()): Promise<NotificationItem[]> {
  const todayStart = startOfUtcDay(now)
  const tomorrow = new Date(todayStart.getTime() + 24 * 3600 * 1000)
  const items: NotificationItem[] = []

  const overdue: Task[] = (await db.tasks.filter((t) => PENDING_STATUSES.has(t.status)).toArray())
    .filter((t) => t.due_date && new Date(t.due_date).getTime() < now.getTime())
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, limit)

  for (const task of overdue) {
    items.push({
      id: `task-overdue-${task.id}`,
      title: `任务已逾期：${task.title}`,
      time: task.due_date!,
      icon: 'WarningFilled',
      color: '#f56c6c',
      link: '/tasks'
    })
  }

  const todays: Event[] = (await db.events.toArray())
    .filter((e) => {
      const start = new Date(e.start_time).getTime()
      return start >= todayStart.getTime() && start < tomorrow.getTime()
    })
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, limit)

  for (const event of todays) {
    items.push({
      id: `event-today-${event.id}`,
      title: `今日日程：${event.title}`,
      time: event.start_time,
      icon: 'Calendar',
      color: event.color || '#409eff',
      link: '/calendar'
    })
  }

  items.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
  return items.slice(0, limit)
}
