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
        <!-- 手机只做月历圆点，不做周/小时时间轴 —— 隐藏切换，免得点进去是坏的 -->
        <div v-if="!ui.isMobile" class="header-right">
          <el-radio-group v-model="viewMode" size="small">
            <el-radio-button value="month">月</el-radio-button>
            <el-radio-button value="week">周</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- 手机：月历圆点 + 内联当日议程（跟页面一起滚，不弹层） -->
      <template v-if="ui.isMobile">
        <MonthDotsGrid
          :days="calendarDays"
          :events-for="getDayEvents"
          :is-selected="isSelectedDate"
          @select="onSelectDay"
        />
        <!--
          外面套一层：EventList 是 fragment root（桌面 DOM 不能多包裹元素），
          class 不会自动落到它的根节点上，只能自己包。
        -->
        <div class="mobile-agenda">
          <EventList
            :title="sidebarTitle"
            :events="selectedEvents"
            @add="openAddDialog"
            @edit="eventDialog.openEdit"
            @action="handleEventAction"
          />
        </div>
      </template>

      <MonthGrid
        v-else-if="viewMode === 'month'"
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
      v-if="!ui.isMobile"
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
import { useUiStore } from '@/stores/ui'
import type { CalendarDay } from './composables/useCalendar'
import { useCalendar } from './composables/useCalendar'
import MonthGrid from './components/MonthGrid.vue'
import MonthDotsGrid from './components/MonthDotsGrid.vue'
import WeekGrid from './components/WeekGrid.vue'
import EventSidebar from './components/EventSidebar.vue'
import EventList from './components/EventList.vue'
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

const ui = useUiStore()

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

// 手机（≤767px）。⚠️ 断点与 stores/ui.ts 的 MOBILE_MEDIA、
// assets/styles/main.scss 的 $bp-mobile 保持同步（768px）。
// 桌面是「固定一屏 + 侧栏内滚」；手机改成整页滚动，议程跟着圆点一起走。
// 100vh 在 Android Chrome 上会被地址栏裁掉，这里索性不要固定高度。
@media (max-width: 767px) {
  .calendar-page {
    display: block;
    height: auto;
  }

  .calendar-main {
    overflow: visible;
    padding: 12px;
  }

  .calendar-header {
    margin-bottom: 12px;

    .header-left {
      gap: 8px;
      flex-wrap: wrap;

      h2 {
        font-size: 16px;
      }
    }
  }

  .mobile-agenda {
    display: block;
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #ebeef5;
  }
}
</style>
