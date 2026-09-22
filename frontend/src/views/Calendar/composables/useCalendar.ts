import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs, { type Dayjs } from 'dayjs'
import { useResourceList, useConfirmDelete, useDialogForm } from '@/composables'
import type { Event, EventPayload } from '@/types/models'

export const weekDays = ['日', '一', '二', '三', '四', '五', '六']
export const hours = Array.from({ length: 14 }, (_, i) => i + 7) // 7:00 - 20:00

export const predefineColors = [
  '#409eff', '#67c23a', '#e6a23c', '#f56c6c',
  '#909399', '#00bcd4', '#9c27b0', '#ff9800'
]

export interface CalendarDay {
  date: Date
  day: number
  dateStr: string
  isCurrentMonth?: boolean
  isToday: boolean
  dayName?: string
}

export interface EventFormState {
  title: string
  description: string
  start_time: string | Date | null
  end_time: string | Date | null
  is_all_day: boolean
  color: string
}

export function formatEventTime(event: Event) {
  if (event.is_all_day) return '全天'
  return dayjs(event.start_time).format('HH:mm')
}

export function useCalendar() {
  const viewMode = ref<'month' | 'week'>('month')
  const currentDate = ref<Dayjs>(dayjs())
  const selectedDate = ref<Dayjs>(dayjs())

  const {
    items: events,
    loading,
    fetchList,
    create,
    update,
    remove,
    refresh
  } = useResourceList<Event>({
    path: '/events',
    pageSize: 500,
    getParams: () => {
      // Pad the visible window so adjacent-month cells stay populated.
      const start = currentDate.value.startOf('month').subtract(1, 'week')
      const end = currentDate.value.endOf('month').add(1, 'week')
      return {
        start_date: start.format('YYYY-MM-DD'),
        end_date: end.format('YYYY-MM-DD')
      }
    }
  })

  const { confirmDelete } = useConfirmDelete()
  const eventDialog = useDialogForm<Event>()

  const currentTitle = computed(() => {
    if (viewMode.value === 'month') {
      return currentDate.value.format('YYYY年 M月')
    }
    const start = currentDate.value.startOf('week')
    const end = currentDate.value.endOf('week')
    return `${start.format('M月D日')} - ${end.format('M月D日')}`
  })

  const sidebarTitle = computed(() => selectedDate.value.format('M月D日 dddd'))

  const calendarDays = computed<CalendarDay[]>(() => {
    const start = currentDate.value.startOf('month').startOf('week')
    const end = currentDate.value.endOf('month').endOf('week')
    const days: CalendarDay[] = []
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

  const weekDaysData = computed<CalendarDay[]>(() => {
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
    return events.value
      .filter(e => dayjs(e.start_time).format('YYYY-MM-DD') === dateStr)
      .sort((a, b) => dayjs(a.start_time).valueOf() - dayjs(b.start_time).valueOf())
  })

  function getDayEvents(day: CalendarDay) {
    return events.value.filter(
      e => dayjs(e.start_time).format('YYYY-MM-DD') === day.dateStr
    )
  }

  function getHourEvents(dateStr: string, hour: number) {
    return events.value.filter(e => {
      const eventDate = dayjs(e.start_time).format('YYYY-MM-DD')
      const eventHour = dayjs(e.start_time).hour()
      return eventDate === dateStr && eventHour === hour
    })
  }

  function isSelectedDate(day: CalendarDay) {
    return selectedDate.value.format('YYYY-MM-DD') === day.dateStr
  }

  function selectDate(day: CalendarDay | { date: Date }) {
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

  async function submitEvent(form: EventFormState) {
    const payload: EventPayload = {
      title: form.title,
      description: form.description,
      start_time: dayjs(form.start_time!).toISOString(),
      end_time: dayjs(form.end_time!).toISOString(),
      is_all_day: form.is_all_day,
      color: form.color
    }
    const editing = eventDialog.editing
    if (editing) {
      await update(editing.id, payload)
      ElMessage.success('日程已更新')
    } else {
      await create(payload)
      ElMessage.success('日程已添加')
    }
    eventDialog.close()
  }

  async function deleteEvent(event: Event) {
    if (!(await confirmDelete('确定要删除这个日程吗？'))) return
    await remove(event.id)
    ElMessage.success('日程已删除')
  }

  function handleEventAction(cmd: string, event: Event) {
    if (cmd === 'edit') eventDialog.openEdit(event)
    if (cmd === 'delete') void deleteEvent(event)
  }

  // Keep the window in sync when navigating months/weeks.
  watch(currentDate, () => {
    void refresh()
  })

  return {
    events,
    loading,
    viewMode,
    currentDate,
    selectedDate,
    currentTitle,
    sidebarTitle,
    calendarDays,
    weekDaysData,
    selectedEvents,
    eventDialog,
    fetchEvents: fetchList,
    getDayEvents,
    getHourEvents,
    isSelectedDate,
    selectDate,
    selectDateTime,
    goToday,
    goPrev,
    goNext,
    submitEvent,
    deleteEvent,
    handleEventAction
  }
}
