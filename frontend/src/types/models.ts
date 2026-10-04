/**
 * Entity types for the local Dexie store (see `src/db/index.ts`).
 *
 * 曾经镜像 `backend/app/schemas/*.py`；后端已经从运行时拿掉，这些现在是
 * IndexedDB 行的形状。字段名保持 snake_case —— 和旧后端一致，导出的 JSON
 * 备份也认它。
 *
 * List rows omit heavy fields (e.g. Note.content) — see NoteListItem.
 */

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type RecurrenceType = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'custom'

export interface TaskStatus {
  value: string
  label: string
  color: string
  isDefault?: boolean
}

export interface Task {
  id: number
  title: string
  description: string | null
  status: string
  priority: TaskPriority
  due_date: string | null
  tags: string[]
  is_pinned: boolean
  is_recurring: boolean
  recurrence_type: RecurrenceType
  recurrence_days: number[] | null
  last_completed: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type TaskPayload = Partial<
  Pick<
    Task,
    | 'title'
    | 'description'
    | 'status'
    | 'priority'
    | 'due_date'
    | 'tags'
    | 'is_pinned'
    | 'is_recurring'
    | 'recurrence_type'
    | 'recurrence_days'
  >
>

/** List row without the note body. */
export interface NoteListItem {
  id: number
  title: string
  parent_id: number | null
  tags: string[]
  is_pinned: boolean
  is_favorite: boolean
  excerpt: string | null
  created_at: string
  updated_at: string
}

/** Full note — `content` is only present after `repoGet` (or create). */
export interface Note extends NoteListItem {
  content?: string | null
}

export type NotePayload = Partial<
  Pick<
    Note,
    'title' | 'content' | 'parent_id' | 'tags' | 'is_pinned' | 'is_favorite'
  >
>

export interface Event {
  id: number
  title: string
  description: string | null
  start_time: string
  end_time: string
  location: string | null
  is_all_day: boolean
  reminder_minutes: number
  color: string
  recurrence: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export type EventPayload = Partial<
  Pick<
    Event,
    | 'title'
    | 'description'
    | 'start_time'
    | 'end_time'
    | 'location'
    | 'is_all_day'
    | 'reminder_minutes'
    | 'color'
    | 'recurrence'
  >
>

export interface Bookmark {
  id: number
  url: string
  title: string
  description: string | null
  category: string
  favicon: string | null
  tags: string[]
  visit_count: number
  created_at: string
  updated_at: string
}

export type BookmarkPayload = Partial<
  Pick<Bookmark, 'url' | 'title' | 'description' | 'category' | 'favicon' | 'tags'>
>

export interface Snippet {
  id: number
  title: string
  description: string | null
  language: string
  code: string
  tags: string[]
  is_public: boolean
  created_at: string
  updated_at: string
}

export type SnippetPayload = Partial<
  Pick<Snippet, 'title' | 'description' | 'language' | 'code' | 'tags' | 'is_public'>
>

/** Free-form subtask shape stored on Project.subtasks. */
export interface ProjectSubtask {
  id: number | string
  title: string
  status: string
  priority: string
  assignee?: string
  completed?: boolean
}

export interface Project {
  id: number
  name: string
  description: string | null
  status: string
  priority: string
  /** Recomputed from subtasks whenever `subtasks` is written (status done/completed counts). */
  progress: number
  deadline: string | null
  color: string
  tags: string[]
  members: number
  subtasks: ProjectSubtask[]
  created_at: string
  updated_at: string
}

export type ProjectPayload = Partial<
  Pick<
    Project,
    | 'name'
    | 'description'
    | 'status'
    | 'priority'
    | 'progress'
    | 'deadline'
    | 'color'
    | 'tags'
    | 'members'
    | 'subtasks'
  >
>
