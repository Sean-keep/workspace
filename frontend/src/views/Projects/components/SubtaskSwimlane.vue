<template>
  <div class="subtask-swimlane">
    <div class="swimlane-container">
      <div class="swimlane-header">
        <div class="swimlane-label">优先级</div>
        <div v-for="status in statuses" :key="status.value" class="swimlane-status">
          {{ status.label }}
        </div>
      </div>

      <div v-for="priority in priorities" :key="priority.value" class="swimlane-row">
        <div class="swimlane-label" :style="{ borderLeftColor: getPriorityColor(priority.value) }">
          <span>{{ priority.label }}</span>
        </div>
        <div
          v-for="status in statuses"
          :key="status.value"
          class="swimlane-cell"
          @dragover.prevent
          @drop="(e: DragEvent) => onDrop(e, priority.value, status.value)"
        >
          <div
            v-for="task in tasksFor(priority.value, status.value)"
            :key="task.id"
            class="swimlane-card"
            draggable="true"
            @dragstart="(e: DragEvent) => onDragStart(e, task)"
          >
            <span class="mini-title" :class="{ completed: task.status === 'done' }">{{ task.title }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProjectSubtask, TaskStatus } from '@/types/models'
import { getPriorityColor, priorities } from '../composables/useProjects'

const props = defineProps<{
  subtasks: ProjectSubtask[]
  statuses: TaskStatus[]
}>()

const emit = defineEmits<{
  move: [task: ProjectSubtask, patch: { status?: string; priority?: string }]
}>()

let dragged: ProjectSubtask | null = null

function tasksFor(priority: string, status: string) {
  return props.subtasks.filter(t => t.priority === priority && t.status === status)
}

function onDragStart(e: DragEvent, task: ProjectSubtask) {
  dragged = task
  e.dataTransfer!.effectAllowed = 'move'
}

function onDrop(e: DragEvent, priority: string, status: string) {
  e.preventDefault()
  if (dragged) {
    emit('move', dragged, { priority, status })
    dragged = null
  }
}
</script>

<style scoped lang="scss">
.subtask-swimlane {
  overflow: auto;
}

.swimlane-container {
  min-width: 100%;
}

.swimlane-header {
  display: flex;
  background-color: #f5f7fa;
  border-radius: 6px 6px 0 0;
  border: 1px solid #ebeef5;
  border-bottom: 2px solid #ebeef5;

  .swimlane-label {
    width: 100px;
    min-width: 100px;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 600;
    color: #303133;
    border-right: 1px solid #ebeef5;
  }

  .swimlane-status {
    flex: 1;
    padding: 8px 12px;
    text-align: center;
    font-size: 12px;
    font-weight: 600;
    color: #606266;
    border-right: 1px solid #ebeef5;

    &:last-child {
      border-right: none;
    }
  }
}

.swimlane-row {
  display: flex;
  border: 1px solid #ebeef5;
  border-top: none;

  &:last-child {
    border-radius: 0 0 6px 6px;
  }

  .swimlane-label {
    width: 100px;
    min-width: 100px;
    padding: 10px 12px;
    display: flex;
    align-items: center;
    border-right: 1px solid #ebeef5;
    border-left: 3px solid #409eff;
    background-color: #fff;
    font-size: 12px;
    font-weight: 500;
    color: #303133;
  }

  .swimlane-cell {
    flex: 1;
    min-height: 50px;
    padding: 6px;
    border-right: 1px solid #ebeef5;
    background-color: #fff;

    &:last-child {
      border-right: none;
    }

    &:hover {
      background-color: #f5f7fa;
    }
  }
}

.swimlane-card {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  margin-bottom: 4px;
  background-color: #ecf5ff;
  border-radius: 4px;
  border: 1px solid #d9ecff;
  cursor: pointer;

  &:hover {
    background-color: #d9ecff;
  }

  .mini-title {
    font-size: 12px;
    color: #303133;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &.completed {
      text-decoration: line-through;
      color: #909399;
    }
  }
}
</style>
