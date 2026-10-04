/**
 * 译自 `backend/app/api/events.py` 的区间钳制。
 *
 * 只改一头时容易把区间弄反。规则：**没被改的那一头**被拉到另一头上 ——
 * 改了 end 就把 start 拉到新的 end，改了 start 就把 end 拉到新的 start。
 */
export function clampEventTimes<T extends { start_time: string; end_time: string }>(
  next: T,
  patch: { start_time?: string; end_time?: string }
): T {
  if (next.end_time >= next.start_time) return next

  if ('end_time' in patch && patch.end_time !== undefined) {
    return { ...next, start_time: next.end_time }
  }
  return { ...next, end_time: next.start_time }
}
