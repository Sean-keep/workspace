<template>
  <div class="tasks-page">
    <PageHeader class="tasks-header">
      <template #left>
        <el-radio-group v-model="viewMode" class="view-switch">
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
        <el-button class="header-btn" @click="statusDialogVisible = true">
          <el-icon><Setting /></el-icon>
          管理状态
        </el-button>
        <el-button class="header-btn" type="primary" @click="openAddDialog()">
          <el-icon><Plus /></el-icon>
          新建任务
        </el-button>
      </template>
    </PageHeader>

    <TaskListView
      v-if="viewMode === 'list'"
      :tasks="filteredTasks"
      :loading="loading"
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
      :is-completed="isCompletedStatus"
      @add="openAddDialog"
      @action="handleCardAction"
      @drop="moveTask"
      @move="handleMove"
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
  loading,
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
  movePriority,
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

/** 手机卡片的「移动状态 / 移动优先级」一次可能只带一个字段，也可能两个都带 */
function handleMove(task: Task, patch: { status?: string; priority?: string }) {
  if (patch.status) moveTask(task, patch.status)
  if (patch.priority) movePriority(task, patch.priority)
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

// 手机（≤767px）。⚠️ 断点与 stores/ui.ts 的 MOBILE_MEDIA、
// assets/styles/main.scss 的 $bp-mobile 保持同步（768px）。
// 一行塞不下「radio 组 + 两个筛选 + 两个按钮」，改成三行：
// ① 视图切换铺满  ② 两个筛选平分  ③ 两个按钮平分
@media (max-width: 767px) {
  .tasks-page .tasks-header {
    // PageHeader 的 .header-left/.header-right 是子组件内部 DOM，
    // scoped 的 data-v 到不了，必须 deep
    :deep(.header-left),
    :deep(.header-right) {
      width: 100%;
      flex-wrap: wrap;
      gap: 8px;
    }

    // EP 2.14 的 el-radio-group 没有 stretch 属性，只能 CSS 铺满
    .view-switch {
      display: flex;
      flex: 0 0 100%;

      :deep(.el-radio-button) {
        flex: 1;
      }

      // el-radio-button__inner 是 EP 内部 DOM，scoped 的 data-v 到不了，必须 deep
      :deep(.el-radio-button__inner) {
        width: 100%;
        text-align: center;
      }
    }

    .filter-select {
      flex: 1;
      width: auto;
      min-width: 0;
    }

    .header-btn {
      flex: 1;
    }

    // EP 全局的 .el-button + .el-button { margin-left: 12px } 会把 flex:1 顶成一宽一窄
    .header-btn + .header-btn {
      margin-left: 0;
    }
  }
}
</style>
