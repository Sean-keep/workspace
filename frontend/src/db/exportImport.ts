import { Directory, Filesystem } from '@capacitor/filesystem'
import { Capacitor } from '@capacitor/core'
import { db } from './index'
import type { TaskStatus } from '@/types/models'
import type { Bookmark, Event, Note, Project, Snippet, Task } from '@/types/models'

/**
 * 全量 JSON 备份 / 还原。
 *
 * 数据只在本机 IndexedDB —— 换手机、清数据、换浏览器都靠这个文件。
 * **只支持整体覆盖（replace），不做 merge**：merge 要重映射 ID，还表达不了
 * 「用户删过一条」。replace 才是真还原。
 */

export interface BackupFile {
  app: 'personal-workspace'
  version: 1
  exported_at: string
  data: {
    tasks: Task[]
    events: Event[]
    notes: Note[]
    bookmarks: Bookmark[]
    snippets: Snippet[]
    projects: Project[]
    settings: {
      theme: string
      primaryColor: string
      fontSize: string
      taskStatuses: TaskStatus[]
    }
    profile: { username: string; email: string; avatar: string }
    /** `useProjects` 在 localStorage 里另存的子任务状态，原样带走 */
    projectSubtaskStatuses?: unknown
  }
}

export const BACKUP_FILENAME = 'personal-workspace-backup.json'

export async function exportAll(): Promise<BackupFile> {
  const [tasks, events, notes, bookmarks, snippets, projects, settingsRow, profileRow] =
    await Promise.all([
      db.tasks.toArray(),
      db.events.toArray(),
      db.notes.toArray(),
      db.bookmarks.toArray(),
      db.snippets.toArray(),
      db.projects.toArray(),
      db.meta.get('settings'),
      db.meta.get('profile')
    ])

  const settings = (settingsRow?.value ?? {}) as BackupFile['data']['settings']
  const profile = (profileRow?.value ?? {}) as BackupFile['data']['profile']

  let projectSubtaskStatuses: unknown
  try {
    const raw = localStorage.getItem('projectSubtaskStatuses')
    if (raw) projectSubtaskStatuses = JSON.parse(raw)
  } catch {
    /* 坏了就不带走 */
  }

  return {
    app: 'personal-workspace',
    version: 1,
    exported_at: new Date().toISOString(),
    data: {
      tasks,
      events,
      notes,
      bookmarks,
      snippets,
      projects,
      settings,
      profile,
      projectSubtaskStatuses
    }
  }
}

/** 只认自己导出的文件 —— 外来的/损坏的直接拒，中文错误由调用方 toast。 */
export function assertBackupFile(raw: unknown): asserts raw is BackupFile {
  const f = raw as BackupFile
  if (!f || typeof f !== 'object') throw new Error('不是有效的备份文件')
  if (f.app !== 'personal-workspace') throw new Error('不是「个人工作台」的备份文件')
  if (f.version !== 1) throw new Error(`不支持的备份版本：${String(f.version)}`)
  if (!f.data || typeof f.data !== 'object') throw new Error('备份文件缺少数据段')
}

export async function importAll(file: BackupFile): Promise<void> {
  assertBackupFile(file)
  const d = file.data

  await db.transaction(
    'rw',
    [db.tasks, db.events, db.notes, db.bookmarks, db.snippets, db.projects, db.meta],
    async () => {
      await Promise.all([
        db.tasks.clear(),
        db.events.clear(),
        db.notes.clear(),
        db.bookmarks.clear(),
        db.snippets.clear(),
        db.projects.clear()
      ])

      if (d.tasks?.length) await db.tasks.bulkPut(d.tasks)
      if (d.events?.length) await db.events.bulkPut(d.events)
      if (d.notes?.length) await db.notes.bulkPut(d.notes)
      if (d.bookmarks?.length) await db.bookmarks.bulkPut(d.bookmarks)
      if (d.snippets?.length) await db.snippets.bulkPut(d.snippets)
      if (d.projects?.length) await db.projects.bulkPut(d.projects)

      if (d.settings) await db.meta.put({ key: 'settings', value: d.settings })
      if (d.profile) await db.meta.put({ key: 'profile', value: d.profile })
    }
  )

  // localStorage 缓存跟着回写，不然刷新后主题/子任务状态会跳回旧值。
  if (d.settings) {
    localStorage.setItem('theme', String(d.settings.theme ?? 'light'))
    localStorage.setItem('primaryColor', String(d.settings.primaryColor ?? '#409eff'))
    localStorage.setItem('fontSize', String(d.settings.fontSize ?? '14px'))
    if (d.settings.taskStatuses) {
      localStorage.setItem('taskStatuses', JSON.stringify(d.settings.taskStatuses))
    }
  }
  if (d.projectSubtaskStatuses !== undefined) {
    localStorage.setItem('projectSubtaskStatuses', JSON.stringify(d.projectSubtaskStatuses))
  }
}

// ---------------------------------------------------------------- 文件 I/O

function downloadWeb(filename: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * 导出到文件。原生端写到「文档」目录，Web 端走浏览器下载。
 * 返回用户能理解的落点描述（用于成功提示）。
 */
export async function saveBackup(file: BackupFile): Promise<string> {
  const text = JSON.stringify(file, null, 2)

  if (Capacitor.isNativePlatform()) {
    const result = await Filesystem.writeFile({
      path: BACKUP_FILENAME,
      data: text,
      directory: Directory.Documents,
      encoding: 'utf8' as never
    })
    return result.uri
  }

  downloadWeb(BACKUP_FILENAME, text)
  return BACKUP_FILENAME
}

/** 从用户选的文件读出备份（校验留给 `importAll`）。 */
export async function readBackupFile(file: File): Promise<BackupFile> {
  const text = await file.text()
  return JSON.parse(text) as BackupFile
}
