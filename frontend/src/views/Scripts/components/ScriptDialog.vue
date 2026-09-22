<template>
  <el-dialog
    :model-value="visible"
    :title="script ? '编辑脚本' : '新建脚本'"
    width="800px"
    top="5vh"
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="标题" prop="title">
        <el-input v-model="form.title" placeholder="请输入脚本标题" />
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="2"
          placeholder="请输入脚本描述（可选）"
        />
      </el-form-item>

      <el-form-item label="语言" prop="language">
        <el-select
          v-model="form.language"
          filterable
          allow-create
          default-first-option
          placeholder="选择语言"
        >
          <el-option v-for="lang in commonLanguages" :key="lang" :label="lang" :value="lang" />
        </el-select>
      </el-form-item>

      <el-form-item label="脚本内容" prop="code">
        <el-input
          v-model="form.code"
          type="textarea"
          :rows="16"
          placeholder="粘贴脚本内容..."
          class="code-textarea"
        />
      </el-form-item>

      <el-form-item label="标签" prop="tags">
        <el-select
          v-model="form.tags"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="添加标签"
        >
          <el-option v-for="tag in commonTags" :key="tag" :label="tag" :value="tag" />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        {{ script ? '保存' : '创建' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { Snippet } from '@/types/models'
import { commonLanguages, commonTags, type ScriptFormState } from '../composables/useScripts'

const props = defineProps<{
  visible: boolean
  script: Snippet | null
  submitting?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [form: ScriptFormState]
}>()

const formRef = ref<FormInstance>()

const form = reactive<ScriptFormState>({
  title: '',
  description: '',
  language: 'Shell',
  code: '',
  tags: []
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入脚本标题', trigger: 'blur' }],
  code: [{ required: true, message: '请输入脚本内容', trigger: 'blur' }]
}

watch(
  () => props.visible,
  visible => {
    if (!visible) return
    const s = props.script
    form.title = s?.title ?? ''
    form.description = s?.description ?? ''
    form.language = s?.language ?? 'Shell'
    form.code = s?.code ?? ''
    form.tags = s?.tags ? [...s.tags] : []
  }
)

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  emit('submit', { ...form, tags: [...form.tags] })
}
</script>

<style scoped lang="scss">
.code-textarea {
  :deep(.el-textarea__inner) {
    font-family: 'Courier New', Consolas, monospace;
    font-size: 13px;
    line-height: 1.6;
    tab-size: 2;
  }
}
</style>
