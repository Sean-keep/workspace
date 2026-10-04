<template>
  <!--
    桌面看板列横排。手机上 250px 列在 360px 屏里只剩一列多，而且 HTML5 拖拽在触屏上
    根本不触发 —— 所以手机换成「状态 chips + 单列卡片」，换列走卡片 ⋮ 菜单。
    两棵用 v-if 分叉：桌面上手机子树根本不 mount，桌面那棵树一个像素都不动。
  -->
  <div v-if="!ui.isMobile" class="subtask-kanban">
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

  <!-- 手机：状态 chips 横滑，下面只放当前状态的整宽卡片 -->
  <div v-else class="km-board">
    <div class="km-chips">
      <button
        v-for="status in statuses"
        :key="status.value"
        type="button"
        class="km-chip"
        :class="{ active: status.value === activeStatus }"
        :style="
          status.value === activeStatus
            ? { backgroundColor: status.color, borderColor: status.color }
            : undefined
        "
        @click="pickedStatus = status.value"
      >
        <span
          class="km-dot"
          :style="{ backgroundColor: status.value === activeStatus ? '#fff' : status.color }"
        ></span>
        <span class="km-chip-label">{{ status.label }}</span>
        <span class="km-chip-count">{{ tasksFor(status.value).length }}</span>
      </button>
    </div>

    <el-empty
      v-if="!statuses.length"
      :image-size="80"
      description="暂无状态，请在「管理状态」里添加"
    />
    <template v-else>
      <el-empty v-if="!activeTasks.length" :image-size="80" description="暂无子任务" />
      <SubtaskMCard
        v-for="task in activeTasks"
        :key="task.id"
        :task="task"
        :statuses="statuses"
        @edit="(t) => $emit('edit', t)"
        @delete="(t) => $emit('delete', t)"
        @move="(t, patch) => $emit('move', t, patch)"
      />
      <!-- activeStatus 为空说明一个状态都没有，此时不能再 emit('add', '') -->
      <button
        v-if="activeStatus"
        type="button"
        class="km-add"
        @click="$emit('add', activeStatus)"
      >
        <el-icon><Plus /></el-icon>
        <span>添加</span>
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ProjectSubtask, TaskStatus } from '@/types/models'
import { useUiStore } from '@/stores/ui'
import SubtaskMCard from './SubtaskMCard.vue'

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

const ui = useUiStore()

/** 手机：用户点中的状态。空 = 还没点过，用第一项 */
const pickedStatus = ref('')

/**
 * 不用 watch 兜底 —— removeSubtaskStatus 是原地 splice，watch 数组引用根本不会触发；
 * loadSubtaskStatuses 又是整体替换，深 watch 会白跑。派生一次说清：
 * 点过的值还在列表里就用它，否则退回第一项。
 */
const activeStatus = computed(() => {
  const list = props.statuses
  return pickedStatus.value && list.some(s => s.value === pickedStatus.value)
    ? pickedStatus.value
    : (list[0]?.value ?? '')
})

const activeTasks = computed(() =>
  props.subtasks.filter(t => t.status === activeStatus.value)
)

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

// ── 手机看板 ──────────────────────────────────────────────────────
// .km-* 只在 v-else 的手机子树里存在，桌面永远匹配不到（同 ResponsiveList 的 .rl-mobile）
.km-board {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.km-chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;

  // 状态是可增删的，chip 一律不压缩，靠横滑翻
  .km-chip {
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

  .km-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .km-chip-count {
    padding: 1px 7px;
    border-radius: 999px;
    background-color: #f5f7fa;
    color: #909399;
    font-size: 12px;
  }

  .km-chip.active .km-chip-count {
    background-color: rgba(255, 255, 255, 0.25);
    color: #fff;
  }
}

.km-add {
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
