import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import api from '@/utils/api'

export interface TaskStatus {
  value: string
  label: string
  color: string
  isDefault?: boolean
}

export interface UserSettings {
  theme: 'light' | 'dark'
  primaryColor: string
  fontSize: string
  taskStatuses: TaskStatus[]
}

export const DEFAULT_TASK_STATUSES: TaskStatus[] = [
  { value: 'todo', label: '待办', color: '#909399', isDefault: true },
  { value: 'in_progress', label: '进行中', color: '#e6a23c' },
  { value: 'done', label: '已完成', color: '#67c23a' }
]

function readLocal(): Partial<UserSettings> {
  const out: Partial<UserSettings> = {}
  const theme = localStorage.getItem('theme')
  if (theme === 'light' || theme === 'dark') out.theme = theme
  const primaryColor = localStorage.getItem('primaryColor')
  if (primaryColor) out.primaryColor = primaryColor
  const fontSize = localStorage.getItem('fontSize')
  if (fontSize) out.fontSize = fontSize
  try {
    const statuses = localStorage.getItem('taskStatuses')
    if (statuses) out.taskStatuses = JSON.parse(statuses)
  } catch {
    /* fall through to defaults */
  }
  return out
}

/**
 * Appearance + per-user preferences.
 *
 * Local storage is only a cache so a hard refresh keeps the theme before
 * `/auth/me` resolves; the server copy (`users.settings`) is the source of
 * truth and wins whenever it disagrees.
 */
export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<'light' | 'dark'>('light')
  const primaryColor = ref('#409eff')
  const fontSize = ref('14px')
  const taskStatuses = ref<TaskStatus[]>([...DEFAULT_TASK_STATUSES])
  const loaded = ref(false)

  function applyAppearance() {
    document.documentElement.classList.toggle('dark', theme.value === 'dark')
    document.documentElement.style.setProperty('--el-color-primary', primaryColor.value)
    document.documentElement.style.setProperty('--primary-color', primaryColor.value)
    document.documentElement.style.setProperty('--font-size', fontSize.value)
    document.documentElement.style.fontSize = fontSize.value
  }

  function patch(values: Partial<UserSettings>) {
    if (values.theme) theme.value = values.theme
    if (values.primaryColor) primaryColor.value = values.primaryColor
    if (values.fontSize) fontSize.value = values.fontSize
    if (values.taskStatuses?.length) taskStatuses.value = values.taskStatuses
    applyAppearance()
    cacheLocal()
  }

  function cacheLocal() {
    localStorage.setItem('theme', theme.value)
    localStorage.setItem('primaryColor', primaryColor.value)
    localStorage.setItem('fontSize', fontSize.value)
    localStorage.setItem('taskStatuses', JSON.stringify(taskStatuses.value))
  }

  async function load() {
    patch(readLocal())
    try {
      const res: any = await api.get('/auth/me')
      const server = (res.data?.settings || {}) as Partial<UserSettings>
      patch(server)
    } catch {
      // offline / not logged in — local cache already applied
    } finally {
      loaded.value = true
    }
  }

  async function persist() {
    cacheLocal()
    const settings: UserSettings = {
      theme: theme.value,
      primaryColor: primaryColor.value,
      fontSize: fontSize.value,
      taskStatuses: taskStatuses.value
    }
    await api.put('/auth/me', { settings })
  }

  // Keep the cache fresh whenever a value is edited in place.
  watch([theme, primaryColor, fontSize, taskStatuses], () => cacheLocal(), { deep: true })

  return {
    theme,
    primaryColor,
    fontSize,
    taskStatuses,
    loaded,
    DEFAULT_TASK_STATUSES,
    applyAppearance,
    patch,
    load,
    persist
  }
})
