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
      <!-- 全离线：笔记里的远程图片 ![](http…) 断网时就是加载失败，其余 markdown 照常渲染。 -->
      <!-- eslint-disable-next-line vue/no-v-html -- markdown-it defaults (html:false, javascript: blocked) -->
      <div class="note-content" v-html="renderedContent" />
    </div>

    <div class="note-meta">
      创建于 {{ formatDate(note.created_at) }} | 更新于 {{ formatDate(note.updated_at) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Note } from '@/types/models'
import { formatDate } from '../composables/useNotes'

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

.note-meta {
  font-size: 13px;
  color: #909399;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}
</style>
