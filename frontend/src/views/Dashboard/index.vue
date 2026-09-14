<template>
  <div class="dashboard">
    <!-- Stats Cards -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover" @click="router.push('/tasks')">
          <div class="stat-icon" style="background-color: #409eff22; color: #409eff">
            <el-icon :size="24"><List /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.tasks?.pending || 0 }}</div>
            <div class="stat-label">待办任务</div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card" shadow="hover" @click="router.push('/calendar')">
          <div class="stat-icon" style="background-color: #67c23a22; color: #67c23a">
            <el-icon :size="24"><Calendar /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.events?.today || 0 }}</div>
            <div class="stat-label">今日日程</div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card" shadow="hover" @click="router.push('/projects')">
          <div class="stat-icon" style="background-color: #e6a23c22; color: #e6a23c">
            <el-icon :size="24"><Folder /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ projects.length || 0 }}</div>
            <div class="stat-label">进行中项目</div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card" shadow="hover" @click="router.push('/notes')">
          <div class="stat-icon" style="background-color: #f56c6c22; color: #f56c6c">
            <el-icon :size="24"><Notebook /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.notes || 0 }}</div>
            <div class="stat-label">笔记数量</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <!-- Recent Tasks -->
      <el-col :span="8">
        <el-card class="list-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><List /></el-icon> 待办任务</span>
              <el-button type="primary" link @click="router.push('/tasks')">查看全部</el-button>
            </div>
          </template>
          <div class="task-list">
            <div
              v-for="task in recentTasks"
              :key="task.id"
              class="task-item"
            >
              <div class="task-status" :style="{ backgroundColor: getTaskStatusColor(task.status) }"></div>
              <div class="task-content">
                <div class="task-title">{{ task.title }}</div>
                <div class="task-meta">
                  <el-tag :type="getPriorityType(task.priority)" size="small" effect="plain">
                    {{ getPriorityLabel(task.priority) }}
                  </el-tag>
                  <span v-if="task.due_date" class="task-due">
                    <el-icon :size="12"><Clock /></el-icon>
                    {{ formatDate(task.due_date) }}
                  </span>
                </div>
              </div>
            </div>
            <el-empty v-if="recentTasks.length === 0" description="暂无待办任务" :image-size="60" />
          </div>
        </el-card>
      </el-col>

      <!-- Upcoming Events -->
      <el-col :span="8">
        <el-card class="list-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><Calendar /></el-icon> 近期日程</span>
              <el-button type="primary" link @click="router.push('/calendar')">查看全部</el-button>
            </div>
          </template>
          <div class="event-list">
            <div
              v-for="event in upcomingEvents"
              :key="event.id"
              class="event-item"
            >
              <div class="event-indicator" :style="{ backgroundColor: event.color || '#409eff' }"></div>
              <div class="event-content">
                <div class="event-title">{{ event.title }}</div>
                <div class="event-time">
                  <el-icon :size="12"><Clock /></el-icon>
                  {{ formatEventTime(event) }}
                </div>
              </div>
            </div>
            <el-empty v-if="upcomingEvents.length === 0" description="暂无近期日程" :image-size="60" />
          </div>
        </el-card>
      </el-col>

      <!-- Projects Overview -->
      <el-col :span="8">
        <el-card class="list-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><Folder /></el-icon> 项目进度</span>
              <el-button type="primary" link @click="router.push('/projects')">查看全部</el-button>
            </div>
          </template>
          <div class="project-list">
            <div
              v-for="project in projects.slice(0, 5)"
              :key="project.id"
              class="project-item"
              @click="router.push('/projects')"
            >
              <div class="project-info">
                <div class="project-name">
                  <span class="project-dot" :style="{ backgroundColor: project.color || '#409eff' }"></span>
                  {{ project.name }}
                </div>
                <span class="project-count">{{ getProjectCompletedCount(project) }}/{{ project.subtasks?.length || 0 }}</span>
              </div>
              <el-progress
                :percentage="getProjectProgress(project)"
                :stroke-width="6"
                :show-text="false"
              />
            </div>
            <el-empty v-if="projects.length === 0" description="暂无项目" :image-size="60" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt-16">
      <!-- Task Completion Trend -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><TrendCharts /></el-icon> 任务完成趋势</span>
              <span class="chart-subtitle">近7天</span>
            </div>
          </template>
          <div class="trend-chart">
            <div class="trend-bars">
              <div
                v-for="(item, index) in stats.task_trend"
                :key="index"
                class="trend-bar-wrapper"
              >
                <div class="trend-bar-container">
                  <div
                    class="trend-bar"
                    :style="{ height: getBarHeight(item.count) + '%' }"
                  ></div>
                </div>
                <div class="trend-label">{{ item.date }}</div>
                <div class="trend-value">{{ item.count }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- Recent Notes -->
      <el-col :span="12">
        <el-card class="list-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><Notebook /></el-icon> 最近笔记</span>
              <el-button type="primary" link @click="router.push('/notes')">查看全部</el-button>
            </div>
          </template>
          <div class="notes-list">
            <div
              v-for="note in recentNotes"
              :key="note.id"
              class="note-item"
              @click="router.push('/notes')"
            >
              <div class="note-icon">
                <el-icon :size="16"><Document /></el-icon>
              </div>
              <div class="note-content">
                <div class="note-title">{{ note.title }}</div>
                <div class="note-time">{{ formatDate(note.updated_at || note.created_at) }}</div>
              </div>
            </div>
            <el-empty v-if="recentNotes.length === 0" description="暂无笔记" :image-size="60" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { List, Calendar, Folder, Notebook, Clock, Document, TrendCharts } from '@element-plus/icons-vue'
import api from '@/utils/api'
import dayjs from 'dayjs'

const router = useRouter()

const stats = ref<any>({})
const recentTasks = ref<any[]>([])
const upcomingEvents = ref<any[]>([])
const projects = ref<any[]>([])
const recentNotes = ref<any[]>([])

onMounted(() => {
  fetchDashboardData()
})

async function fetchDashboardData() {
  try {
    const [statsRes, tasksRes, eventsRes, projectsRes, notesRes] = await Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/recent-tasks'),
      api.get('/dashboard/upcoming-events'),
      api.get('/projects').catch(() => ({ data: [] })),
      api.get('/notes').catch(() => ({ data: [] }))
    ])

    stats.value = (statsRes as any).data || {}
    recentTasks.value = (tasksRes as any).data || []
    upcomingEvents.value = (eventsRes as any).data || []
    projects.value = (projectsRes as any).data || []
    recentNotes.value = ((notesRes as any).data || []).slice(0, 5)
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
  }
}

