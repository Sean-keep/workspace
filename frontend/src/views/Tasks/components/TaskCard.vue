<template>
  <div
    class="board-card"
    :class="{ dragging: dragging }"
    draggable="true"
    @dragstart="(e: DragEvent) => onDragStart(e)"
    @dragend="(e: DragEvent) => $emit('dragend', e)"
  >
    <div class="card-header">
      <el-tag :type="getPriorityType(task.priority)" size="small">
        {{ getPriorityLabel(task.priority) }}
      </el-tag>
      <el-dropdown @command="(cmd: string) => $emit('action', cmd, task)">
        <el-icon class="card-more"><MoreFilled /></el-icon>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="edit">编辑</el-dropdown-item>
            <el-dropdown-item command="duplicate">复制</el-dropdown-item>
            <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <div class="card-title">{{ task.title }}</div>
    <div v-if="task.description" class="card-desc">{{ task.description }}</div>
    <div class="card-tags" v-if="task.tags?.length">
      <el-tag v-for="tag in task.tags" :key="tag" size="small" type="info">
        {{ tag }}
      </el-tag>
    </div>
    <div class="card-footer">
      <div v-if="task.is_recurring" class="recurring-badge">
        <el-icon><Refresh /></el-icon>
        <span>{{ getRecurrenceLabel(task.recurrence_type) }}</span>
      </div>
      <div v-if="task.due_date" class="card-due" :class="{ overdue: isOverdue(task.due_date) }">
        <el-icon><Clock /></el-icon>
        {{ formatDate(task.due_date) }}
      </div>
    </div>
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

const props = defineProps<{
  task: Task
  dragging?: boolean
}>()

const emit = defineEmits<{
  dragstart: [task: Task]
  dragend: [e: DragEvent]
  action: [cmd: string, task: Task]
}>()

function onDragStart(e: DragEvent) {
  e.dataTransfer!.effectAllowed = 'move'
  e.dataTransfer!.setData('text/plain', props.task.id.toString())
  setTimeout(() => {
    const el = e.target as HTMLElement
    el.classList.add('dragging')
  }, 0)
  emit('dragstart', props.task)
}
</script>

<style scoped lang="scss">
.board-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  cursor: grab;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: all 0.2s;
  border: 2px solid transparent;

  &:hover {
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.12);
    transform: translateY(-1px);
  }

  &:active {
    cursor: grabbing;
  }

  &.dragging {
    opacity: 0.5;
    transform: rotate(2deg);
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;

    .card-more {
      cursor: pointer;
      color: #909399;
      padding: 2px;
      border-radius: 4px;

      &:hover {
        color: #409eff;
        background-color: #f5f7fa;
      }
    }
  }

  .card-title {
    font-size: 13px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 4px;
    line-height: 1.4;
  }

  .card-desc {
    font-size: 12px;
    color: #909399;
    margin-bottom: 6px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 6px;
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 6px;

    .recurring-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #e6a23c;
    }

    .card-due {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #909399;

      &.overdue {
        color: #f56c6c;
      }
    }
  }
}
</style>
