<template>
  <!--
    fragment root（两个根节点、没有包裹元素）：桌面端 EventSidebar 直接包一层
    .calendar-sidebar，渲染出的 DOM 与拆分前逐字节一致。手机端则单独拿来做
    「当日议程」，内联在月历圆点下方。
  -->
  <div class="sidebar-header">
    <h3>{{ title }}</h3>
    <el-button type="primary" size="small" @click="$emit('add')">
      <el-icon><Plus /></el-icon>
      添加
    </el-button>
  </div>

  <div class="event-list-sidebar">
    <div v-if="events.length === 0" class="no-events">
      <el-icon :size="32"><Calendar /></el-icon>
      <p>暂无日程</p>
    </div>
    <div
      v-for="event in events"
      :key="event.id"
      class="event-card"
      @click="$emit('edit', event)"
    >
      <div class="event-color" :style="{ backgroundColor: event.color }"></div>
      <div class="event-content">
        <div class="event-title">{{ event.title }}</div>
        <div class="event-time">
          <el-icon :size="12"><Clock /></el-icon>
          <span>{{ formatEventTime(event) }}</span>
        </div>
        <div v-if="event.description" class="event-desc">{{ event.description }}</div>
      </div>
      <!--
        桌面沿用 hover 触发（和拆分前一致）；手机没有 hover，点开更靠谱。
        `@click.stop` 打在图标上（不是包裹层）—— 保持 DOM 与拆分前逐字节一致。
      -->
      <el-dropdown
        :trigger="ui.isMobile ? 'click' : 'hover'"
        @command="(cmd: string) => $emit('action', cmd, event)"
      >
        <el-icon class="event-more" @click.stop><MoreFilled /></el-icon>
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
import type { Event } from '@/types/models'
import { useUiStore } from '@/stores/ui'
import { formatEventTime } from '../composables/useCalendar'

defineProps<{
  title: string
  events: Event[]
}>()

defineEmits<{
  add: []
  edit: [event: Event]
  action: [cmd: string, event: Event]
}>()

// 只用来挑 el-dropdown 的 trigger：桌面 hover / 手机 click
const ui = useUiStore()
</script>

<style scoped lang="scss">
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }
}

.event-list-sidebar {
  flex: 1;
  overflow-y: auto;
}

.no-events {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #c0c4cc;

  p {
    margin: 10px 0 0;
    font-size: 14px;
  }
}

.event-card {
  display: flex;
  gap: 10px;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-bottom: 8px;

  &:hover {
    background-color: #f5f7fa;
  }

  .event-color {
    width: 4px;
    min-width: 4px;
    border-radius: 2px;
  }

  .event-content {
    flex: 1;
    min-width: 0;

    .event-title {
      font-size: 14px;
      color: #303133;
      margin-bottom: 4px;
      font-weight: 500;
    }

    .event-time {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #909399;
      margin-bottom: 4px;
    }

    .event-desc {
      font-size: 12px;
      color: #909399;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .event-more {
    cursor: pointer;
    color: #909399;

    &:hover {
      color: #409eff;
    }
  }
}
</style>
