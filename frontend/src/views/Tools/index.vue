<template>
  <div class="tools-page">
    <el-tabs v-model="activeTool">
      <el-tab-pane label="JSON 格式化" name="json">
        <JsonFormatter />
      </el-tab-pane>
      <el-tab-pane label="Base64" name="base64">
        <Base64Tool />
      </el-tab-pane>
      <el-tab-pane label="URL 编码" name="url">
        <UrlCodec />
      </el-tab-pane>
      <el-tab-pane label="时间戳" name="timestamp">
        <TimestampTool />
      </el-tab-pane>
      <el-tab-pane label="正则测试" name="regex">
        <RegexTester />
      </el-tab-pane>
      <el-tab-pane label="颜色转换" name="color">
        <ColorConverter />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import JsonFormatter from './components/JsonFormatter.vue'
import Base64Tool from './components/Base64Tool.vue'
import UrlCodec from './components/UrlCodec.vue'
import TimestampTool from './components/TimestampTool.vue'
import RegexTester from './components/RegexTester.vue'
import ColorConverter from './components/ColorConverter.vue'

const activeTool = ref('json')
</script>

<style scoped lang="scss">
.tools-page {
  padding: 0;
}
</style>
