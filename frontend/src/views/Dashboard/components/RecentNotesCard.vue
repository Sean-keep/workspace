<template>
  <el-card class="list-card">
    <template #header>
      <div class="card-header">
        <span><el-icon><Notebook /></el-icon> 最近笔记</span>
        <el-button type="primary" link @click="router.push('/notes')">查看全部</el-button>
      </div>
    </template>
    <div class="list-scroll notes-list">
      <div v-for="note in notes" :key="note.id" class="note-item" @click="router.push('/notes')">
        <div class="note-icon">
          <el-icon :size="16"><Document /></el-icon>
        </div>
        <div class="note-content">
          <div class="note-title">{{ note.title }}</div>
          <div class="note-time">{{ formatDate(note.updated_at || note.created_at) }}</div>
        </div>
      </div>
      <el-empty v-if="notes.length === 0" description="暂无笔记" :image-size="60" />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Notebook, Document } from '@element-plus/icons-vue'
import { formatDate, type RecentNote } from '../composables/useDashboard'

defineProps<{ notes: RecentNote[] }>()

const router = useRouter()
</script>

<style scoped lang="scss">
@use './card-shared.scss' as *;

.note-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #f5f7fa;
    margin: 0 -20px;
    padding: 10px 20px;
  }

  .note-icon {
    width: 32px;
    height: 32px;
    background-color: #e6a23c22;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #e6a23c;
  }

  .note-content {
    flex: 1;

    .note-title {
      font-size: 13px;
      color: #303133;
      margin-bottom: 2px;
    }

    .note-time {
      font-size: 12px;
      color: #909399;
    }
  }
}
</style>
