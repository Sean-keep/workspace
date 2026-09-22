/**
 * Shared API envelope types.
 *
 * Every backend response — success or failure — has the shape:
 *   { code: number, msg: string, data: T | null }
 * `api.ts` unwraps successes so `res` is already `{ code, msg, data }` and
 * `res.data` is the payload. List endpoints return:
 *   { items: T[], total: number, skip: number, limit: number }
 */
export interface Envelope<T = unknown> {
  code: number
  msg: string
  data: T
}

export interface Page<T> {
  items: T[]
  total: number
  skip: number
  limit: number
}

export interface AuthPayload {
  user: {
    id: number
    username: string
    email: string
    avatar: string | null
    settings: Record<string, unknown>
    is_active: boolean
    created_at: string
    updated_at: string
  }
  access_token: string
  refresh_token: string
  token_type: string
}

export interface NotificationItem {
  id: string
  title: string
  time: string
  icon: string
  color: string
  link: string
}

/** List endpoints now always paginate — use this at every fetch call site. */
export function pageItems<T>(res: unknown, fallback: T[] = []): T[] {
  const data = (res as Envelope<Page<T> | T[]> | undefined)?.data
  if (Array.isArray(data)) return data
  return data?.items ?? fallback
}
