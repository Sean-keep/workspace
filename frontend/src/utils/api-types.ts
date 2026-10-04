/**
 * Shared local-store types.
 *
 * 曾经是 HTTP 信封（`{code,msg,data}`）的类型。现在数据直接从 Dexie 出来，
 * 只留下还在被读的两个形状。
 */

export interface Page<T> {
  items: T[]
  total: number
  skip: number
  limit: number
}

export interface NotificationItem {
  id: string
  title: string
  time: string
  icon: string
  color: string
  link: string
}