function getTaskStatusColor(status: string) {
  const map: Record<string, string> = {
    todo: '#909399',
    in_progress: '#e6a23c',
    done: '#67c23a'
  }
  return map[status] || '#409eff'
}

function getPriorityType(priority: string) {
  const map: Record<string, string> = {
    urgent: 'danger',
    high: 'warning',
    medium: '',
    low: 'info'
  }
  return map[priority] || ''
}

function getPriorityLabel(priority: string) {
  const map: Record<string, string> = {
    urgent: '紧急',
    high: '高',
    medium: '中',
    low: '低'
  }
  return map[priority] || priority
}

function formatDate(date: string) {
  return dayjs(date).format('MM-DD HH:mm')
}

function formatEventTime(event: any) {
  if (event.is_all_day) return '全天'
  const start = dayjs(event.start_time)
  const end = dayjs(event.end_time)
  return `${start.format('MM/DD HH:mm')} - ${end.format('HH:mm')}`
}

function getProjectProgress(project: any) {
  if (!project.subtasks || project.subtasks.length === 0) return 0
  const completed = project.subtasks.filter((t: any) => t.status === 'done').length
  return Math.round((completed / project.subtasks.length) * 100)
}

function getProjectCompletedCount(project: any) {
  if (!project.subtasks) return 0
  return project.subtasks.filter((t: any) => t.status === 'done').length
}

function getBarHeight(count: number) {
  const maxCount = Math.max(...(stats.value.task_trend?.map((t: any) => t.count) || [1]), 1)
  return Math.max((count / maxCount) * 100, 5)
}
</script>

<style scoped lang="scss">
.dashboard {
  .stats-row {
    margin-bottom: 16px;
  }

  .stat-card {
    cursor: pointer;
    transition: transform 0.2s;

    &:hover {
      transform: translateY(-2px);
    }

    :deep(.el-card__body) {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px;
    }
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stat-info {
    .stat-value {
      font-size: 24px;
      font-weight: 600;
      color: #303133;
    }

    .stat-label {
      font-size: 13px;
      color: #909399;
      margin-top: 2px;
    }
  }

  .list-card {
    height: 380px;

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      span {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
      }
    }
  }

  .task-list, .event-list, .project-list, .notes-list {
    height: 300px;
    overflow-y: auto;
  }

  .task-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    .task-status {
      width: 4px;
      height: 32px;
      border-radius: 2px;
      margin-top: 2px;
    }

    .task-content {
      flex: 1;

      .task-title {
        font-size: 13px;
        color: #303133;
        margin-bottom: 4px;
      }

      .task-meta {
        display: flex;
        align-items: center;
        gap: 8px;

        .task-due {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }

  .event-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    .event-indicator {
      width: 4px;
      height: 32px;
      border-radius: 2px;
      margin-top: 2px;
    }

    .event-content {
      flex: 1;

      .event-title {
        font-size: 13px;
        color: #303133;
        margin-bottom: 3px;
      }

      .event-time {
        display: flex;
        align-items: center;
        gap: 3px;
        font-size: 12px;
        color: #909399;
      }
    }
  }

  .project-item {
    padding: 10px 0;
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background-color: #f5f7fa;
      margin: 0 -20px;
      padding: 10px 20px;
    }

    .project-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;

      .project-name {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: #303133;
        font-weight: 500;
      }

      .project-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      .project-count {
        font-size: 12px;
        color: #909399;
      }
    }
  }

  .mt-16 {
    margin-top: 16px;
  }

  .chart-card {
    height: 280px;

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      span {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
      }

      .chart-subtitle {
        font-size: 12px;
        color: #909399;
        font-weight: normal;
      }
    }
  }

  .trend-chart {
    height: 200px;
    padding: 10px 0;
  }

  .trend-bars {
    display: flex;
    align-items: flex-end;
    justify-content: space-around;
    height: 100%;
    gap: 8px;
  }

  .trend-bar-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
  }

  .trend-bar-container {
    flex: 1;
    width: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }

  .trend-bar {
    width: 70%;
    background: linear-gradient(180deg, #409eff 0%, #79bbff 100%);
    border-radius: 4px 4px 0 0;
    min-height: 4px;
    transition: height 0.3s;
  }

  .trend-label {
    font-size: 11px;
    color: #909399;
    margin-top: 6px;
  }

  .trend-value {
    font-size: 12px;
    font-weight: 600;
    color: #303133;
    margin-top: 2px;
  }

  .note-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background-color: #f5f7fa;
      margin: 0 -20px;
      padding: 10px 20px;
    }

    .note-icon {
      width: 32px;
      height: 32px;
      background-color: #e6a23c22;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #e6a23c;
    }

    .note-content {
      flex: 1;

      .note-title {
        font-size: 13px;
        color: #303133;
        margin-bottom: 2px;
      }

      .note-time {
        font-size: 12px;
        color: #909399;
      }
    }
  }
}
</style>
