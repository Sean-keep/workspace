<template>
  <div class="subtask-kanban">
    <div v-for="status in statuses" :key="status.value" class="kanban-column">
      <div class="column-header">
        <span class="column-dot" :style="{ backgroundColor: status.color }"></span>
        <span class="column-title">{{ status.label }}</span>
        <el-tag size="small" round>{{ tasksFor(status.value).length }}</el-tag>
      </div>
      <div
        class="column-body"
        @dragover.prevent
        @drop="(e: DragEvent) => onDrop(e, status.value)"
      >
        <div
          v-for="task in tasksFor(status.value)"
          :key="task.id"
          class="subtask-card"
          draggable="true"
          @dragstart="(e: DragEvent) => onDragStart(e, task)"
        >
          <div class="card-header">
            <el-dropdown @command="(cmd: string) => onAction(cmd, task)">
              <el-icon class="card-more"><MoreFilled /></el-icon>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">编辑</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
          <div class="card-title" :class="{ completed: task.status === 'done' }">{{ task.title }}</div>
          <div v-if="task.assignee" class="card-assignee">
            <el-avatar :size="20">{{ task.assignee.charAt(0) }}</el-avatar>
            <span>{{ task.assignee }}</span>
          </div>
        </div>
        <div class="add-card" @click="$emit('add', status.value)">
          <el-icon><Plus /></el-icon>
          <span>添加</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProjectSubtask, TaskStatus } from '@/types/models'

const props = defineProps<{
  subtasks: ProjectSubtask[]
  statuses: TaskStatus[]
}>()

const emit = defineEmits<{
  add: [status: string]
  edit: [task: ProjectSubtask]
  delete: [task: ProjectSubtask]
  move: [task: ProjectSubtask, patch: { status?: string; priority?: string }]
}>()

let dragged: ProjectSubtask | null = null

function tasksFor(status: string) {
  return props.subtasks.filter(t => t.status === status)
}

function onAction(cmd: string, task: ProjectSubtask) {
  if (cmd === 'edit') emit('edit', task)
  if (cmd === 'delete') emit('delete', task)
}

function onDragStart(e: DragEvent, task: ProjectSubtask) {
  dragged = task
  e.dataTransfer!.effectAllowed = 'move'
}

function onDrop(e: DragEvent, status: string) {
  e.preventDefault()
  if (dragged) {
    emit('move', dragged, { status })
    dragged = null
  }
}
</script>

<style scoped lang="scss">
.subtask-kanban {
  display: flex;
  gap: 16px;
  overflow-x: auto;
}

.kanban-column {
  min-width: 250px;
  max-width: 250px;
  background-color: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;

  .column-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background-color: #fff;
    border-bottom: 1px solid #ebeef5;

    .column-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .column-title {
      font-size: 13px;
      font-weight: 600;
      color: #303133;
      flex: 1;
    }
  }

  .column-body {
    padding: 10px;
    min-height: 200px;
  }
}

.subtask-card {
  background-color: #fff;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 8px;
  cursor: grab;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;

    .card-more {
      cursor: pointer;
      color: #909399;

      &:hover {
        color: #409eff;
      }
    }
  }

  .card-title {
    font-size: 13px;
    color: #303133;
    margin-bottom: 6px;

    &.completed {
      text-decoration: line-through;
      color: #909399;
    }
  }

  .card-assignee {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #909399;
  }
}

.add-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  cursor: pointer;
  color: #909399;
  font-size: 12px;

  &:hover {
    color: #409eff;
    border-color: #409eff;
  }
}
</style>
