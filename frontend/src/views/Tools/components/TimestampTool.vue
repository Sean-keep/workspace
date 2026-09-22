<template>
  <div class="tool-container">
    <el-card class="timestamp-card">
      <div class="timestamp-row">
        <span class="label">当前时间戳：</span>
        <el-input v-model="currentTimestamp" readonly />
        <el-button @click="refreshTimestamp">刷新</el-button>
      </div>

      <el-divider />

      <div class="timestamp-row">
        <span class="label">时间戳转时间：</span>
        <el-input v-model="tsInput" placeholder="输入时间戳..." />
        <el-button @click="tsToDate">转换</el-button>
      </div>
      <div v-if="tsResult" class="timestamp-result">{{ tsResult }}</div>

      <el-divider />

      <div class="timestamp-row">
        <span class="label">时间转时间戳：</span>
        <el-date-picker v-model="dateInput" type="datetime" placeholder="选择时间" />
        <el-button @click="dateToTs">转换</el-button>
      </div>
      <div v-if="dateResult" class="timestamp-result">{{ dateResult }}</div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const currentTimestamp = ref('')
const tsInput = ref('')
const tsResult = ref('')
const dateInput = ref('')
const dateResult = ref('')

function refreshTimestamp() {
  currentTimestamp.value = Date.now().toString()
}

function tsToDate() {
  try {
    const ts = parseInt(tsInput.value)
    if (isNaN(ts)) throw new Error('Invalid')
    const date = dayjs(ts.toString().length === 10 ? ts * 1000 : ts)
    tsResult.value = date.format('YYYY-MM-DD HH:mm:ss')
  } catch {
    ElMessage.error('无效的时间戳')
  }
}

function dateToTs() {
  if (!dateInput.value) return
  dateResult.value = dayjs(dateInput.value).valueOf().toString()
}

onMounted(refreshTimestamp)
</script>

<style scoped lang="scss">
@use './tool-shared.scss' as *;

.timestamp-card {
  .timestamp-row {
    display: flex;
    align-items: center;
    gap: 12px;

    .label {
      min-width: 120px;
      font-size: 14px;
      color: #606266;
    }
  }

  .timestamp-result {
    margin-top: 12px;
    padding: 12px;
    background-color: #f5f7fa;
    border-radius: 4px;
    font-family: monospace;
    font-size: 16px;
    color: #409eff;
  }
}
</style>
