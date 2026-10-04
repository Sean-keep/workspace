import { db } from '@/db'
import type { RecurrenceType, Task } from '@/types/models'

/**
 * 循环任务重置 —— 逐行译自 `backend/app/utils/recurring.py`。
 *
 * 已完成的循环任务，在下一个周期到来时回到「待办」。日期比较一律用 **UTC 日历日**，
 * 和后端、和 `backend/tests/test_recurring.py` 保持一致 —— 改成会立刻漂移。
 */

/** 后端 `_utc_today()`：`datetime.now(timezone.utc).date()` */
export function utcToday(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

/**
 * 把 `last_completed` 归一成 UTC 日历日。
 * 后端对 aware/naive 分开处理；JS 的 Date 一律带时区，`toISOString()` 就是 UTC。
 */
function utcDateOf(iso: string | null): Date | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function sameDay(a: Date, b: Date): boolean {
  return a.getTime() === b.getTime()
}

/**
 * Python `date.weekday()` 空间：**Monday=0**。
 * JS `getUTCDay()` 是 Sunday=0 —— 直接比会把自定义循环的日子整体错开一天。
 * `recurrence_days` 存的是 Python 空间（模型注释：`[0,1,2,3,4] = Mon-Fri`）。
 */
function pythonWeekday(d: Date): number {
  return (d.getUTCDay() + 6) % 7
}

/**
 * 这条循环任务该不该被打回「待办」。
 *
 * 规则（和后端一一对应）：
 * - 非循环 / recurrence_type==='none' → 永不
 * - 没有 last_completed → 只有 status==='done' 时才打回
 * - last_completed 就是今天 → 不动
 * - daily → 立刻；weekdays → 今天是周一~五；weekly → 同星期几；monthly → 同日号；
 *   custom → 今天在 recurrence_days 里
 */
export function shouldResetRecurringTask(
  task: Pick<Task, 'is_recurring' | 'recurrence_type' | 'status' | 'last_completed' | 'recurrence_days'>,
  today: Date = utcToday()
): boolean {
  if (!task.is_recurring || task.recurrence_type === 'none') return false

  const lastCompletedDate = utcDateOf(task.last_completed)

  if (!lastCompletedDate) {
    return task.status === 'done'
  }

  if (sameDay(lastCompletedDate, today)) return false

  const type: RecurrenceType = task.recurrence_type

  if (type === 'daily') return true

  if (type === 'weekdays') return today.getUTCDay() >= 1 && today.getUTCDay() <= 5

  if (type === 'weekly') return today.getUTCDay() === lastCompletedDate.getUTCDay()

  if (type === 'monthly') return today.getUTCDate() === lastCompletedDate.getUTCDate()

  if (type === 'custom' && task.recurrence_days?.length) {
    return task.recurrence_days.includes(pythonWeekday(today))
  }

  return false
}

/**
 * 把所有到期的循环任务打回「待办」。返回重置条数。
 *
 * 后端在每次任务列表之前跑一遍（所以每行每周期只重置一次，不受分页影响）——
 * `repo.ts` 的 tasks 列表钩子保持同样的调用时机。
 */
export async function resetRecurringTasks(today: Date = utcToday()): Promise<number> {
  const rows = await db.tasks.filter((t) => !!t.is_recurring).toArray()
  const due = rows.filter((t) => shouldResetRecurringTask(t, today))
  if (!due.length) return 0

  await db.tasks.bulkPut(
    due.map((t) => ({ ...t, status: 'todo', completed_at: null }))
  )
  return due.length
}
