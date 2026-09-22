<template>
  <div class="tool-container">
    <el-card>
      <el-form label-width="80px">
        <el-form-item label="颜色选择">
          <el-color-picker v-model="colorValue" show-alpha @change="onColorChange" />
          <span class="color-value">{{ colorValue }}</span>
        </el-form-item>

        <el-form-item label="HEX">
          <el-input v-model="colorHex" @change="hexToRgb" />
        </el-form-item>

        <el-form-item label="RGB">
          <el-input v-model="colorRgb" />
        </el-form-item>

        <el-form-item label="HSL">
          <el-input v-model="colorHsl" />
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const colorValue = ref('#409eff')
const colorHex = ref('#409eff')
const colorRgb = ref('')
const colorHsl = ref('')

function onColorChange(val: string | null) {
  if (val) {
    colorHex.value = val
    hexToRgb()
  }
}

function hexToRgb() {
  const hex = colorHex.value.replace('#', '')
  if (hex.length === 6 || hex.length === 8) {
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    colorRgb.value = `rgb(${r}, ${g}, ${b})`
    colorValue.value = colorHex.value
  }
}
</script>

<style scoped lang="scss">
@use './tool-shared.scss' as *;

.color-value {
  margin-left: 12px;
  font-family: monospace;
}
</style>
