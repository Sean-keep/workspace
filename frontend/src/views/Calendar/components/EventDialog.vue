<template>
  <el-dialog
    :model-value="visible"
    :title="event ? '编辑日程' : '添加日程'"
    width="450px"
    destroy-on-close
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
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

      <el-form-item label="全天" prop="is_all_day">
        <el-switch v-model="form.is_all_day" />
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="开始" prop="start_time">
            <el-date-picker
              v-model="form.start_time"
              :type="form.is_all_day ? 'date' : 'datetime'"
              placeholder="开始时间"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="结束" prop="end_time">
            <el-date-picker
              v-model="form.end_time"
              :type="form.is_all_day ? 'date' : 'datetime'"
              placeholder="结束时间"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="颜色" prop="color">
        <el-color-picker v-model="form.color" :predefine="predefineColors" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="handleSubmit">
        {{ event ? '保存' : '添加' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import dayjs from 'dayjs'
import type { FormInstance } from 'element-plus'
import type { Event } from '@/types/models'
import { predefineColors, type EventFormState } from '../composables/useCalendar'

const props = defineProps<{
  visible: boolean
  event: Event | null
  defaultDate?: string
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [form: EventFormState]
}>()

const formRef = ref<FormInstance>()

const form = reactive<EventFormState>({
  title: '',
  description: '',
  start_time: null,
  end_time: null,
  is_all_day: false,
  color: '#409eff'
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  start_time: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  end_time: [{ required: true, message: '请选择结束时间', trigger: 'change' }]
}

watch(
  () => props.visible,
  visible => {
    if (!visible) return
    const e = props.event
    form.title = e?.title ?? ''
    form.description = e?.description ?? ''
    form.start_time = e?.start_time ?? props.defaultDate ?? dayjs().format('YYYY-MM-DD')
    form.end_time = e?.end_time ?? props.defaultDate ?? dayjs().format('YYYY-MM-DD')
    form.is_all_day = e?.is_all_day ?? false
    form.color = e?.color ?? '#409eff'
  }
)

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  emit('submit', { ...form })
}
</script>
