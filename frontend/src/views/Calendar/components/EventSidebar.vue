<template>
  <div class="calendar-sidebar">
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
        <el-dropdown @command="(cmd: string) => $emit('action', cmd, event)">
          <el-icon class="event-more"><MoreFilled /></el-icon>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="edit">编辑</el-dropdown-item>
              <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Event } from '@/types/models'
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
</script>

<style scoped lang="scss">
.calendar-sidebar {
  width: 280px;
  min-width: 280px;
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;

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
