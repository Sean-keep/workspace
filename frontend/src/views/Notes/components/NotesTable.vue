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
        <el-select
          :model-value="filterType"
          placeholder="类型"
          clearable
          @update:model-value="$emit('update:filterType', $event)"
        >
          <el-option label="全部" value="" />
          <el-option label="笔记" value="note" />
          <el-option label="清单" value="checklist" />
        </el-select>
      </template>
      <template #right>
        <el-dropdown @command="(cmd: string) => $emit('create', cmd as NoteType)">
          <el-button type="primary">
            <el-icon><Plus /></el-icon>
            新建
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="note">
                <el-icon><Document /></el-icon>
                新建笔记
              </el-dropdown-item>
              <el-dropdown-item command="checklist">
                <el-icon><Finished /></el-icon>
                新建清单
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </PageHeader>

    <el-table
      :data="notes"
      style="width: 100%"
      @row-click="(row: Note) => $emit('view', row)"
      row-class-name="clickable-row"
    >
      <el-table-column width="40">
        <template #default="{ row }">
          <el-icon :size="18">
            <Finished v-if="(row as Note).note_type === 'checklist'" />
            <Document v-else />
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
            <template v-if="(row as Note).note_type === 'checklist'">
              <div class="checklist-info">
                <el-progress
                  :percentage="getChecklistProgress(row as Note)"
                  :stroke-width="4"
                  :show-text="false"
                  style="width: 60px;"
                />
                <span>{{ getCheckedCount(row as Note) }}/{{ (row as Note).checklist_items?.length || 0 }}</span>
              </div>
            </template>
            <template v-else>
              <span class="preview-text">{{ getContentPreview((row as Note).excerpt) }}</span>
            </template>
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
  </div>
</template>

<script setup lang="ts">
import type { Note, NoteType } from '@/types/models'
import { PageHeader } from '@/components/index'
import {
  formatDate,
  getChecklistProgress,
  getCheckedCount,
  getContentPreview
} from '../composables/useNotes'

defineProps<{
  notes: Note[]
  searchQuery: string
  filterType: string
}>()

defineEmits<{
  'update:searchQuery': [value: string]
  'update:filterType': [value: string]
  view: [note: Note]
  edit: [note: Note]
  delete: [note: Note]
  create: [type: NoteType]
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
      .checklist-info {
        display: flex;
        align-items: center;
        gap: 10px;

        span {
          font-size: 12px;
          color: #909399;
        }
      }

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
</style>
