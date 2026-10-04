<template>
  <el-popover placement="bottom" :width="300" trigger="click">
    <template #reference>
      <el-badge :value="notifications.length" :max="99" class="notification-badge">
        <el-button :icon="Bell" circle size="small" />
      </el-badge>
    </template>

    <div class="notification-panel">
      <div class="notification-header">
        <span>消息通知</span>
        <el-button type="primary" link @click="$emit('clear')">全部已读</el-button>
      </div>
      <el-scrollbar max-height="250px">
        <div v-if="notifications.length > 0">
          <div
            v-for="item in notifications"
            :key="item.id"
            class="notification-item"
            @click="$emit('open', item)"
          >
            <el-icon :size="14" :color="item.color || '#409eff'">
              <component :is="item.icon || 'InfoFilled'" />
            </el-icon>
            <div class="notification-content">
              <div class="notification-title">{{ item.title }}</div>
              <div class="notification-time">{{ formatTime(item.time) }}</div>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无通知" :image-size="50" />
      </el-scrollbar>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { Bell } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import type { NotificationItem } from '@/utils/api-types'

defineProps<{ notifications: NotificationItem[] }>()
defineEmits<{ clear: []; open: [item: NotificationItem] }>()

function formatTime(time: string) {
  return dayjs(time).format('MM-DD HH:mm')
}
</script>

<style scoped lang="scss">
.notification-badge {
  cursor: pointer;
}

.notification-panel {
  .notification-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    margin-bottom: 10px;

    span {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .notification-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    cursor: pointer;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background-color: var(--el-fill-color-light);
    }
  }

  .notification-content {
    flex: 1;

    .notification-title {
      font-size: 13px;
      color: var(--el-text-color-primary);
      margin-bottom: 2px;
    }

    .notification-time {
      font-size: 11px;
      color: var(--el-text-color-secondary);
    }
  }
}
</style>
