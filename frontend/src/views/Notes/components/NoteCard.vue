<template>
  <!--
    手机端笔记卡片。列表行已经带 160 字 `excerpt` 且不含正文，直接用。
  -->
  <div class="note-card" @click="$emit('view', note)">
    <div class="card-head">
      <el-icon class="card-icon" :size="18">
        <Document />
      </el-icon>
      <div class="card-title">
        <el-tag v-if="note.is_pinned" size="small" type="warning" class="flag">置顶</el-tag>
        <el-tag v-if="note.is_favorite" size="small" type="danger" class="flag">收藏</el-tag>
        <span class="title-text">{{ note.title }}</span>
      </div>
    </div>

    <div class="card-preview">{{ getContentPreview(note.excerpt) }}</div>

    <div class="card-foot">
      <div class="card-tags">
        <el-tag v-for="tag in note.tags?.slice(0, 3)" :key="tag" size="small" type="info">
          {{ tag }}
        </el-tag>
        <span v-if="(note.tags?.length || 0) > 3" class="more-tags">+{{ note.tags!.length - 3 }}</span>
      </div>

      <div class="card-right">
        <span class="card-time">{{ formatDate(note.updated_at) }}</span>
        <!-- @click.stop 在包裹层上：拦掉卡片的「点开查看」，但不挡 el-dropdown 自己的触发 -->
        <div class="card-more" @click.stop>
          <el-dropdown trigger="click" @command="(cmd: string) => onCommand(cmd)">
            <el-icon class="card-more-icon"><MoreFilled /></el-icon>
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
  </div>
</template>

<script setup lang="ts">
import type { Note } from '@/types/models'
import { formatDate, getContentPreview } from '../composables/useNotes'

const props = defineProps<{ note: Note }>()

const emit = defineEmits<{
  view: [note: Note]
  edit: [note: Note]
  delete: [note: Note]
}>()

function onCommand(cmd: string) {
  if (cmd === 'edit') emit('edit', props.note)
  else if (cmd === 'delete') emit('delete', props.note)
}
</script>

<style scoped lang="scss">
.note-card {
  padding: 12px;
  background-color: #fff;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.card-head {
  display: flex;
  align-items: flex-start;
  gap: 8px;

  .card-icon {
    flex-shrink: 0;
    margin-top: 2px;
    color: #909399;
  }

  .card-title {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;

    .flag {
      flex-shrink: 0;
    }

    .title-text {
      font-size: 14px;
      font-weight: 500;
      color: #303133;
      line-height: 1.4;
      word-break: break-word;
    }
  }
}

.card-preview {
  margin-top: 6px;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;

  .card-tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    min-width: 0;

    .more-tags {
      font-size: 12px;
      color: #909399;
    }
  }

  .card-right {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;

    .card-time {
      font-size: 12px;
      color: #909399;
      white-space: nowrap;
    }
  }
}

.card-more {
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

  &:active .card-more-icon {
    color: #409eff;
    background-color: #f5f7fa;
  }
}
</style>
