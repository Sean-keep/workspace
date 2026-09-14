<template>
  <div class="calendar-page">
    <div class="calendar-main">
      <!-- Header -->
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

      <!-- Month View -->
      <div v-if="viewMode === 'month'" class="calendar-grid">
        <div class="weekday-header">
          <div v-for="day in weekDays" :key="day" class="weekday-cell">{{ day }}</div>
        </div>
        <div class="days-grid">
          <div
            v-for="(day, index) in calendarDays"
            :key="index"
            class="day-cell"
            :class="{
              'other-month': !day.isCurrentMonth,
              'is-today': day.isToday,
              'is-selected': isSelectedDate(day)
            }"
            @click="selectDate(day)"
          >
            <div class="day-top">
              <span class="day-number">{{ day.day }}</span>
            </div>
            <div class="event-list">
              <div
                v-for="event in getDayEvents(day).slice(0, 2)"
                :key="event.id"
                class="event-item"
                :style="{ backgroundColor: event.color + '20', color: event.color, borderLeft: `3px solid ${event.color}` }"
              >
                <span class="event-text">{{ event.title }}</span>
              </div>
              <div v-if="getDayEvents(day).length > 2" class="more-events">
                +{{ getDayEvents(day).length - 2 }} 更多
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Week View -->
      <div v-else class="week-view">
        <div class="week-header">
          <div class="time-col"></div>
          <div
            v-for="day in weekDaysData"
            :key="day.date"
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
                v-for="day in weekDaysData"
                :key="day.date"
                class="time-cell"
                :class="{ 'is-today': day.isToday }"
                @click="selectDateTime(day.date, hour)"
              >
                <div
                  v-for="event in getHourEvents(day.dateStr, hour)"
                  :key="event.id"
                  class="week-event"
                  :style="{ backgroundColor: event.color }"
                  @click.stop="selectDate({ dateStr: day.dateStr })"
                >
                  <span class="event-title">{{ event.title }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sidebar -->
    <div class="calendar-sidebar">
      <div class="sidebar-header">
        <h3>{{ sidebarTitle }}</h3>
        <el-button type="primary" size="small" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
          添加
        </el-button>
      </div>

      <div class="event-list-sidebar">
        <div v-if="selectedEvents.length === 0" class="no-events">
          <el-icon :size="32"><Calendar /></el-icon>
          <p>暂无日程</p>
        </div>
        <div
          v-for="event in selectedEvents"
          :key="event.id"
          class="event-card"
          @click="editEvent(event)"
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
          <el-dropdown @command="(cmd: string) => handleEventAction(cmd, event)">
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

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingEvent ? '编辑日程' : '添加日程'"
      width="450px"
      destroy-on-close
    >
      <el-form
        ref="eventFormRef"
        :model="eventForm"
        :rules="eventRules"
        label-width="80px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="eventForm.title" placeholder="请输入标题" />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="eventForm.description"
            type="textarea"
            :rows="2"
            placeholder="请输入描述"
          />
        </el-form-item>

        <el-form-item label="全天" prop="is_all_day">
          <el-switch v-model="eventForm.is_all_day" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始" prop="start_time">
              <el-date-picker
                v-model="eventForm.start_time"
                :type="eventForm.is_all_day ? 'date' : 'datetime'"
                placeholder="开始时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束" prop="end_time">
              <el-date-picker
                v-model="eventForm.end_time"
                :type="eventForm.is_all_day ? 'date' : 'datetime'"
                placeholder="结束时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="颜色" prop="color">
          <el-color-picker v-model="eventForm.color" :predefine="predefineColors" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">
          {{ editingEvent ? '保存' : '添加' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { ArrowLeft, ArrowRight, Plus, Clock, MoreFilled, Calendar } from '@element-plus/icons-vue'
import api from '@/utils/api'
import dayjs from 'dayjs'

const viewMode = ref<'month' | 'week'>('month')
const currentDate = ref(dayjs())
const selectedDate = ref(dayjs())
const events = ref<any[]>([])
const dialogVisible = ref(false)
const editingEvent = ref<any>(null)
const eventFormRef = ref<FormInstance>()

const weekDays = ['日', '一', '二', '三', '四', '五', '六']
const hours = Array.from({ length: 14 }, (_, i) => i + 7) // 7:00 - 20:00

const predefineColors = [
  '#409eff', '#67c23a', '#e6a23c', '#f56c6c',
  '#909399', '#00bcd4', '#9c27b0', '#ff9800'
]

const eventForm = reactive({
  title: '',
  description: '',
  start_time: null as any,
  end_time: null as any,
  is_all_day: false,
  color: '#409eff'
})

const eventRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  start_time: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  end_time: [{ required: true, message: '请选择结束时间', trigger: 'change' }]
}

const currentTitle = computed(() => {
  if (viewMode.value === 'month') {
    return currentDate.value.format('YYYY年 M月')
  }
  const start = currentDate.value.startOf('week')
  const end = currentDate.value.endOf('week')
  return `${start.format('M月D日')} - ${end.format('M月D日')}`
})

const sidebarTitle = computed(() => {
  return selectedDate.value.format('M月D日 dddd')
})

const calendarDays = computed(() => {
  const start = currentDate.value.startOf('month').startOf('week')
  const end = currentDate.value.endOf('month').endOf('week')
  const days = []
  let day = start

  while (day.isBefore(end) || day.isSame(end, 'day')) {
    days.push({
      date: day.toDate(),
      day: day.date(),
      dateStr: day.format('YYYY-MM-DD'),
      isCurrentMonth: day.month() === currentDate.value.month(),
      isToday: day.isSame(dayjs(), 'day')
    })
    day = day.add(1, 'day')
  }

  return days
})

const weekDaysData = computed(() => {
  const start = currentDate.value.startOf('week')
  return Array.from({ length: 7 }, (_, i) => {
    const day = start.add(i, 'day')
    return {
      date: day.toDate(),
      dateStr: day.format('YYYY-MM-DD'),
      day: day.date(),
      dayName: weekDays[i],
      isToday: day.isSame(dayjs(), 'day')
    }
  })
})

const selectedEvents = computed(() => {
  const dateStr = selectedDate.value.format('YYYY-MM-DD')
  return events.value.filter(e => {
    const eventDate = dayjs(e.start_time).format('YYYY-MM-DD')
    return eventDate === dateStr
  }).sort((a, b) => dayjs(a.start_time).valueOf() - dayjs(b.start_time).valueOf())
})

onMounted(() => {
  fetchEvents()
})

async function fetchEvents() {
  try {
    const res: any = await api.get('/events')
    events.value = res.data || []
  } catch (error) {
    events.value = []
  }
}

function getDayEvents(day: any) {
  return events.value.filter(e => {
    const eventDate = dayjs(e.start_time).format('YYYY-MM-DD')
    return eventDate === day.dateStr
  })
}

function getHourEvents(dateStr: string, hour: number) {
  return events.value.filter(e => {
    const eventDate = dayjs(e.start_time).format('YYYY-MM-DD')
    const eventHour = dayjs(e.start_time).hour()
    return eventDate === dateStr && eventHour === hour
  })
}

function isSelectedDate(day: any) {
  return selectedDate.value.format('YYYY-MM-DD') === day.dateStr
}

function selectDate(day: any) {
  selectedDate.value = dayjs(day.date)
}

function selectDateTime(date: Date, hour: number) {
  selectedDate.value = dayjs(date).hour(hour)
}

function goToday() {
  currentDate.value = dayjs()
  selectedDate.value = dayjs()
}

function goPrev() {
  if (viewMode.value === 'month') {
    currentDate.value = currentDate.value.subtract(1, 'month')
  } else {
    currentDate.value = currentDate.value.subtract(1, 'week')
  }
}

function goNext() {
  if (viewMode.value === 'month') {
    currentDate.value = currentDate.value.add(1, 'month')
  } else {
    currentDate.value = currentDate.value.add(1, 'week')
  }
}

function formatEventTime(event: any) {
  if (event.is_all_day) return '全天'
  return dayjs(event.start_time).format('HH:mm')
}

function showAddDialog() {
  editingEvent.value = null
  eventForm.title = ''
  eventForm.description = ''
  eventForm.start_time = selectedDate.value.format('YYYY-MM-DD')
  eventForm.end_time = selectedDate.value.format('YYYY-MM-DD')
  eventForm.is_all_day = false
  eventForm.color = '#409eff'
  dialogVisible.value = true
}

function editEvent(event: any) {
  editingEvent.value = event
  eventForm.title = event.title
  eventForm.description = event.description || ''
  eventForm.start_time = event.start_time
  eventForm.end_time = event.end_time
  eventForm.is_all_day = event.is_all_day || false
  eventForm.color = event.color || '#409eff'
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await eventFormRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    const data = {
      ...eventForm,
      start_time: dayjs(eventForm.start_time).toISOString(),
      end_time: dayjs(eventForm.end_time).toISOString()
    }

    if (editingEvent.value) {
      await api.put(`/events/${editingEvent.value.id}`, data)
      ElMessage.success('日程已更新')
    } else {
      await api.post('/events', data)
      ElMessage.success('日程已添加')
    }

    dialogVisible.value = false
    fetchEvents()
  } catch (error) {
    console.error(error)
  }
}

function handleEventAction(cmd: string, event: any) {
  if (cmd === 'edit') editEvent(event)
  if (cmd === 'delete') deleteEvent(event)
}

async function deleteEvent(event: any) {
  try {
    await ElMessageBox.confirm('确定要删除这个日程吗？', '提示', { type: 'warning' })
    await api.delete(`/events/${event.id}`)
    ElMessage.success('日程已删除')
    fetchEvents()
  } catch (error) {
    // Cancelled
  }
}
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

// Month View
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

// Week View
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

// Sidebar
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
