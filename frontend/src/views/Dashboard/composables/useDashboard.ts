import { ref, onMounted } from 'vue'
import api from '@/utils/api'
import { pageItems } from '@/utils/api-types'
import dayjs from 'dayjs'

export interface DashboardStats {
  tasks?: { total: number; completed: number; pending: number; completion_rate: number }
  events?: { today: number; upcoming: number }
  notes?: number
  bookmarks?: number
  snippets?: number
  task_trend?: { date: string; count: number }[]
}

export interface RecentTask {
  id: number
  title: string
  status: string
  priority: string | null
  due_date: string | null
}

export interface UpcomingEvent {
  id: number
  title: string
  start_time: string
  end_time: string
  color: string | null
  is_all_day?: boolean
}

export interface DashboardProject {
  id: number
  name: string
  color: string | null
  progress?: number
  subtasks?: { status: string }[]
}

export interface RecentNote {
  id: number
  title: string
  created_at: string
  updated_at: string | null
}

export function useDashboard() {
  const stats = ref<DashboardStats>({})
  const recentTasks = ref<RecentTask[]>([])
  const upcomingEvents = ref<UpcomingEvent[]>([])
  const projects = ref<DashboardProject[]>([])
  const recentNotes = ref<RecentNote[]>([])

  async function fetchDashboardData() {
    try {
      const [statsRes, tasksRes, eventsRes, projectsRes, notesRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/recent-tasks'),
        api.get('/dashboard/upcoming-events'),
        api.get('/projects').catch(() => ({ data: [] })),
        api.get('/notes').catch(() => ({ data: [] }))
      ])

      stats.value = (statsRes as { data?: DashboardStats }).data || {}
      recentTasks.value = (tasksRes as { data?: RecentTask[] }).data || []
      upcomingEvents.value = (eventsRes as { data?: UpcomingEvent[] }).data || []
      // List endpoints are paginated envelopes ({ items, total, skip, limit }).
      projects.value = pageItems<DashboardProject>(projectsRes)
      recentNotes.value = pageItems<RecentNote>(notesRes).slice(0, 5)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    }
  }

  onMounted(fetchDashboardData)

  return { stats, recentTasks, upcomingEvents, projects, recentNotes }
}

export function formatDate(date: string) {
  return dayjs(date).format('MM-DD HH:mm')
}

export function formatEventTime(event: UpcomingEvent) {
  if (event.is_all_day) return '全天'
  const start = dayjs(event.start_time)
  const end = dayjs(event.end_time)
  return `${start.format('MM/DD HH:mm')} - ${end.format('HH:mm')}`
}

export function getTaskStatusColor(status: string) {
  const map: Record<string, string> = {
    todo: '#909399',
    in_progress: '#e6a23c',
    done: '#67c23a'
  }
  return map[status] || '#409eff'
}

export function getPriorityType(priority: string | null) {
  const map: Record<string, 'danger' | 'warning' | 'info'> = {
    urgent: 'danger',
    high: 'warning',
    low: 'info'
  }
  return priority ? map[priority] : undefined
}

export function getPriorityLabel(priority: string | null) {
  const map: Record<string, string> = {
    urgent: '紧急',
    high: '高',
    medium: '中',
    low: '低'
  }
  return (priority && map[priority]) || priority || ''
}

export function getProjectProgress(project: DashboardProject) {
  if (!project.subtasks?.length) return project.progress ?? 0
  const completed = project.subtasks.filter((t) => t.status === 'done').length
  return Math.round((completed / project.subtasks.length) * 100)
}

export function getProjectCompletedCount(project: DashboardProject) {
  return project.subtasks?.filter((t) => t.status === 'done').length ?? 0
}
