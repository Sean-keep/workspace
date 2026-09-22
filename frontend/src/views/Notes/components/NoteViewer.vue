<template>
  <div class="edit-content">
    <!-- 标题 -->
    <div class="note-title">
      <h1>{{ note.title }}</h1>
    </div>

    <!-- 标签 -->
    <div class="note-tags">
      <el-tag v-for="tag in note.tags" :key="tag" type="info">
        {{ tag }}
      </el-tag>
    </div>

    <!-- 内容区域 -->
    <div class="note-body">
      <!-- 清单 -->
      <template v-if="note.note_type === 'checklist'">
        <div class="checklist-container">
          <div v-for="(item, index) in note.checklist_items" :key="index" class="checklist-item">
            <el-checkbox v-model="item.checked" disabled />
            <span :class="{ checked: item.checked }">{{ item.text }}</span>
          </div>
          <div class="checklist-stats">
            已完成 {{ getCheckedCount(note) }} / {{ note.checklist_items?.length || 0 }} 项
          </div>
        </div>
      </template>

      <!-- 笔记内容 -->
      <template v-else>
        <!-- eslint-disable-next-line vue/no-v-html -- markdown-it defaults (html:false, javascript: blocked) -->
        <div class="note-content" v-html="renderedContent" />
      </template>
    </div>

    <div class="note-meta">
      创建于 {{ formatDate(note.created_at) }} | 更新于 {{ formatDate(note.updated_at) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Note } from '@/types/models'
import { formatDate, getCheckedCount } from '../composables/useNotes'

defineProps<{
  note: Note
  renderedContent: string
}>()
</script>

<style scoped lang="scss">
.edit-content {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}

.note-title {
  margin-bottom: 16px;

  h1 {
    font-size: 24px;
    font-weight: 600;
    color: #303133;
    margin: 0;
  }
}

.note-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.note-body {
  margin-bottom: 20px;
}

.note-content {
  font-size: 15px;
  line-height: 1.8;
  color: #303133;

  :deep(h1), :deep(h2), :deep(h3) {
    margin-top: 20px;
    margin-bottom: 10px;
  }

  :deep(p) {
    margin-bottom: 12px;
  }

  :deep(code) {
    background-color: #f5f7fa;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
  }

  :deep(pre) {
    background-color: #1d1e1f;
    color: #e5eaf3;
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
  }

  :deep(ul), :deep(ol) {
    padding-left: 24px;
    margin-bottom: 12px;
  }
}

.checklist-container {
  .checklist-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid #f5f7fa;

    &:last-of-type {
      border-bottom: none;
    }

    .checked {
      text-decoration: line-through;
      color: #c0c4cc;
    }
  }

  .checklist-stats {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #ebeef5;
    font-size: 14px;
    color: #909399;
  }
}

.note-meta {
  font-size: 13px;
  color: #909399;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}
</style>
