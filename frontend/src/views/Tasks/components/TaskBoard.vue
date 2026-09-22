<template>
  <div class="task-board">
    <div
      v-for="column in statuses"
      :key="column.value"
      class="board-column"
      :data-status="column.value"
    >
      <div class="column-header">
        <div class="column-title-wrapper">
          <span class="column-dot" :style="{ backgroundColor: column.color }"></span>
          <span class="column-title">{{ column.label }}</span>
          <el-badge :value="tasksFor(column.value).length" class="column-count" />
        </div>
        <el-button type="primary" link @click="$emit('add', column.value)">
          <el-icon><Plus /></el-icon>
        </el-button>
      </div>

      <div
        class="column-content"
        :data-status="column.value"
        @dragover.prevent="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="(e: DragEvent) => onDrop(e, column.value)"
      >
        <TaskCard
          v-for="task in tasksFor(column.value)"
          :key="task.id"
          :task="task"
          :dragging="dragged?.id === task.id"
          @dragstart="onDragStart"
          @dragend="(e: DragEvent) => onDragEnd(e)"
          @action="(cmd, t) => $emit('action', cmd, t)"
        />

        <div class="add-card" @click="$emit('add', column.value)">
          <el-icon><Plus /></el-icon>
          <span>添加任务</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Task, TaskStatus } from '@/types/models'
import TaskCard from './TaskCard.vue'

const props = defineProps<{
  tasks: Task[]
  statuses: TaskStatus[]
}>()

const emit = defineEmits<{
  add: [status: string]
  action: [cmd: string, task: Task]
  drop: [task: Task, status: string]
}>()

const dragged = ref<Task | null>(null)

function tasksFor(status: string) {
  return props.tasks.filter(t => t.status === status)
}

function onDragStart(task: Task) {
  dragged.value = task
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  const target = e.currentTarget as HTMLElement
  target.classList.add('drag-over')
}

function handleDragLeave(e: DragEvent) {
  const target = e.currentTarget as HTMLElement
  target.classList.remove('drag-over')
}

function onDragEnd(e: DragEvent) {
  dragged.value = null
  const el = e.target as HTMLElement
  el.classList.remove('dragging')
  document.querySelectorAll('.column-content').forEach(col => {
    col.classList.remove('drag-over')
  })
}

function onDrop(e: DragEvent, status: string) {
  e.preventDefault()
  const target = e.currentTarget as HTMLElement
  target.classList.remove('drag-over')
  if (dragged.value) {
    emit('drop', dragged.value, status)
    dragged.value = null
  }
}
</script>

<style scoped lang="scss">
.task-board {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 20px;
}

.board-column {
  min-width: 300px;
  max-width: 300px;
  background-color: #f5f7fa;
  border-radius: 10px;
  overflow: hidden;

  .column-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    background-color: #fff;
    border-bottom: 1px solid #ebeef5;

    .column-title-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;

      .column-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }

      .column-title {
        font-size: 14px;
        font-weight: 600;
        color: #303133;
      }
    }
  }
}

.column-content {
  padding: 10px;
  min-height: 350px;
  transition: background-color 0.2s;

  &.drag-over {
    background-color: #ecf5ff;
  }
}

.add-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  color: #909399;
  transition: all 0.2s;

  &:hover {
    border-color: #409eff;
    color: #409eff;
    background-color: #ecf5ff;
  }
}
</style>
