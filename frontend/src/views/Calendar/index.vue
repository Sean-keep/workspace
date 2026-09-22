<template>
  <div class="calendar-page">
    <div class="calendar-main">
      <div class="calendar-header">
        <div class="header-left">
          <el-button @click="goToday" size="small">今天</el-button>
          <el-button-group>
            <el-button :icon="ArrowLeft" @click="goPrev" size="small" />
            <el-button :icon="ArrowRight" @click="goNext" size="small" />
          </el-button-group>
          <h2>{{ currentTitle }}</h2>
        </div>
        <div class="header-right">
          <el-radio-group v-model="viewMode" size="small">
            <el-radio-button value="month">月</el-radio-button>
            <el-radio-button value="week">周</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <MonthGrid
        v-if="viewMode === 'month'"
        :days="calendarDays"
        :events-for="getDayEvents"
        :is-selected="isSelectedDate"
        @select="onSelectDay"
      />

      <WeekGrid
        v-else
        :days="weekDaysData"
        :events-at="getHourEvents"
        @select="onSelectDay"
        @select-datetime="(day, hour) => selectDateTime(day.date, hour)"
      />
    </div>

    <EventSidebar
      :title="sidebarTitle"
      :events="selectedEvents"
      @add="openAddDialog"
      @edit="eventDialog.openEdit"
      @action="handleEventAction"
    />

    <EventDialog
      v-model:visible="eventDialog.visible"
      :event="eventDialog.editing"
      :default-date="selectedDate.format('YYYY-MM-DD')"
      @submit="submitEvent"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import type { CalendarDay } from './composables/useCalendar'
import { useCalendar } from './composables/useCalendar'
import MonthGrid from './components/MonthGrid.vue'
import WeekGrid from './components/WeekGrid.vue'
import EventSidebar from './components/EventSidebar.vue'
import EventDialog from './components/EventDialog.vue'

const {
  viewMode,
  selectedDate,
  currentTitle,
  sidebarTitle,
  calendarDays,
  weekDaysData,
  selectedEvents,
  eventDialog,
  fetchEvents,
  getDayEvents,
  getHourEvents,
  isSelectedDate,
  selectDate,
  selectDateTime,
  goToday,
  goPrev,
  goNext,
  submitEvent,
  handleEventAction
} = useCalendar()

function onSelectDay(day: CalendarDay) {
  selectDate(day)
}

function openAddDialog() {
  eventDialog.openCreate()
}

onMounted(() => {
  fetchEvents()
})
</script>

<style scoped lang="scss">
.calendar-page {
  display: flex;
  gap: 16px;
  height: calc(100vh - 130px);
}

.calendar-main {
  flex: 1;
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;

    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
  }
}
</style>
