<template>
  <el-dialog
    :model-value="visible"
    :title="bookmark ? '编辑书签' : '添加书签'"
    width="500px"
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="网址" prop="url">
        <el-input v-model="form.url" placeholder="请输入网址" @blur="fetchTitle">
          <template #prepend>
            <el-icon><Link /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="标题" prop="title">
        <el-input v-model="form.title" placeholder="请输入标题" />
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="2"
          placeholder="请输入描述"
        />
      </el-form-item>

      <el-form-item label="分类" prop="category">
        <el-select
          v-model="form.category"
          filterable
          allow-create
          default-first-option
          placeholder="选择或创建分类"
        >
          <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
        </el-select>
      </el-form-item>

      <el-form-item label="标签" prop="tags">
        <el-select
          v-model="form.tags"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="添加标签"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        {{ bookmark ? '保存' : '添加' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { Bookmark } from '@/types/models'
import type { BookmarkFormState } from '../composables/useBookmarks'

const props = defineProps<{
  visible: boolean
  bookmark: Bookmark | null
  categories: string[]
  defaultCategory?: string
  submitting?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [form: BookmarkFormState]
}>()

const formRef = ref<FormInstance>()

const form = reactive<BookmarkFormState>({
  url: '',
  title: '',
  description: '',
  category: '',
  tags: []
})

const rules: FormRules = {
  url: [{ required: true, message: '请输入网址', trigger: 'blur' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }]
}

watch(
  () => props.visible,
  visible => {
    if (!visible) return
    const b = props.bookmark
    form.url = b?.url ?? ''
    form.title = b?.title ?? ''
    form.description = b?.description ?? ''
    form.category = b?.category ?? props.defaultCategory ?? ''
    form.tags = b?.tags ? [...b.tags] : []
  }
)

function fetchTitle() {
  if (!form.url || form.title) return
  try {
    const domain = new URL(form.url).hostname
    form.title = domain.replace('www.', '').split('.')[0]
  } catch {
    // Ignore
  }
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  emit('submit', { ...form, tags: [...form.tags] })
}
</script>
