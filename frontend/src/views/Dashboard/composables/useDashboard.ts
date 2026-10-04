import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'
import { repoList } from '@/db/repo'
import {
  getStats,
  getRecentTasks,
  getUpcomingEvents,
  type DashboardStats,
  type RecentTask,
  type UpcomingEvent
} from '@/db/logic/dashboard'

export type { DashboardStats, RecentTask, UpcomingEvent }

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
        getStats(),
        getRecentTasks(),
        getUpcomingEvents(),
        repoList<DashboardProject>('projects', { skip: 0, limit: 200 }).catch(() => ({
          items: [] as DashboardProject[],
          total: 0
        })),
        repoList<RecentNote>('notes', { skip: 0, limit: 200 }).catch(() => ({
          items: [] as RecentNote[],
          total: 0
        }))
      ])

      stats.value = statsRes
      recentTasks.value = tasksRes
      upcomingEvents.value = eventsRes
      projects.value = projectsRes.items
      recentNotes.value = notesRes.items.slice(0, 5)
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
