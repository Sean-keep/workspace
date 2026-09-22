<template>
  <div class="tool-container">
    <div class="tool-header">
      <el-button-group>
        <el-button @click="encodeUrl">编码</el-button>
        <el-button @click="decodeUrl">解码</el-button>
        <el-button @click="copyUrl">复制</el-button>
      </el-button-group>
    </div>
    <div class="tool-content">
      <el-input v-model="urlInput" type="textarea" :rows="6" placeholder="输入 URL 或文本..." />
      <el-input v-model="urlOutput" type="textarea" :rows="6" readonly placeholder="结果..." />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const urlInput = ref('')
const urlOutput = ref('')

function encodeUrl() {
  urlOutput.value = encodeURIComponent(urlInput.value)
}

function decodeUrl() {
  try {
    urlOutput.value = decodeURIComponent(urlInput.value)
  } catch {
    ElMessage.error('无效的 URL 编码')
  }
}

async function copyUrl() {
  if (!urlOutput.value) return
  await navigator.clipboard.writeText(urlOutput.value)
  ElMessage.success('已复制')
}
</script>

<style scoped lang="scss">
@use './tool-shared.scss' as *;
</style>
