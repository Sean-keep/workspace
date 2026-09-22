<template>
  <el-card class="list-card">
    <template #header>
      <div class="card-header">
        <span><el-icon><List /></el-icon> 待办任务</span>
        <el-button type="primary" link @click="router.push('/tasks')">查看全部</el-button>
      </div>
    </template>
    <div class="list-scroll">
      <div v-for="task in tasks" :key="task.id" class="task-item">
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
      <el-empty v-if="tasks.length === 0" description="暂无待办任务" :image-size="60" />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { List, Clock } from '@element-plus/icons-vue'
import {
  formatDate,
  getPriorityLabel,
  getPriorityType,
  getTaskStatusColor,
  type RecentTask
} from '../composables/useDashboard'

defineProps<{ tasks: RecentTask[] }>()

const router = useRouter()
</script>

<style scoped lang="scss">
@use './card-shared.scss' as *;

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
</style>
