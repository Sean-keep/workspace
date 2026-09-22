<template>
  <div class="calendar-grid">
    <div class="weekday-header">
      <div v-for="day in weekDays" :key="day" class="weekday-cell">{{ day }}</div>
    </div>
    <div class="days-grid">
      <div
        v-for="(day, index) in days"
        :key="index"
        class="day-cell"
        :class="{
          'other-month': !day.isCurrentMonth,
          'is-today': day.isToday,
          'is-selected': isSelected(day)
        }"
        @click="$emit('select', day)"
      >
        <div class="day-top">
          <span class="day-number">{{ day.day }}</span>
        </div>
        <div class="event-list">
          <div
            v-for="event in eventsFor(day).slice(0, 2)"
            :key="event.id"
            class="event-item"
            :style="{
              backgroundColor: event.color + '20',
              color: event.color,
              borderLeft: `3px solid ${event.color}`
            }"
          >
            <span class="event-text">{{ event.title }}</span>
          </div>
          <div v-if="eventsFor(day).length > 2" class="more-events">
            +{{ eventsFor(day).length - 2 }} 更多
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Event } from '@/types/models'
import type { CalendarDay } from '../composables/useCalendar'
import { weekDays } from '../composables/useCalendar'

defineProps<{
  days: CalendarDay[]
  eventsFor: (day: CalendarDay) => Event[]
  isSelected: (day: CalendarDay) => boolean
}>()

defineEmits<{
  select: [day: CalendarDay]
}>()
</script>

<style scoped lang="scss">
.calendar-grid {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.weekday-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 2px solid #ebeef5;
  margin-bottom: 8px;

  .weekday-cell {
    text-align: center;
    font-size: 13px;
    font-weight: 600;
    color: #606266;
    padding: 8px 0;
  }
}

.days-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr);
  gap: 6px;
}

.day-cell {
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 90px;
  background: #fafafa;
  border: 1px solid transparent;

  &:hover {
    background-color: #f0f5ff;
    border-color: #d0e0ff;
  }

  &.other-month {
    background: #f5f5f5;
    .day-number {
      color: #c0c4cc;
    }
    .event-list {
      opacity: 0.5;
    }
  }

  &.is-today {
    background-color: #ecf5ff;
    border-color: #a0cfff;

    .day-number {
      background-color: #409eff;
      color: #fff;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
    }
  }

  &.is-selected {
    background-color: #d9ecff;
    border-color: #409eff;
  }

  .day-top {
    margin-bottom: 4px;
  }

  .day-number {
    font-size: 13px;
    font-weight: 500;
    color: #303133;
  }

  .event-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .event-item {
    padding: 2px 4px;
    border-radius: 3px;
    font-size: 11px;
    line-height: 1.3;
    overflow: hidden;

    .event-text {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .more-events {
    font-size: 11px;
    color: #909399;
    padding: 1px 4px;
  }
}
</style>
