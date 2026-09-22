import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useResourceList, useConfirmDelete, useDialogForm } from '@/composables'
import type { Project, ProjectSubtask, TaskStatus } from '@/types/models'

export const projectStatuses = [
  { value: 'planning', label: '规划中' },
  { value: 'in_progress', label: '进行中' },
  { value: 'testing', label: '测试中' },
  { value: 'completed', label: '已完成' },
  { value: 'on_hold', label: '已暂停' }
]

export const priorities = [
  { value: 'urgent', label: '紧急' },
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' }
]

const DEFAULT_SUBTASK_STATUSES: TaskStatus[] = [
  { value: 'todo', label: '待办', color: '#909399', isDefault: true },
  { value: 'in_progress', label: '进行中', color: '#e6a23c', isDefault: true },
  { value: 'done', label: '已完成', color: '#67c23a', isDefault: true }
]

const SUBTASK_STATUS_KEY = 'projectSubtaskStatuses'

export type TagType = 'success' | 'info' | 'warning' | 'danger' | 'primary' | undefined

export function getStatusType(status: string): TagType {
  const map: Record<string, TagType> = {
    planning: 'info',
    in_progress: undefined,
    testing: 'warning',
    completed: 'success',
    on_hold: 'danger'
  }
  return map[status] ?? 'info'
}

export function getStatusLabel(status: string) {
  return projectStatuses.find(s => s.value === status)?.label || status
}

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
  return priorities.find(p => p.value === priority)?.label || priority
}

export function getPriorityColor(priority: string) {
  const map: Record<string, string> = {
    urgent: '#f56c6c',
    high: '#e6a23c',
    medium: '#409eff',
    low: '#909399'
  }
  return map[priority] || '#409eff'
}

export function getCompletedTasks(project: Project) {
  return project.subtasks?.filter(t => t.status === 'done').length || 0
}

export function getProjectProgress(project: Project) {
  if (!project.subtasks?.length) return 0
  const completed = project.subtasks.filter(t => t.status === 'done').length
  return Math.round((completed / project.subtasks.length) * 100)
}

