<template>
  <!--
    手机端任务卡片。桌面看板卡是 draggable/cursor:grab 的拖拽件，触屏上拖不动；
    卡片 ⋮ 还是 hover 触发，手机根本点不开。这里给手机一条「点卡 = 编辑，⋮ = 改状态 / 优先级 / 复制 / 删」。
    事件集与 TaskCard 的 action 语义对齐（edit/duplicate/delete）+ 新增 move，父组件不用为手机另开接口。
  -->
  <div class="mcard" @click="emit('edit', task)">
    <div class="mcard-main">
      <div class="mcard-title" :class="{ done: isCompleted(task.status) }">{{ task.title }}</div>
      <div v-if="task.description" class="mcard-desc">{{ task.description }}</div>
      <div class="mcard-meta">
        <el-tag :color="statusColor(task.status)" size="small" effect="dark">
          {{ statusLabel(task.status) }}
        </el-tag>
        <el-tag :type="getPriorityType(task.priority)" size="small">
          {{ getPriorityLabel(task.priority) }}
        </el-tag>
        <span v-if="task.due_date" class="mcard-due" :class="{ overdue: isOverdue(task.due_date) }">
          <el-icon><Clock /></el-icon>
          {{ formatDate(task.due_date) }}
        </span>
        <el-tag v-for="tag in task.tags" :key="tag" size="small" type="info">{{ tag }}</el-tag>
      </div>
    </div>

    <!-- @click.stop 在包裹层上：拦掉卡片的「点开编辑」，但不挡 el-dropdown 自己的触发 -->
    <div class="mcard-more" @click.stop>
      <el-dropdown trigger="click" @command="(cmd: string) => onCommand(cmd)">
        <el-icon class="mcard-more-icon"><MoreFilled /></el-icon>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="edit">编辑</el-dropdown-item>

            <el-dropdown-item divided disabled>移动状态</el-dropdown-item>
            <el-dropdown-item
              v-for="s in statuses"
              :key="s.value"
              :command="'move:status:' + s.value"
              :disabled="s.value === task.status"
            >
              <span class="mcard-move-dot" :style="{ backgroundColor: s.color }"></span>
              {{ s.label }}
            </el-dropdown-item>

            <template v-if="showPriorityMoves">
              <el-dropdown-item divided disabled>移动优先级</el-dropdown-item>
              <el-dropdown-item
                v-for="p in priorities"
                :key="p.value"
                :command="'move:priority:' + p.value"
                :disabled="p.value === task.priority"
              >
                <span
                  class="mcard-move-dot"
                  :style="{ backgroundColor: getPriorityColor(p.value) }"
                ></span>
                {{ p.label }}
              </el-dropdown-item>
            </template>

            <el-dropdown-item command="duplicate">复制</el-dropdown-item>
            <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task, TaskStatus } from '@/types/models'
import {
  formatDate,
  getPriorityColor,
  getPriorityLabel,
  getPriorityType,
  isOverdue,
  priorities
} from '../composables/useTasks'

const props = defineProps<{
  task: Task
  statuses: TaskStatus[]
  /** 已完成判定跟 TaskRow 一个口径 —— 状态列表最后一项 */
  isCompleted: (status: string) => boolean
  /** 任务没有第二条分组轴，优先级只有这条免弹窗路径；看板默认开着 */
  showPriorityMoves?: boolean
}>()

const emit = defineEmits<{
  edit: [task: Task]
  delete: [task: Task]
  duplicate: [task: Task]
  move: [task: Task, patch: { status?: string; priority?: string }]
}>()

// 状态的 label/color 从 statuses prop 查 —— useTasks 里的 getStatusLabel /
// getStatusColor 定义在 useTasks() 函数体内，不是模块级导出，拿不到。
function statusLabel(value: string) {
  return props.statuses.find(s => s.value === value)?.label ?? value
}

function statusColor(value: string) {
  return props.statuses.find(s => s.value === value)?.color ?? '#909399'
}

function onCommand(cmd: string) {
  if (cmd === 'edit') return emit('edit', props.task)
  if (cmd === 'delete') return emit('delete', props.task)
  if (cmd === 'duplicate') return emit('duplicate', props.task)

  // 状态 value 来自 label.toLowerCase().replace(/\s+/g, '_')，只清空白 ——
  // 标签里带「:」时 value 也带。所以不能 split(':')：先切掉「move:」前缀，
  // 再把第一个冒号当 kind/value 分界，剩下的整段都是 value。
  if (!cmd.startsWith('move:')) return
  const rest = cmd.slice(5)
  const sep = rest.indexOf(':')
  if (sep <= 0) return
  const kind = rest.slice(0, sep)
  const value = rest.slice(sep + 1)
  if (!value) return

  if (kind === 'status') emit('move', props.task, { status: value })
  else if (kind === 'priority') emit('move', props.task, { priority: value })
}
</script>

<style scoped lang="scss">
// 手机专属卡片（只被 TaskBoard 的手机子树 mount），
// 样式不裹 @media —— 和 TaskRow.vue / SubtaskMCard.vue 一样，DOM 本身就不存在于桌面。
.mcard {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  background-color: #fff;
  border-radius: 8px;
  // 整卡可点 = 编辑，给手指一个明确的目标
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.mcard-main {
  flex: 1;
  min-width: 0;
}

.mcard-title {
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

.mcard-desc {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.mcard-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-top: 6px;

  .mcard-due {
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

.mcard-more {
  flex-shrink: 0;
  // 44px 触摸区
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;

  .mcard-more-icon {
    color: #909399;
    cursor: pointer;
    font-size: 16px;
  }

  &:active .mcard-more-icon {
    color: #409eff;
    background-color: #f5f7fa;
  }
}

// 菜单是 teleport 到 body 的，但作用域选择器按 data-v 匹配，挂到哪都命中
.mcard-move-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 6px;
  border-radius: 50%;
}
</style>
