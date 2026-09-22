<template>
  <div class="week-view">
    <div class="week-header">
      <div class="time-col"></div>
      <div
        v-for="day in days"
        :key="day.dateStr"
        class="week-day-header"
        :class="{ 'is-today': day.isToday }"
      >
        <div class="day-name">{{ day.dayName }}</div>
        <div class="day-num" :class="{ today: day.isToday }">{{ day.day }}</div>
      </div>
    </div>
    <div class="week-body">
      <div class="time-slots">
        <div v-for="hour in hours" :key="hour" class="time-row">
          <div class="time-label">{{ hour }}:00</div>
          <div
            v-for="day in days"
            :key="day.dateStr"
            class="time-cell"
            :class="{ 'is-today': day.isToday }"
            @click="$emit('select-datetime', day, hour)"
          >
            <div
              v-for="event in eventsAt(day.dateStr, hour)"
              :key="event.id"
              class="week-event"
              :style="{ backgroundColor: event.color }"
              @click.stop="$emit('select', day)"
            >
              <span class="event-title">{{ event.title }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Event } from '@/types/models'
import type { CalendarDay } from '../composables/useCalendar'
import { hours } from '../composables/useCalendar'

defineProps<{
  days: CalendarDay[]
  eventsAt: (dateStr: string, hour: number) => Event[]
}>()

defineEmits<{
  select: [day: CalendarDay]
  'select-datetime': [day: CalendarDay, hour: number]
}>()
</script>

<style scoped lang="scss">
.week-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.week-header {
  display: flex;
  border-bottom: 1px solid #ebeef5;

  .time-col {
    width: 50px;
    min-width: 50px;
  }

  .week-day-header {
    flex: 1;
    text-align: center;
    padding: 8px 0;

    &.is-today {
      background-color: #ecf5ff;
    }

    .day-name {
      font-size: 12px;
      color: #909399;
    }

    .day-num {
      font-size: 16px;
      font-weight: 600;
      color: #303133;

      &.today {
        background-color: #409eff;
        color: #fff;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
    }
  }
}

.week-body {
  flex: 1;
  overflow-y: auto;
}

.time-slots {
  .time-row {
    display: flex;
    border-bottom: 1px solid #f0f0f0;

    .time-label {
      width: 50px;
      min-width: 50px;
      font-size: 11px;
      color: #909399;
      padding: 4px 6px;
      text-align: right;
    }

    .time-cell {
      flex: 1;
      min-height: 40px;
      border-left: 1px solid #f0f0f0;
      padding: 2px;
      cursor: pointer;

      &.is-today {
        background-color: #fafafa;
      }

      &:hover {
        background-color: #f5f7fa;
      }
    }
  }
}

.week-event {
  padding: 2px 4px;
  border-radius: 3px;
  margin-bottom: 1px;
  cursor: pointer;

  .event-title {
    font-size: 11px;
    color: #fff;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
