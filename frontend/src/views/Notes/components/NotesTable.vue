<template>
  <div class="browse-mode">
    <PageHeader class="browse-header">
      <template #left>
        <el-input
          :model-value="searchQuery"
          placeholder="搜索笔记..."
          prefix-icon="Search"
          clearable
          class="search-input"
          @update:model-value="$emit('update:searchQuery', $event)"
        />
      </template>
      <template #right>
        <el-button type="primary" @click="$emit('create')">
          <el-icon><Plus /></el-icon>
          新建
        </el-button>
      </template>
    </PageHeader>

    <!-- 桌面 = 原表 + 原空态不动；手机 = NoteCard -->
    <ResponsiveList :items="notes" :loading="loading" empty-text="暂无笔记">
      <template #mobile="{ item }">
        <NoteCard
          :note="item"
          @view="(note: Note) => $emit('view', note)"
          @edit="(note: Note) => $emit('edit', note)"
          @delete="(note: Note) => $emit('delete', note)"
        />
      </template>

      <template #desktop>
        <el-table
          :data="notes"
          style="width: 100%"
          @row-click="(row: Note) => $emit('view', row)"
          row-class-name="clickable-row"
        >
          <el-table-column width="40">
            <template #default>
              <el-icon :size="18">
                <Document />
              </el-icon>
            </template>
          </el-table-column>

          <el-table-column prop="title" label="标题" min-width="200">
            <template #default="{ row }">
              <div class="title-cell">
                <el-tag v-if="(row as Note).is_pinned" size="small" type="warning" class="mr-2">置顶</el-tag>
                <el-tag v-if="(row as Note).is_favorite" size="small" type="danger" class="mr-2">收藏</el-tag>
                <span class="title-text">{{ (row as Note).title }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="内容预览" min-width="300">
            <template #default="{ row }">
              <div class="preview-cell">
                <span class="preview-text">{{ getContentPreview((row as Note).excerpt) }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="标签" width="200">
            <template #default="{ row }">
              <div class="tags-cell">
                <el-tag v-for="tag in (row as Note).tags?.slice(0, 2)" :key="tag" size="small" type="info">
                  {{ tag }}
                </el-tag>
                <span v-if="(row as Note).tags?.length > 2" class="more-tags">+{{ (row as Note).tags!.length - 2 }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="更新时间" width="150">
            <template #default="{ row }">
              <span class="time-text">{{ formatDate((row as Note).updated_at) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click.stop="$emit('edit', row as Note)">编辑</el-button>
              <el-button type="danger" link @click.stop="$emit('delete', row as Note)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-empty v-if="notes.length === 0" description="暂无笔记" />
      </template>
    </ResponsiveList>
  </div>
</template>

<script setup lang="ts">
import type { Note } from '@/types/models'
import { PageHeader, ResponsiveList } from '@/components/index'
import NoteCard from './NoteCard.vue'
import { formatDate, getContentPreview } from '../composables/useNotes'

defineProps<{
  notes: Note[]
  loading?: boolean
  searchQuery: string
}>()

defineEmits<{
  'update:searchQuery': [value: string]
  view: [note: Note]
  edit: [note: Note]
  delete: [note: Note]
  create: []
}>()
</script>

<style scoped lang="scss">
.browse-mode {
  .browse-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    border-bottom: 1px solid #ebeef5;

    .search-input {
      width: 300px;
    }
  }

  .el-table {
    .clickable-row {
      cursor: pointer;
    }

    .title-cell {
      display: flex;
      align-items: center;

      .mr-2 {
        margin-right: 8px;
      }

      .title-text {
        font-weight: 500;
      }
    }

    .preview-cell {
      .preview-text {
        font-size: 13px;
        color: #606266;
      }
    }

    .tags-cell {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      align-items: center;

      .more-tags {
        font-size: 12px;
        color: #909399;
      }
    }

    .time-text {
      font-size: 13px;
      color: #909399;
    }
  }
}

:deep(.el-table .el-table__row) {
  cursor: pointer;
}

// 手机（≤767px）。⚠️ 断点与 stores/ui.ts 的 MOBILE_MEDIA、
// assets/styles/main.scss 的 $bp-mobile 保持同步（768px）。
// 手机走卡片，白底圆角由 .browse-mode 继续提供。
@media (max-width: 767px) {
  .browse-mode {
    .browse-header {
      padding: 12px;

      .search-input {
        width: 100%;
      }
    }
  }
}
</style>
