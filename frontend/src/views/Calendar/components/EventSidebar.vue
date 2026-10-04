<template>
  <!--
    只剩 280px 的容器 + 宽度样式。列表本体在 EventList.vue（fragment root），
    手机端单独拿去当「当日议程」。拆开后这层 DOM 与拆分前完全一致。
  -->
  <div class="calendar-sidebar">
    <EventList
      :title="title"
      :events="events"
      @add="$emit('add')"
      @edit="(event: Event) => $emit('edit', event)"
      @action="(cmd: string, event: Event) => $emit('action', cmd, event)"
    />
  </div>
</template>

<script setup lang="ts">
import type { Event } from '@/types/models'
import EventList from './EventList.vue'

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
}
</style>
