<template>
  <el-dialog
    :model-value="visible"
    :title="project ? '编辑项目' : '新建项目'"
    width="500px"
    destroy-on-close
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="项目名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入项目名称" />
      </el-form-item>

      <el-form-item label="项目描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="2"
          placeholder="请输入项目描述"
        />
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-select v-model="form.status" placeholder="选择状态">
              <el-option
                v-for="status in projectStatuses"
                :key="status.value"
                :label="status.label"
                :value="status.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="优先级" prop="priority">
            <el-select v-model="form.priority" placeholder="选择优先级">
              <el-option
                v-for="p in priorities"
                :key="p.value"
                :label="p.label"
                :value="p.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="截止日期" prop="deadline">
            <el-date-picker
              v-model="form.deadline"
              type="date"
              placeholder="选择日期"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="项目颜色" prop="color">
            <el-color-picker v-model="form.color" />
          </el-form-item>
        </el-col>
      </el-row>

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
        {{ project ? '保存' : '创建' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { Project } from '@/types/models'
import { priorities, projectStatuses } from '../composables/useProjects'

export interface ProjectFormPayload {
  name: string
  description: string
  status: string
  priority: string
  deadline: string | Date | null
  color: string
  tags: string[]
}

const props = defineProps<{
  visible: boolean
  project: Project | null
  submitting?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [payload: ProjectFormPayload]
}>()

const formRef = ref<FormInstance>()

const form = reactive({
  name: '',
  description: '',
  status: 'planning',
  priority: 'medium',
  deadline: null as string | Date | null,
  color: '#409eff',
  tags: [] as string[]
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }]
}

watch(
  () => props.visible,
  visible => {
    if (!visible) return
    const p = props.project
    form.name = p?.name ?? ''
    form.description = p?.description ?? ''
    form.status = p?.status ?? 'planning'
    form.priority = p?.priority ?? 'medium'
    form.deadline = p?.deadline ?? null
    form.color = p?.color ?? '#409eff'
    form.tags = p?.tags ? [...p.tags] : []
  }
)

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  emit('submit', {
    name: form.name,
    description: form.description,
    status: form.status,
    priority: form.priority,
    deadline: form.deadline,
    color: form.color,
    tags: [...form.tags]
  })
}
</script>
