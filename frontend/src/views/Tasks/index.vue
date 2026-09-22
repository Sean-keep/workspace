<template>
  <div class="tasks-page">
    <PageHeader class="tasks-header">
      <template #left>
        <el-radio-group v-model="viewMode">
          <el-radio-button value="list">列表</el-radio-button>
          <el-radio-button value="board">看板</el-radio-button>
        </el-radio-group>

        <el-select v-model="filterStatus" placeholder="状态" clearable class="filter-select">
          <el-option
            v-for="status in taskStatuses"
            :key="status.value"
            :label="status.label"
            :value="status.value"
          />
        </el-select>

        <el-select v-model="filterPriority" placeholder="优先级" clearable class="filter-select">
          <el-option label="紧急" value="urgent" />
          <el-option label="高" value="high" />
          <el-option label="中" value="medium" />
          <el-option label="低" value="low" />
        </el-select>
      </template>

      <template #right>
        <el-button @click="statusDialogVisible = true">
          <el-icon><Setting /></el-icon>
          管理状态
        </el-button>
        <el-button type="primary" @click="openAddDialog()">
          <el-icon><Plus /></el-icon>
          新建任务
        </el-button>
      </template>
    </PageHeader>

    <TaskListView
      v-if="viewMode === 'list'"
      :tasks="filteredTasks"
      :is-completed="isCompletedStatus"
      :status-label="getStatusLabel"
      :status-color="getStatusColor"
      @toggle="handleStatusChange"
      @edit="taskDialog.openEdit"
      @delete="deleteTask"
    />

    <TaskBoard
      v-else
      :tasks="filteredTasks"
      :statuses="taskStatuses"
      @add="openAddDialog"
      @action="handleCardAction"
      @drop="moveTask"
    />

    <TaskFormDialog
      v-model:visible="taskDialog.visible"
      :task="taskDialog.editing"
      :statuses="taskStatuses"
      :default-status="pendingStatus"
      :submitting="taskDialog.submitting"
      @submit="submitTask"
    />

    <TaskStatusDialog
      v-model:visible="statusDialogVisible"
      :statuses="taskStatuses"
      @add="addStatus"
      @remove="removeStatus"
      @reorder="reorderStatus"
      @save="saveStatuses"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Task } from '@/types/models'
import { PageHeader } from '@/components/index'
import TaskListView from './components/TaskListView.vue'
import TaskBoard from './components/TaskBoard.vue'
import TaskFormDialog from './components/TaskFormDialog.vue'
import TaskStatusDialog from './components/TaskStatusDialog.vue'
import { useTasks } from './composables/useTasks'

const {
  getStatusColor,
  getStatusLabel,
  isCompletedStatus,
  viewMode,
  filterStatus,
  filterPriority,
  filteredTasks,
  taskStatuses,
  statusDialogVisible,
  taskDialog,
  fetchTasks,
  submitTask,
  deleteTask,
  duplicateTask,
  handleStatusChange,
  moveTask,
  saveStatuses,
  addStatus,
  removeStatus,
  reorderStatus
} = useTasks()

const pendingStatus = ref<string | undefined>()

function openAddDialog(status?: string) {
  pendingStatus.value = status
  taskDialog.openCreate()
}

function handleCardAction(cmd: string, task: Task) {
  if (cmd === 'edit') taskDialog.openEdit(task)
  if (cmd === 'delete') deleteTask(task)
  if (cmd === 'duplicate') duplicateTask(task)
}

onMounted(() => {
  fetchTasks()
})
</script>

<style scoped lang="scss">
.tasks-page {
  .tasks-header {
    margin-bottom: 20px;

    .filter-select {
      width: 120px;
    }
  }
}
</style>
