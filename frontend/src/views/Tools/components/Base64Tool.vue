<template>
  <div class="tool-container">
    <div class="tool-header">
      <el-button-group>
        <el-button @click="encodeBase64">编码</el-button>
        <el-button @click="decodeBase64">解码</el-button>
        <el-button @click="copyBase64">复制</el-button>
      </el-button-group>
    </div>
    <div class="tool-content">
      <el-input v-model="base64Input" type="textarea" :rows="8" placeholder="输入文本..." />
      <el-input v-model="base64Output" type="textarea" :rows="8" readonly placeholder="结果..." />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const base64Input = ref('')
const base64Output = ref('')

function encodeBase64() {
  base64Output.value = btoa(unescape(encodeURIComponent(base64Input.value)))
}

function decodeBase64() {
  try {
    base64Output.value = decodeURIComponent(escape(atob(base64Input.value)))
  } catch {
    ElMessage.error('无效的 Base64')
  }
}

async function copyBase64() {
  if (!base64Output.value) return
  await navigator.clipboard.writeText(base64Output.value)
  ElMessage.success('已复制')
}
</script>

<style scoped lang="scss">
@use './tool-shared.scss' as *;
</style>
