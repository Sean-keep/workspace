/**
 * Entity types mirroring backend/app/schemas/*.py.
 * List rows omit heavy fields (e.g. Note.content) — see NoteListItem.
 */

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type RecurrenceType = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'custom'
export type NoteType = 'note' | 'checklist'

export interface TaskStatus {
  value: string
  label: string
  color: string
  isDefault?: boolean
}

export interface ChecklistItem {
  text: string
  checked: boolean
}

export interface Task {
  id: number
  user_id: number
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
  note_type: NoteType
  parent_id: number | null
  tags: string[]
  is_pinned: boolean
  is_favorite: boolean
  excerpt: string | null
  checklist_items: ChecklistItem[] | null
  created_at: string
  updated_at: string
}

/** Full note — `content` is only present after GET /notes/{id} (or create). */
export interface Note extends NoteListItem {
  user_id?: number
  content?: string | null
}

export type NotePayload = Partial<
  Pick<
    Note,
    | 'title'
    | 'content'
    | 'note_type'
    | 'checklist_items'
    | 'parent_id'
    | 'tags'
    | 'is_pinned'
    | 'is_favorite'
  >
>

export interface Event {
  id: number
  user_id: number
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
  user_id: number
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
  user_id: number
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

/** Free-form subtask shape stored on Project.subtasks (backend: List[Any]). */
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
  user_id: number
  name: string
  description: string | null
  status: string
  priority: string
  /** Recomputed server-side from subtasks (status done/completed counts). */
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
