<template>
  <div class="bookmark-card" @dblclick="$emit('open', bookmark)">
    <div class="card-header">
      <div class="favicon-wrapper">
        <img
          :src="getFaviconUrl(bookmark.url)"
          class="favicon"
          @error="handleFaviconError"
          loading="lazy"
        />
      </div>
      <el-dropdown @command="(cmd: string) => $emit('action', cmd, bookmark)">
        <el-icon class="card-more"><MoreFilled /></el-icon>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="edit">编辑</el-dropdown-item>
            <el-dropdown-item command="open">打开链接</el-dropdown-item>
            <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <div class="card-title">{{ bookmark.title }}</div>
    <div class="card-url">{{ getDomain(bookmark.url) }}</div>
    <div v-if="bookmark.description" class="card-desc">{{ bookmark.description }}</div>
    <div class="card-footer">
      <div v-if="bookmark.tags?.length" class="card-tags">
        <el-tag v-for="tag in bookmark.tags.slice(0, 2)" :key="tag" size="small" type="info">
          {{ tag }}
        </el-tag>
      </div>
      <span class="visit-count">访问 {{ bookmark.visit_count }} 次</span>
    </div>
    <div class="dblclick-hint">双击打开</div>
  </div>
</template>

<script setup lang="ts">
import type { Bookmark } from '@/types/models'
import { getDomain, getFaviconUrl } from '../composables/useBookmarks'

defineProps<{
  bookmark: Bookmark
}>()

defineEmits<{
  open: [bookmark: Bookmark]
  action: [cmd: string, bookmark: Bookmark]
}>()

function handleFaviconError(e: Event) {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
}
</script>

<style scoped lang="scss">
.bookmark-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  border: 1px solid #ebeef5;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;

    .favicon-wrapper {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      overflow: hidden;
      background-color: #f5f7fa;
      display: flex;
      align-items: center;
      justify-content: center;

      .favicon {
        width: 20px;
        height: 20px;
        object-fit: contain;
      }
    }

    .card-more {
      color: #909399;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;

      &:hover {
        color: #409eff;
        background-color: #f5f7fa;
      }
    }
  }

  .card-title {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .card-url {
    font-size: 12px;
    color: #909399;
    margin-bottom: 8px;
  }

  .card-desc {
    font-size: 13px;
    color: #606266;
    margin-bottom: 10px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.4;
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .card-tags {
      display: flex;
      gap: 4px;
    }

    .visit-count {
      font-size: 12px;
      color: #c0c4cc;
    }
  }

  .dblclick-hint {
    position: absolute;
    bottom: 8px;
    right: 8px;
    font-size: 11px;
    color: #c0c4cc;
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover .dblclick-hint {
    opacity: 1;
  }
}
</style>
