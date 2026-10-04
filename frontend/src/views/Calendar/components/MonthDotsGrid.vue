<template>
  <!--
    手机专用月历：7 列日期 + 最多 3 个事件色点。MonthGrid.vue 桌面在用，一动不动。
    360px 下列宽约 44px，放得下 7 列；事件标题放不下，只留色点 —— 详情看下面的当日议程。
  -->
  <div class="dots-grid">
    <div class="weekday-header">
      <div v-for="d in weekDays" :key="d" class="weekday-cell">{{ d }}</div>
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
        <span class="day-number">{{ day.day }}</span>
        <div class="dots">
          <span
            v-for="event in eventsFor(day).slice(0, 3)"
            :key="event.id"
            class="dot"
            :style="{ backgroundColor: event.color }"
          />
          <span v-if="eventsFor(day).length > 3" class="dot more">…</span>
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
.weekday-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 4px;

  .weekday-cell {
    text-align: center;
    font-size: 12px;
    font-weight: 600;
    color: #606266;
    padding: 6px 0;
  }
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.day-cell {
  // 7 列 × 44px 起步，手指点得中
  min-height: 46px;
  padding: 4px 0;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  background: #fafafa;
  border: 1px solid transparent;

  &.other-month {
    background: #f5f5f5;

    .day-number {
      color: #c0c4cc;
    }

    .dots {
      opacity: 0.45;
    }
  }

  .day-number {
    font-size: 13px;
    font-weight: 500;
    color: #303133;
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    line-height: 1;
  }

  // 今天：实心圆
  &.is-today {
    background-color: #ecf5ff;

    .day-number {
      background-color: #409eff;
      color: #fff;
      font-weight: 600;
    }
  }

  // 选中：描边圈。今天又选中时描边仍然可见（实心圆在里面）
  &.is-selected {
    background-color: #d9ecff;
    border-color: #409eff;
  }

  .dots {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    height: 6px;

    .dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      flex-shrink: 0;

      &.more {
        background: transparent;
        color: #909399;
        font-size: 10px;
        line-height: 1;
        width: auto;
        height: auto;
      }
    }
  }
}
</style>
