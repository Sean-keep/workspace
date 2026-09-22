<template>
  <div class="edit-content">
    <!-- 标题 -->
    <div class="note-title">
      <el-input v-model="form.title" placeholder="笔记标题" class="title-input" />
    </div>

    <!-- 标签 -->
    <div class="note-tags">
      <el-tag v-for="tag in form.tags" :key="tag" closable @close="removeTag(tag)">
        {{ tag }}
      </el-tag>
      <el-input
        v-if="tagInputVisible"
        ref="tagInputRef"
        v-model="newTag"
        class="tag-input"
        size="small"
        @keyup.enter="addTag"
        @blur="addTag"
      />
      <el-button v-else size="small" @click="showTagInput">+ 添加标签</el-button>
    </div>

    <!-- 内容区域 -->
    <div class="note-body">
      <!-- 清单 -->
      <template v-if="noteType === 'checklist'">
        <div class="checklist-container">
          <div v-for="(item, index) in form.checklist_items" :key="index" class="checklist-item">
            <el-checkbox v-model="item.checked" />
            <el-input
              v-model="item.text"
              class="item-input"
              placeholder="输入内容..."
              @keyup.enter="addChecklistItem(index)"
            />
            <el-button
              type="danger"
              :icon="Delete"
              circle
              size="small"
              @click="removeChecklistItem(index)"
            />
          </div>
          <div class="add-checklist-item" @click="addChecklistItem()">
            <el-icon><Plus /></el-icon>
            <span>添加项目</span>
          </div>
          <div class="checklist-stats">
            已完成 {{ checkedCount }} / {{ form.checklist_items?.length || 0 }} 项
          </div>
        </div>
      </template>

      <!-- 笔记内容 -->
      <template v-else>
        <el-input v-model="form.content" type="textarea" :rows="20" placeholder="开始编写..." />
      </template>
    </div>

    <div class="note-meta">
      创建于 {{ formatDate(note.created_at) }} | 更新于 {{ formatDate(note.updated_at) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { Delete } from '@element-plus/icons-vue'
import type { ChecklistItem, Note, NoteType } from '@/types/models'
import { formatDate, getCheckedCount } from '../composables/useNotes'

export interface NoteEditForm {
  title: string
  content: string
  tags: string[]
  checklist_items: ChecklistItem[]
}

const props = defineProps<{
  note: Note
  noteType: NoteType
}>()

const form = reactive<NoteEditForm>({
  title: '',
  content: '',
  tags: [],
  checklist_items: []
})

const tagInputVisible = ref(false)
const newTag = ref('')
const tagInputRef = ref<{ focus: () => void } | null>(null)

watch(
  () => props.note,
  note => {
    form.title = note.title
    form.content = note.content || ''
    form.tags = [...(note.tags || [])]
    form.checklist_items = note.checklist_items
      ? note.checklist_items.map(item => ({ ...item }))
      : []
  },
  { immediate: true, deep: true }
)

const checkedCount = computed(() => getCheckedCount(form))

function addChecklistItem(index?: number) {
  const items = form.checklist_items
  const newItem = { text: '', checked: false }

  if (index !== undefined) {
    items.splice(index + 1, 0, newItem)
  } else {
    items.push(newItem)
  }

  nextTick(() => {
    const inputs = document.querySelectorAll('.checklist-item .el-input__inner')
    const targetIndex = index !== undefined ? index + 1 : items.length - 1
    if (inputs[targetIndex]) {
      ;(inputs[targetIndex] as HTMLInputElement).focus()
    }
  })
}

function removeChecklistItem(index: number) {
  form.checklist_items.splice(index, 1)
}

function showTagInput() {
  tagInputVisible.value = true
  nextTick(() => {
    tagInputRef.value?.focus()
  })
}

function addTag() {
  if (newTag.value && !form.tags.includes(newTag.value)) {
    form.tags.push(newTag.value)
  }
  tagInputVisible.value = false
  newTag.value = ''
}

function removeTag(tag: string) {
  form.tags = form.tags.filter(t => t !== tag)
}

function getForm(): NoteEditForm {
  return {
    title: form.title,
    content: form.content,
    tags: [...form.tags],
    checklist_items: form.checklist_items.map(item => ({ ...item }))
  }
}

defineExpose({ getForm })
</script>

<style scoped lang="scss">
.edit-content {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}

.note-title {
  margin-bottom: 16px;

  .title-input {
    :deep(.el-input__inner) {
      font-size: 24px;
      font-weight: 600;
    }
  }
}

.note-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;

  .tag-input {
    width: 100px;
  }
}

.note-body {
  margin-bottom: 20px;
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

    .item-input {
      flex: 1;
    }

    .checked {
      text-decoration: line-through;
      color: #c0c4cc;
    }
  }

  .add-checklist-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 0;
    color: #909399;
    cursor: pointer;

    &:hover {
      color: #409eff;
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
