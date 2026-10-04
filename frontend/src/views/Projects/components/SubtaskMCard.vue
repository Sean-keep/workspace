<template>
  <!--
    手机端子任务卡片。看板卡是 draggable/cursor:grab 的拖拽件，触屏上拖不动；
    泳道卡连菜单都没有。这里给手机一条「点卡 = 编辑，⋮ = 改状态 / 优先级 / 删」的路径。
    事件集与 SubtaskBoard 的 edit/delete/move 一致，父组件不用为手机另开接口。
  -->
  <div class="mcard" @click="emit('edit', task)">
    <div class="mcard-main">
      <div class="mcard-title" :class="{ done: task.status === 'done' }">{{ task.title }}</div>
      <div class="mcard-meta">
        <el-tag :color="statusColor(task.status)" size="small" effect="dark">
          {{ statusLabel(task.status) }}
        </el-tag>
        <el-tag :type="getPriorityType(task.priority)" size="small">
          {{ getPriorityLabel(task.priority) }}
        </el-tag>
        <span v-if="task.assignee" class="mcard-assignee">
          <el-icon><User /></el-icon>
          {{ task.assignee }}
        </span>
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

            <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProjectSubtask, TaskStatus } from '@/types/models'
import {
  getPriorityColor,
  getPriorityLabel,
  getPriorityType,
  priorities
} from '../composables/useProjects'

const props = defineProps<{
  task: ProjectSubtask
  statuses: TaskStatus[]
  /** 泳道图两个维度都要改；看板按状态分组，菜单里再给优先级就多余 */
  showPriorityMoves?: boolean
}>()

const emit = defineEmits<{
  edit: [task: ProjectSubtask]
  delete: [task: ProjectSubtask]
  move: [task: ProjectSubtask, patch: { status?: string; priority?: string }]
}>()

// 状态的 label/color 从 statuses prop 查 —— useProjects 里的 getSubtaskStatusLabel /
// getSubtaskStatusColor 定义在 useProjects() 函数体内，不是模块级导出，拿不到。
function statusLabel(value: string) {
  return props.statuses.find(s => s.value === value)?.label ?? value
}

function statusColor(value: string) {
  return props.statuses.find(s => s.value === value)?.color ?? '#909399'
}

function onCommand(cmd: string) {
  if (cmd === 'edit') return emit('edit', props.task)
  if (cmd === 'delete') return emit('delete', props.task)

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
// 手机专属卡片（只被 SubtaskBoard / SubtaskSwimlane 的手机子树 mount），
// 样式不裹 @media —— 和 TaskRow.vue / NoteCard.vue 一样，DOM 本身就不存在于桌面。
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

.mcard-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-top: 6px;

  .mcard-assignee {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: 12px;
    color: #909399;
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
