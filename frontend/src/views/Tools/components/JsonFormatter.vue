<template>
  <div class="tool-container">
    <div class="tool-header">
      <el-button-group>
        <el-button @click="formatJson">格式化</el-button>
        <el-button @click="compressJson">压缩</el-button>
        <el-button @click="copyJson">复制</el-button>
        <el-button @click="clearJson">清空</el-button>
      </el-button-group>
    </div>
    <div class="tool-content">
      <el-input v-model="jsonInput" type="textarea" :rows="12" placeholder="粘贴 JSON 数据..." />
      <el-input v-model="jsonOutput" type="textarea" :rows="12" readonly placeholder="格式化结果..." />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const jsonInput = ref('')
const jsonOutput = ref('')

function formatJson() {
  try {
    const obj = JSON.parse(jsonInput.value)
    jsonOutput.value = JSON.stringify(obj, null, 2)
    ElMessage.success('格式化成功')
  } catch (e) {
    ElMessage.error('无效的 JSON: ' + (e as Error).message)
  }
}

function compressJson() {
  try {
    const obj = JSON.parse(jsonInput.value)
    jsonOutput.value = JSON.stringify(obj)
    ElMessage.success('压缩成功')
  } catch (e) {
    ElMessage.error('无效的 JSON: ' + (e as Error).message)
  }
}

async function copyJson() {
  if (!jsonOutput.value) return
  await navigator.clipboard.writeText(jsonOutput.value)
  ElMessage.success('已复制')
}

function clearJson() {
  jsonInput.value = ''
  jsonOutput.value = ''
}
</script>

<style scoped lang="scss">
@use './tool-shared.scss' as *;
</style>
