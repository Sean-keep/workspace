<template>
  <!--
    桌面泳道 = 优先级行 × 状态列的矩阵。手机上行标 100px + 状态列 flex:1，
    每格只剩六七十像素，标题被截到剩几个字；而且 HTML5 拖拽在触屏上不触发。
    所以手机改成按优先级分组的卡片列表，状态降级成卡片上的徽章，改维度走 ⋮ 菜单。
    两棵用 v-if 分叉：桌面上手机子树根本不 mount，桌面那棵树一个像素都不动。
  -->
  <div v-if="!ui.isMobile" class="subtask-swimlane">
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

  <!-- 手机：按优先级分组。组头留着（空组也留）—— 这就是泳道的「行」 -->
  <div v-else class="sm-swimlane">
    <div v-for="priority in priorities" :key="priority.value" class="sm-group">
      <div class="sm-group-header" :style="{ borderLeftColor: getPriorityColor(priority.value) }">
        <span class="sm-group-title">{{ priority.label }}</span>
        <el-tag size="small" round>{{ tasksForPriority(priority.value).length }}</el-tag>
      </div>
      <SubtaskMCard
        v-for="task in tasksForPriority(priority.value)"
        :key="task.id"
        :task="task"
        :statuses="statuses"
        show-priority-moves
        @edit="(t) => $emit('edit', t)"
        @delete="(t) => $emit('delete', t)"
        @move="(t, patch) => $emit('move', t, patch)"
      />
    </div>
    <el-empty v-if="!subtasks.length" :image-size="80" description="暂无子任务" />
  </div>
</template>

<script setup lang="ts">
import type { ProjectSubtask, TaskStatus } from '@/types/models'
import { useUiStore } from '@/stores/ui'
import SubtaskMCard from './SubtaskMCard.vue'
import { getPriorityColor, priorities } from '../composables/useProjects'

const props = defineProps<{
  subtasks: ProjectSubtask[]
  statuses: TaskStatus[]
}>()

const emit = defineEmits<{
  edit: [task: ProjectSubtask]
  delete: [task: ProjectSubtask]
  move: [task: ProjectSubtask, patch: { status?: string; priority?: string }]
}>()

const ui = useUiStore()

let dragged: ProjectSubtask | null = null

function tasksFor(priority: string, status: string) {
  return props.subtasks.filter(t => t.priority === priority && t.status === status)
}

/** 组头计数和组里的卡片走同一个过滤器，两个数永远对得上 */
function tasksForPriority(priority: string) {
  return props.subtasks.filter(t => t.priority === priority)
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

// ── 手机泳道 ──────────────────────────────────────────────────────
// .sm-* 只在 v-else 的手机子树里存在，桌面永远匹配不到（同 ResponsiveList 的 .rl-mobile）
.sm-swimlane {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sm-group {
  // 组内 8px 间距交给 gap —— 组头也吃同一个间距，不用再写 margin-bottom
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sm-group-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 2px 0 8px 10px;
  // 色条沿用桌面泳道行标那根 3px 左边线；底边线沿用 Bookmarks 的分组组头
  border-left: 3px solid #409eff;
  border-bottom: 2px solid #ebeef5;

  .sm-group-title {
    flex: 1;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }
}
</style>
