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
      <el-input v-model="form.content" type="textarea" :rows="20" placeholder="开始编写..." />
    </div>

    <div class="note-meta">
      创建于 {{ formatDate(note.created_at) }} | 更新于 {{ formatDate(note.updated_at) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, reactive, ref, watch } from 'vue'
import type { Note } from '@/types/models'
import { formatDate } from '../composables/useNotes'

export interface NoteEditForm {
  title: string
  content: string
  tags: string[]
}

const props = defineProps<{
  note: Note
}>()

const form = reactive<NoteEditForm>({
  title: '',
  content: '',
  tags: []
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
  },
  { immediate: true, deep: true }
)

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
    tags: [...form.tags]
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

.note-meta {
  font-size: 13px;
  color: #909399;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}
</style>
