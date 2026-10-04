<template>
  <!--
    手机端任务列表行。计划里写的「复用 TaskCard」不成立：TaskCard 是看板卡片，
    带 draggable/cursor:grab 和拖拽事件，却没有列表最需要的完成勾选框。
    这里是独立的紧凑行 —— 勾选框 + 标题 + 元信息 + ⋮ 菜单，事件集与表格列一致。
  -->
  <div class="task-row" @click="$emit('edit', task)">
    <el-checkbox
      class="row-check"
      :model-value="isCompleted(task.status)"
      @click.stop
      @change="(val: boolean | string | number) => $emit('toggle', task, Boolean(val))"
    />

    <div class="row-main">
      <div class="row-title" :class="{ done: isCompleted(task.status) }">{{ task.title }}</div>
      <div class="row-meta">
        <el-tag :type="getPriorityType(task.priority)" size="small">
          {{ getPriorityLabel(task.priority) }}
        </el-tag>
        <el-tag :color="statusColor(task.status)" size="small" effect="dark">
          {{ statusLabel(task.status) }}
        </el-tag>
        <el-tag v-if="task.is_recurring" type="warning" size="small">
          {{ getRecurrenceLabel(task.recurrence_type) }}
        </el-tag>
        <el-tag v-for="tag in task.tags" :key="tag" size="small" type="info">
          {{ tag }}
        </el-tag>
        <span v-if="task.due_date" class="row-due" :class="{ overdue: isOverdue(task.due_date) }">
          <el-icon><Clock /></el-icon>
          {{ formatDate(task.due_date) }}
        </span>
      </div>
    </div>

    <!-- @click.stop 在包裹层上：拦掉行的「点开编辑」，但不挡 el-dropdown 自己的触发 -->
    <div class="row-more" @click.stop>
      <el-dropdown trigger="click" @command="(cmd: string) => onCommand(cmd)">
        <el-icon class="row-more-icon"><MoreFilled /></el-icon>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="edit">编辑</el-dropdown-item>
            <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
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
  isCompleted: (status: string) => boolean
  statusLabel: (status: string) => string
  statusColor: (status: string) => string
}>()

const emit = defineEmits<{
  toggle: [task: Task, done: boolean]
  edit: [task: Task]
  delete: [task: Task]
}>()

function onCommand(cmd: string) {
  if (cmd === 'edit') emit('edit', props.task)
  else if (cmd === 'delete') emit('delete', props.task)
}
</script>

<style scoped lang="scss">
.task-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  background-color: #fff;
  border-radius: 8px;
  // 整行可点 = 编辑，给手指一个明确的目标
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.row-check {
  // 勾选框本身 44px 触摸区不够，靠 margin 把可点范围撑开
  margin-top: 1px;
  flex-shrink: 0;

  :deep(.el-checkbox__inner) {
    width: 18px;
    height: 18px;
  }
}

.row-main {
  flex: 1;
  min-width: 0;
}

.row-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  line-height: 1.4;
  word-break: break-word;

  &.done {
    text-decoration: line-through;
    color: #909399;
  }
}

.row-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-top: 6px;

  .row-due {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: 12px;
    color: #909399;

    &.overdue {
      color: #f56c6c;
    }
  }
}

.row-more {
  flex-shrink: 0;
  // 44px 触摸区
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;

  .row-more-icon {
    color: #909399;
    cursor: pointer;
    font-size: 16px;
  }

  &:active .row-more-icon {
    color: #409eff;
    background-color: #f5f7fa;
  }
}
</style>
