<template>
  <!--
    桌面看板列横排。手机上 300px 列在 360px 屏里只剩一列多，而且 HTML5 拖拽在触屏上
    根本不触发 —— 所以手机换成「状态 chips + 单列卡片」，换列走卡片 ⋮ 菜单。
    两棵用 v-if 分叉：桌面上手机子树根本不 mount，桌面那棵树一个像素都不动。
  -->
  <div v-if="!ui.isMobile" class="task-board">
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

  <!-- 手机：状态 chips 横滑，下面只放当前状态的整宽卡片 -->
  <div v-else class="tb-board">
    <div class="tb-chips">
      <button
        v-for="status in statuses"
        :key="status.value"
        type="button"
        class="tb-chip"
        :class="{ active: status.value === activeStatus }"
        :style="
          status.value === activeStatus
            ? { backgroundColor: status.color, borderColor: status.color }
            : undefined
        "
        @click="pickedStatus = status.value"
      >
        <span
          class="tb-dot"
          :style="{ backgroundColor: status.value === activeStatus ? '#fff' : status.color }"
        ></span>
        <span class="tb-chip-label">{{ status.label }}</span>
        <span class="tb-chip-count">{{ tasksFor(status.value).length }}</span>
      </button>
    </div>

    <el-empty
      v-if="!statuses.length"
      :image-size="80"
      description="暂无状态，请在「管理状态」里添加"
    />
    <template v-else>
      <el-empty v-if="!activeTasks.length" :image-size="80" description="暂无任务" />
      <TaskMCard
        v-for="task in activeTasks"
        :key="task.id"
        :task="task"
        :statuses="statuses"
        :is-completed="isCompleted"
        show-priority-moves
        @edit="(t) => $emit('action', 'edit', t)"
        @delete="(t) => $emit('action', 'delete', t)"
        @duplicate="(t) => $emit('action', 'duplicate', t)"
        @move="(t, patch) => $emit('move', t, patch)"
      />
      <!-- activeStatus 为空说明一个状态都没有，此时不能再 emit('add', '') -->
      <button
        v-if="activeStatus"
        type="button"
        class="tb-add"
        @click="$emit('add', activeStatus)"
      >
        <el-icon><Plus /></el-icon>
        <span>添加任务</span>
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Task, TaskStatus } from '@/types/models'
import { useUiStore } from '@/stores/ui'
import TaskCard from './TaskCard.vue'
import TaskMCard from './TaskMCard.vue'

const props = defineProps<{
  tasks: Task[]
  statuses: TaskStatus[]
  /** 只有手机树用：已完成判定（状态列表最后一项） */
  isCompleted: (status: string) => boolean
}>()

const emit = defineEmits<{
  add: [status: string]
  action: [cmd: string, task: Task]
  drop: [task: Task, status: string]
  move: [task: Task, patch: { status?: string; priority?: string }]
}>()

const ui = useUiStore()

const dragged = ref<Task | null>(null)

/** 手机：用户点中的状态。空 = 还没点过，用第一项 */
const pickedStatus = ref('')

/**
 * 不用 watch 兜底 —— 状态是原地 splice 增删的，watch 数组引用根本不会触发；
 * 整体替换时深 watch 又会白跑。派生一次说清：点过的值还在列表里就用它，否则退回第一项。
 */
const activeStatus = computed(() => {
  const list = props.statuses
  return pickedStatus.value && list.some(s => s.value === pickedStatus.value)
    ? pickedStatus.value
    : (list[0]?.value ?? '')
})

const activeTasks = computed(() => props.tasks.filter(t => t.status === activeStatus.value))

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

// ── 手机看板 ──────────────────────────────────────────────────────
// .tb-* 只在 v-else 的手机子树里存在，桌面永远匹配不到（同 ResponsiveList 的 .rl-mobile）
// 前缀用 tb- 而不是 km-，和 Projects 的 SubtaskBoard 区分开
.tb-board {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tb-chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;

  // 状态是可增删的，chip 一律不压缩，靠横滑翻
  .tb-chip {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border: 1px solid #dcdfe6;
    border-radius: 999px;
    background-color: #fff;
    color: #606266;
    font-size: 13px;
    line-height: 1;
    cursor: pointer;
    // 手指点了要有个反馈，不靠 hover（触屏没有 hover）
    transition: background-color 0.15s, border-color 0.15s, color 0.15s;

    &.active {
      color: #fff;
      border-color: transparent;
    }
  }

  .tb-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .tb-chip-count {
    padding: 1px 7px;
    border-radius: 999px;
    background-color: #f5f7fa;
    color: #909399;
    font-size: 12px;
  }

  .tb-chip.active .tb-chip-count {
    background-color: rgba(255, 255, 255, 0.25);
    color: #fff;
  }
}

.tb-add {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  background-color: transparent;
  cursor: pointer;
  color: #909399;
  font-size: 12px;

  &:active {
    color: #409eff;
    border-color: #409eff;
    background-color: #f5f7fa;
  }
}
</style>
