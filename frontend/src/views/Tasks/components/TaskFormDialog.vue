<template>
  <el-dialog
    :model-value="visible"
    :title="task ? '编辑任务' : '新建任务'"
    width="500px"
    destroy-on-close
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="任务名称" prop="title">
        <el-input v-model="form.title" placeholder="请输入任务名称" />
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入任务描述"
        />
      </el-form-item>

      <el-form-item label="优先级" prop="priority">
        <el-select v-model="form.priority" placeholder="选择优先级">
          <el-option label="紧急" value="urgent" />
          <el-option label="高" value="high" />
          <el-option label="中" value="medium" />
          <el-option label="低" value="low" />
        </el-select>
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

      <el-form-item label="截止日期" prop="due_date">
        <el-date-picker
          v-model="form.due_date"
          type="datetime"
          placeholder="选择截止日期"
          format="YYYY-MM-DD HH:mm"
          value-format="YYYY-MM-DDTHH:mm:ss"
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

      <el-divider />

      <el-form-item label="周期任务">
        <el-switch v-model="form.is_recurring" @change="onRecurringChange" />
      </el-form-item>

      <el-form-item v-if="form.is_recurring" label="重复方式" prop="recurrence_type">
        <el-select v-model="form.recurrence_type" placeholder="选择重复方式">
          <el-option label="每天" value="daily" />
          <el-option label="工作日（周一至周五）" value="weekdays" />
          <el-option label="每周" value="weekly" />
          <el-option label="每月" value="monthly" />
          <el-option label="自定义" value="custom" />
        </el-select>
      </el-form-item>

      <el-form-item v-if="form.recurrence_type === 'custom'" label="自定义">
        <el-checkbox-group v-model="form.recurrence_days">
          <el-checkbox :value="0">周一</el-checkbox>
          <el-checkbox :value="1">周二</el-checkbox>
          <el-checkbox :value="2">周三</el-checkbox>
          <el-checkbox :value="3">周四</el-checkbox>
          <el-checkbox :value="4">周五</el-checkbox>
          <el-checkbox :value="5">周六</el-checkbox>
          <el-checkbox :value="6">周日</el-checkbox>
        </el-checkbox-group>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        {{ task ? '保存' : '创建' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { RecurrenceType, Task, TaskPriority, TaskStatus } from '@/types/models'
import { commonTags, type TaskFormState } from '../composables/useTasks'

const props = defineProps<{
  visible: boolean
  task: Task | null
  statuses: TaskStatus[]
  defaultStatus?: string
  submitting?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [form: TaskFormState]
}>()

const formRef = ref<FormInstance>()

const form = reactive<TaskFormState>({
  title: '',
  description: '',
  priority: 'medium' as TaskPriority,
  status: 'todo',
  due_date: '',
  tags: [],
  is_recurring: false,
  recurrence_type: 'daily' as RecurrenceType,
  recurrence_days: []
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入任务名称', trigger: 'blur' }]
}

watch(
  () => props.visible,
  visible => {
    if (!visible) return
    const t = props.task
    form.title = t?.title ?? ''
    form.description = t?.description ?? ''
    form.priority = t?.priority ?? 'medium'
    form.status = t?.status ?? props.defaultStatus ?? props.statuses[0]?.value ?? 'todo'
    form.due_date = t?.due_date ?? ''
    form.tags = t?.tags ? [...t.tags] : []
    form.is_recurring = t?.is_recurring ?? false
    form.recurrence_type = t?.recurrence_type ?? 'daily'
    form.recurrence_days = t?.recurrence_days ? [...t.recurrence_days] : []
  }
)

function onRecurringChange(val: boolean | string | number) {
  if (!val) {
    form.recurrence_type = 'daily'
    form.recurrence_days = []
  }
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  emit('submit', {
    ...form,
    tags: [...form.tags],
    recurrence_days: [...form.recurrence_days]
  })
}
</script>
