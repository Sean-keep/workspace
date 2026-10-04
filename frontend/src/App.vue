<template>
  <el-config-provider :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { useUiStore } from '@/stores/ui'

// 断点检测要赶在 MainLayout 渲染之前就绪，否则首帧会先画桌面壳再跳成手机壳。
const ui = useUiStore()
ui.init()
onMounted(() => {
  ui.init() // 幂等，SSR/挂载时序的兜底
})
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

#app {
  height: 100%;
}
</style>