export function useProjects() {
  const {
    items: projects,
    loading,
    fetchList,
    create,
    update,
    remove,
    refresh
  } = useResourceList<Project>({ path: '/projects', pageSize: 200 })

  const { confirmDelete } = useConfirmDelete()
  const projectDialog = useDialogForm<Project>()
  const subtaskDialog = useDialogForm<ProjectSubtask>()

  const selectedProject = ref<Project | null>(null)
  const searchQuery = ref('')
  const subtaskViewMode = ref<'kanban' | 'swimlane' | 'list'>('kanban')
  const statusDialogVisible = ref(false)
  const draggedSubtask = ref<ProjectSubtask | null>(null)
  const subtaskStatuses = ref<TaskStatus[]>([...DEFAULT_SUBTASK_STATUSES])

  const filteredProjects = computed(() => {
    let result = [...projects.value]
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      )
    }
    return result
  })

  function loadSubtaskStatuses() {
    const saved = localStorage.getItem(SUBTASK_STATUS_KEY)
    if (saved) {
      try {
        subtaskStatuses.value = JSON.parse(saved)
      } catch {
        // Use defaults
      }
    }
  }

  function saveSubtaskStatuses() {
    localStorage.setItem(SUBTASK_STATUS_KEY, JSON.stringify(subtaskStatuses.value))
    statusDialogVisible.value = false
    ElMessage.success('状态已保存')
  }

  function addSubtaskStatus(label: string, color: string) {
    if (!label) return
    const value = label.toLowerCase().replace(/\s+/g, '_')
    if (subtaskStatuses.value.some(s => s.value === value)) {
      ElMessage.warning('该状态已存在')
      return
    }
    subtaskStatuses.value.push({ value, label, color, isDefault: false })
    ElMessage.success('状态已添加')
  }

  function removeSubtaskStatus(index: number) {
    subtaskStatuses.value.splice(index, 1)
  }

  function reorderSubtaskStatus(from: number, to: number) {
    if (from < 0 || from === to) return
    const item = subtaskStatuses.value.splice(from, 1)[0]
    subtaskStatuses.value.splice(to, 0, item)
  }

  function selectProject(project: Project) {
    selectedProject.value = project
  }

  function syncSelected(updated: Project) {
    const index = projects.value.findIndex(p => p.id === updated.id)
    if (index > -1) projects.value[index] = updated
    if (selectedProject.value?.id === updated.id) {
      selectedProject.value = updated
    }
  }

  async function fetchProjects() {
    await fetchList()
    if (projects.value.length > 0 && !selectedProject.value) {
      selectedProject.value = projects.value[0]
    }
  }

  function getSubtasksByStatus(status: string): ProjectSubtask[] {
    return selectedProject.value?.subtasks?.filter(t => t.status === status) || []
  }

  function getSubtasksByPriorityAndStatus(priority: string, status: string): ProjectSubtask[] {
    return (
      selectedProject.value?.subtasks?.filter(
        t => t.priority === priority && t.status === status
      ) || []
    )
  }

  function getSubtaskStatusColor(status: string) {
    return subtaskStatuses.value.find(s => s.value === status)?.color || '#909399'
  }

  function getSubtaskStatusLabel(status: string) {
    return subtaskStatuses.value.find(s => s.value === status)?.label || status
  }

  async function saveProjectSubtasks() {
    const project = selectedProject.value
    if (!project) return
    const localProgress = getProjectProgress(project)
    project.progress = localProgress
    const index = projects.value.findIndex(p => p.id === project.id)
    if (index > -1) projects.value[index] = { ...project }

    // Server recomputes progress from subtasks — prefer its value on the way back.
    const updated = await update(
      project.id,
      { subtasks: project.subtasks, progress: localProgress },
      { refresh: false }
    )
    if (updated) {
      updated.subtasks = project.subtasks
      syncSelected(updated)
    }
  }

  async function submitSubtask(payload: {
    title: string
    status: string
    priority: string
    assignee: string
    completed: boolean
  }) {
    const project = selectedProject.value
    if (!project) return
    if (!project.subtasks) project.subtasks = []

    if (subtaskDialog.editing) {
      Object.assign(subtaskDialog.editing, payload)
    } else {
      project.subtasks.push({ id: Date.now(), ...payload })
    }
    await saveProjectSubtasks()
    subtaskDialog.close()
    ElMessage.success(subtaskDialog.editing ? '子任务已更新' : '子任务已添加')
  }

  async function deleteSubtask(task: ProjectSubtask) {
    const project = selectedProject.value
    if (!project?.subtasks) return
    const index = project.subtasks.findIndex(t => t.id === task.id)
    if (index > -1) {
      project.subtasks.splice(index, 1)
      await saveProjectSubtasks()
      ElMessage.success('子任务已删除')
    }
  }

  async function moveSubtask(task: ProjectSubtask, patch: { status?: string; priority?: string }) {
    if (!task) return
    Object.assign(task, patch)
    await saveProjectSubtasks()
  }

  function setDraggedSubtask(task: ProjectSubtask | null) {
    draggedSubtask.value = task
  }

  async function submitProject(payload: {
    name: string
    description: string
    status: string
    priority: string
    deadline: string | Date | null
    color: string
    tags: string[]
  }) {
    const editing = projectDialog.editing
    projectDialog.submitting = true
    try {
      const body = {
        ...payload,
        deadline: payload.deadline
          ? typeof payload.deadline === 'string'
            ? payload.deadline
            : payload.deadline.toISOString()
          : null
      }
      if (editing) {
        const updated = await update(editing.id, body, { refresh: false })
        if (updated) {
          updated.subtasks = editing.subtasks
          syncSelected(updated)
        }
        ElMessage.success('项目已更新')
      } else {
        const created = await create({ ...body, progress: 0, subtasks: [], members: 1 }, { refresh: false })
        if (created) {
          projects.value.push(created)
          selectedProject.value = created
        }
        ElMessage.success('项目已创建')
      }
      projectDialog.close()
    } finally {
      projectDialog.submitting = false
    }
  }

  async function deleteProject(project: Project) {
    if (!(await confirmDelete('确定要删除这个项目吗？'))) return
    const ok = await remove(project.id, { refresh: false })
    if (!ok) return
    projects.value = projects.value.filter(p => p.id !== project.id)
    if (selectedProject.value?.id === project.id) {
      selectedProject.value = null
    }
    ElMessage.success('项目已删除')
  }

  return {
    projects,
    loading,
    filteredProjects,
    selectedProject,
    searchQuery,
    subtaskViewMode,
    subtaskStatuses,
    statusDialogVisible,
    draggedSubtask,
    projectDialog,
    subtaskDialog,
    loadSubtaskStatuses,
    saveSubtaskStatuses,
    addSubtaskStatus,
    removeSubtaskStatus,
    reorderSubtaskStatus,
    selectProject,
    fetchProjects,
    refresh,
    getSubtasksByStatus,
    getSubtasksByPriorityAndStatus,
    getSubtaskStatusColor,
    getSubtaskStatusLabel,
    submitSubtask,
    deleteSubtask,
    moveSubtask,
    setDraggedSubtask,
    submitProject,
    deleteProject
  }
}

export type ProjectsController = ReturnType<typeof useProjects>
