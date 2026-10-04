<template>
  <!--
    书签的主操作就是「跳走」，所以整卡单击 = 打开。原来只绑 @dblclick，手机上双击不灵；
    ⋮ 又是 hover 触发（EP 默认），触屏点不开 —— 两条路都死，等于不能跳转。
    现在单击打开，⋮ 改 trigger="click" 并用 @click.stop 拦掉冒泡（同 TaskRow / SubtaskMCard）。
  -->
  <div class="bookmark-card" @click="$emit('open', bookmark)">
    <div class="card-header">
      <!--
        以前这里 <img> 打 Google 的 favicon 服务 —— 全离线是必然失败的请求。
        现在用域名首字母，零网络、也不会有碎图。
      -->
      <div class="favicon-wrapper">
        <span class="favicon-letter">{{ getDomain(bookmark.url).charAt(0).toUpperCase() }}</span>
      </div>
      <!-- @click.stop 在包裹层上：拦掉卡片的「点开链接」，但不挡 el-dropdown 自己的触发 -->
      <div class="card-more" @click.stop>
        <el-dropdown trigger="click" @command="(cmd: string) => $emit('action', cmd, bookmark)">
          <el-icon class="card-more-icon"><MoreFilled /></el-icon>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="open">打开链接</el-dropdown-item>
              <el-dropdown-item command="edit">编辑</el-dropdown-item>
              <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
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
  </div>
</template>

<script setup lang="ts">
import type { Bookmark } from '@/types/models'
import { getDomain } from '../composables/useBookmarks'

defineProps<{
  bookmark: Bookmark
}>()

defineEmits<{
  open: [bookmark: Bookmark]
  action: [cmd: string, bookmark: Bookmark]
}>()
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

      .favicon-letter {
        font-size: 14px;
        font-weight: 600;
        color: #409eff;
        line-height: 1;
      }
    }

    .card-more {
      // 44px 触摸区
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;

      .card-more-icon {
        color: #909399;
        cursor: pointer;
        font-size: 16px;
      }

      &:hover .card-more-icon {
        color: #409eff;
      }

      &:active .card-more-icon {
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
}
</style>
