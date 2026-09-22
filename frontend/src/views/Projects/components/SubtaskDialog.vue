<template>
  <el-dialog
    :model-value="visible"
    :title="subtask ? '编辑子任务' : '添加子任务'"
    width="450px"
    destroy-on-close
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="标题" prop="title">
        <el-input v-model="form.title" placeholder="请输入子任务标题" />
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-select v-model="form.status" placeholder="选择状态">
          <el-option
            v-for="status in statuses"
            :key="status.value"
            :label="status.label"
            :value="status.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="优先级" prop="priority">
        <el-select v-model="form.priority" placeholder="选择优先级">
          <el-option label="紧急" value="urgent" />
          <el-option label="高" value="high" />
          <el-option label="中" value="medium" />
          <el-option label="低" value="low" />
        </el-select>
      </el-form-item>

      <el-form-item label="负责人" prop="assignee">
        <el-input v-model="form.assignee" placeholder="请输入负责人" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="handleSubmit">
        {{ subtask ? '保存' : '添加' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { ProjectSubtask, TaskStatus } from '@/types/models'

export interface SubtaskFormPayload {
  title: string
  status: string
  priority: string
  assignee: string
  completed: boolean
}

const props = defineProps<{
  visible: boolean
  subtask: ProjectSubtask | null
  statuses: TaskStatus[]
  defaultStatus?: string
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [payload: SubtaskFormPayload]
}>()

const formRef = ref<FormInstance>()

const form = reactive({
  title: '',
  status: 'todo',
  priority: 'medium',
  assignee: '',
  completed: false
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入子任务标题', trigger: 'blur' }]
}

watch(
  () => props.visible,
  visible => {
    if (!visible) return
    const t = props.subtask
    form.title = t?.title ?? ''
    form.status = t?.status ?? props.defaultStatus ?? props.statuses[0]?.value ?? 'todo'
    form.priority = t?.priority ?? 'medium'
    form.assignee = t?.assignee ?? ''
    form.completed = t?.completed ?? false
  }
)

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  emit('submit', {
    title: form.title,
    status: form.status,
    priority: form.priority,
    assignee: form.assignee,
    completed: form.completed
  })
}
</script>
