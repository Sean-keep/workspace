<template>
  <div class="task-list">
    <el-table :data="tasks" stripe>
      <el-table-column width="50">
        <template #default="{ row }">
          <el-checkbox
            :model-value="isCompleted((row as Task).status)"
            @change="(val: boolean | string | number) => $emit('toggle', row as Task, Boolean(val))"
          />
        </template>
      </el-table-column>

      <el-table-column prop="title" label="任务名称" min-width="200">
        <template #default="{ row }">
          <div class="task-title-cell">
            <span :class="{ done: isCompleted((row as Task).status) }">{{ (row as Task).title }}</span>
            <el-tag v-if="(row as Task).is_recurring" type="warning" size="small" class="task-tag">
              <el-icon><Refresh /></el-icon>
              {{ getRecurrenceLabel((row as Task).recurrence_type) }}
            </el-tag>
            <el-tag v-for="tag in (row as Task).tags" :key="tag" size="small" class="task-tag">
              {{ tag }}
            </el-tag>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="priority" label="优先级" width="100">
        <template #default="{ row }">
          <el-tag :type="getPriorityType((row as Task).priority)" size="small">
            {{ getPriorityLabel((row as Task).priority) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">
          <el-tag :color="statusColor((row as Task).status)" size="small" effect="dark">
            {{ statusLabel((row as Task).status) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="due_date" label="截止日期" width="150">
        <template #default="{ row }">
          <span v-if="(row as Task).due_date" :class="{ overdue: isOverdue((row as Task).due_date) }">
            {{ formatDate((row as Task).due_date) }}
          </span>
          <span v-else class="text-muted">-</span>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="$emit('edit', row as Task)">编辑</el-button>
          <el-button type="danger" link @click="$emit('delete', row as Task)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import type { Task } from '@/types/models'
import {
  formatDate,
  getPriorityLabel,
  getPriorityType,
  getRecurrenceLabel,
  isOverdue
} from '../composables/useTasks'

defineProps<{
  tasks: Task[]
  isCompleted: (status: string) => boolean
  statusLabel: (status: string) => string
  statusColor: (status: string) => string
}>()

defineEmits<{
  toggle: [task: Task, done: boolean]
  edit: [task: Task]
  delete: [task: Task]
}>()
</script>

<style scoped lang="scss">
.task-list {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.task-title-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .done {
    text-decoration: line-through;
    color: #909399;
  }

  .task-tag {
    margin-left: 4px;
  }
}

.text-muted {
  color: #c0c4cc;
}

.overdue {
  color: #f56c6c;
}
</style>
