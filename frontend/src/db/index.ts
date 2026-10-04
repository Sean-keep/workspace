import Dexie, { type Table } from 'dexie'
import type { Bookmark, Event, Note, Project, Snippet, Task } from '@/types/models'

/**
 * 本地库：六张业务表 + 一张 meta。
 *
 * 后端（FastAPI + MySQL）已从运行时拿掉，这里就是唯一的持久化。
 * 表名沿用后端的复数名，字段保持 snake_case —— 导出的 JSON 备份认它。
 *
 * 索引只给真会被 `where` / `orderBy` 的列；搜索是子串匹配（前端内存 filter，
 * 同 useNotes.ts 的做法），不建全文索引。
 */

/** meta 表：本地 profile / 设置 / 子任务状态的唯一真源。 */
export interface MetaRow {
  key: 'profile' | 'settings' | 'projectSubtaskStatuses'
  value: unknown
}

export class WorkspaceDB extends Dexie {
  tasks!: Table<Task, number>
  events!: Table<Event, number>
  notes!: Table<Note, number>
  bookmarks!: Table<Bookmark, number>
  snippets!: Table<Snippet, number>
  projects!: Table<Project, number>
  meta!: Table<MetaRow, string>

  constructor() {
    super('personal-workspace')
    // ++id = 自增主键，和 types/models.ts 里的 `id: number` 对上。
    this.version(1).stores({
      tasks: '++id, status, priority, due_date, is_pinned, is_recurring, created_at',
      events: '++id, start_time, end_time',
      notes: '++id, parent_id, note_type, is_pinned, is_favorite, updated_at',
      bookmarks: '++id, category, visit_count',
      snippets: '++id, language, updated_at',
      projects: '++id, status, priority, created_at',
      meta: 'key'
    })
  }
}

export const db = new WorkspaceDB()
