import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { useResourceList, useConfirmDelete, useDialogForm } from '@/composables'
import { useSettingsStore } from '@/stores/settings'
import type { Task, TaskPayload, TaskPriority, RecurrenceType } from '@/types/models'

export const commonTags = ['工作', '学习', '生活', '紧急', '重要']

export type TagType = 'success' | 'info' | 'warning' | 'danger' | 'primary' | undefined

export function getPriorityType(priority: string): TagType {
  const map: Record<string, TagType> = {
    urgent: 'danger',
    high: 'warning',
    medium: undefined,
    low: 'info'
  }
  return map[priority]
}

export function getPriorityLabel(priority: string) {
  const map: Record<string, string> = {
    urgent: '紧急',
    high: '高',
    medium: '中',
    low: '低'
  }
  return map[priority] || priority
}

export function getRecurrenceLabel(type: string) {
  const map: Record<string, string> = {
    daily: '每天',
    weekdays: '工作日',
    weekly: '每周',
    monthly: '每月',
    custom: '自定义'
  }
  return map[type] || type
}

export function formatDate(date: string | null | undefined) {
  if (!date) return ''
  return dayjs(date).format('MM-DD HH:mm')
}

export function isOverdue(date: string | null | undefined) {
  if (!date) return false
  return dayjs(date).isBefore(dayjs())
}

export interface TaskFormState {
  title: string
  description: string
  priority: TaskPriority
  status: string
  due_date: string
  tags: string[]
  is_recurring: boolean
  recurrence_type: RecurrenceType
  recurrence_days: number[]
}

export function useTasks() {
  const settingsStore = useSettingsStore()
  const {
    items: tasks,
    loading,
    fetchList,
    create,
    update,
    remove,
    refresh
  } = useResourceList<Task>({ path: '/tasks', pageSize: 200 })

  const { confirmDelete } = useConfirmDelete()
  const taskDialog = useDialogForm<Task>()

  const viewMode = ref<'list' | 'board'>('board')
  const filterStatus = ref('')
  const filterPriority = ref('')
  const statusDialogVisible = ref(false)
  const draggedTask = ref<Task | null>(null)

  // Pinia store ref — drag-reorder mutates it, then persist().
  const taskStatuses = computed(() => settingsStore.taskStatuses)

  const filteredTasks = computed(() => {
    let result = [...tasks.value]
    if (filterStatus.value) {
      result = result.filter(t => t.status === filterStatus.value)
    }
    if (filterPriority.value) {
      result = result.filter(t => t.priority === filterPriority.value)
    }
    return result
  })

  function isCompletedStatus(status: string) {
    const list = taskStatuses.value
    const found = list.find(s => s.value === status)
    return list.indexOf(found!) === list.length - 1
  }

  function getStatusLabel(status: string) {
    return taskStatuses.value.find(s => s.value === status)?.label || status
  }

  function getStatusColor(status: string) {
    return taskStatuses.value.find(s => s.value === status)?.color || '#909399'
  }

  function getColumnTasks(status: string) {
    return filteredTasks.value.filter(t => t.status === status)
  }

  async function submitTask(form: TaskFormState) {
    taskDialog.submitting = true
    try {
      const payload: TaskPayload = {
        title: form.title,
        description: form.description || null,
        priority: form.priority,
        status: form.status,
        due_date: form.due_date || null,
        tags: form.tags,
        is_recurring: form.is_recurring,
        recurrence_type: form.is_recurring ? form.recurrence_type : 'none',
        recurrence_days: form.is_recurring ? form.recurrence_days : null
      }
      if (taskDialog.editing) {
        await update(taskDialog.editing.id, payload)
        ElMessage.success('任务已更新')
      } else {
        await create(payload)
        ElMessage.success('任务已创建')
      }
      taskDialog.close()
    } finally {
      taskDialog.submitting = false
    }
  }

  async function deleteTask(task: Task) {
    if (!(await confirmDelete('确定要删除这个任务吗？'))) return
    await remove(task.id)
    ElMessage.success('任务已删除')
  }

  async function duplicateTask(task: Task) {
    const created = await create({
      title: task.title + ' (副本)',
      description: task.description,
      priority: task.priority,
      status: taskStatuses.value[0]?.value || 'todo',
      tags: task.tags || [],
      is_recurring: false
    })
    if (created) ElMessage.success('任务已复制')
  }

  async function handleStatusChange(task: Task, done: boolean) {
    const list = taskStatuses.value
    const newStatus = done ? list[list.length - 1].value : list[0].value
    const updated = await update(task.id, { status: newStatus }, { refresh: false })
    if (updated) task.status = newStatus
  }

  function setDraggedTask(task: Task | null) {
    draggedTask.value = task
  }

  async function moveTask(task: Task, status: string) {
    if (!task || task.status === status) return
    const oldStatus = task.status
    task.status = status
    const updated = await update(task.id, { status }, { refresh: false })
    if (updated) {
      ElMessage.success(`任务已移动到${getStatusLabel(status)}`)
    } else {
      task.status = oldStatus
    }
  }

  async function saveStatuses() {
    await settingsStore.persist()
    statusDialogVisible.value = false
    ElMessage.success('状态已保存')
  }

  function addStatus(label: string, color: string) {
    if (!label) return
    settingsStore.taskStatuses.push({
      value: `custom_${Date.now()}`,
      label,
      color,
      isDefault: false
    })
    ElMessage.success('状态已添加')
  }

  function removeStatus(index: number) {
    settingsStore.taskStatuses.splice(index, 1)
  }

  function reorderStatus(from: number, to: number) {
    const list = settingsStore.taskStatuses
    if (from < 0 || from === to) return
    const item = list.splice(from, 1)[0]
    list.splice(to, 0, item)
  }

  return {
    tasks,
    loading,
    filteredTasks,
    viewMode,
    filterStatus,
    filterPriority,
    taskStatuses,
    statusDialogVisible,
    draggedTask,
    taskDialog,
    fetchTasks: fetchList,
    refresh,
    isCompletedStatus,
    getStatusLabel,
    getStatusColor,
    getColumnTasks,
    submitTask,
    deleteTask,
    duplicateTask,
    handleStatusChange,
    setDraggedTask,
    moveTask,
    saveStatuses,
    addStatus,
    removeStatus,
    reorderStatus
  }
}

export type TasksController = ReturnType<typeof useTasks>
