<template>
  <el-card class="list-card">
    <template #header>
      <div class="card-header">
        <span><el-icon><Calendar /></el-icon> 近期日程</span>
        <el-button type="primary" link @click="router.push('/calendar')">查看全部</el-button>
      </div>
    </template>
    <div class="list-scroll event-list">
      <div v-for="event in events" :key="event.id" class="event-item">
        <div class="event-indicator" :style="{ backgroundColor: event.color || '#409eff' }"></div>
        <div class="event-content">
          <div class="event-title">{{ event.title }}</div>
          <div class="event-time">
            <el-icon :size="12"><Clock /></el-icon>
            {{ formatEventTime(event) }}
          </div>
        </div>
      </div>
      <el-empty v-if="events.length === 0" description="暂无近期日程" :image-size="60" />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Calendar, Clock } from '@element-plus/icons-vue'
import { formatEventTime, type UpcomingEvent } from '../composables/useDashboard'

defineProps<{ events: UpcomingEvent[] }>()

const router = useRouter()
</script>

<style scoped lang="scss">
@use './card-shared.scss' as *;

.event-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }

  .event-indicator {
    width: 4px;
    height: 32px;
    border-radius: 2px;
    margin-top: 2px;
  }

  .event-content {
    flex: 1;

    .event-title {
      font-size: 13px;
      color: #303133;
      margin-bottom: 3px;
    }

    .event-time {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 12px;
      color: #909399;
    }
  }
}
</style>
