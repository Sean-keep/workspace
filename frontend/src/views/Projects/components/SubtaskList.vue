<template>
  <div class="subtask-list">
    <el-table :data="subtasks" size="small">
      <el-table-column prop="title" label="标题" min-width="200">
        <template #default="{ row }">
          <span :class="{ completed: (row as ProjectSubtask).status === 'done' }">{{ (row as ProjectSubtask).title }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :color="statusColor((row as ProjectSubtask).status)" size="small" effect="dark">
            {{ statusLabel((row as ProjectSubtask).status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="priority" label="优先级" width="80">
        <template #default="{ row }">
          <el-tag :type="getPriorityType((row as ProjectSubtask).priority)" size="small">
            {{ getPriorityLabel((row as ProjectSubtask).priority) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="$emit('edit', row as ProjectSubtask)">编辑</el-button>
          <el-button type="danger" link size="small" @click="$emit('delete', row as ProjectSubtask)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import type { ProjectSubtask } from '@/types/models'
import { getPriorityLabel, getPriorityType } from '../composables/useProjects'

defineProps<{
  subtasks: ProjectSubtask[]
  statusColor: (status: string) => string
  statusLabel: (status: string) => string
}>()

defineEmits<{
  edit: [task: ProjectSubtask]
  delete: [task: ProjectSubtask]
}>()
</script>

<style scoped lang="scss">
.subtask-list {
  :deep(.el-table) {
    font-size: 13px;
  }

  .completed {
    text-decoration: line-through;
    color: #909399;
  }
}

:deep(.el-table .el-table__row) {
  cursor: pointer;
}
</style>
