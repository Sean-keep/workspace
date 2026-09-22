<template>
  <div class="tool-container">
    <el-card>
      <el-form label-width="80px">
        <el-form-item label="正则表达式">
          <el-input v-model="regexPattern" placeholder="输入正则表达式...">
            <template #prepend>/</template>
            <template #append>/{{ regexFlags }}</template>
          </el-input>
        </el-form-item>

        <el-form-item label="标志">
          <el-checkbox-group v-model="regexFlagList">
            <el-checkbox label="g">全局匹配</el-checkbox>
            <el-checkbox label="i">忽略大小写</el-checkbox>
            <el-checkbox label="m">多行模式</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="测试文本">
          <el-input v-model="regexInput" type="textarea" :rows="6" placeholder="输入测试文本..." />
        </el-form-item>

        <el-form-item label="匹配结果">
          <div class="regex-result">
            <div v-if="regexMatches.length > 0">
              <div v-for="(match, index) in regexMatches" :key="index" class="match-item">
                <span class="match-index">{{ index }}:</span>
                <span class="match-value">{{ match }}</span>
              </div>
            </div>
            <div v-else class="no-match">无匹配结果</div>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const regexPattern = ref('')
const regexInput = ref('')
const regexFlagList = ref<string[]>(['g'])

const regexFlags = computed(() => regexFlagList.value.join(''))

const regexMatches = computed(() => {
  if (!regexPattern.value || !regexInput.value) return []
  try {
    const regex = new RegExp(regexPattern.value, regexFlags.value)
    return regexInput.value.match(regex) || []
  } catch {
    return []
  }
})
</script>

<style scoped lang="scss">
@use './tool-shared.scss' as *;

.regex-result {
  width: 100%;
  min-height: 100px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;

  .match-item {
    padding: 4px 0;
    border-bottom: 1px solid #ebeef5;

    &:last-child {
      border-bottom: none;
    }

    .match-index {
      color: #909399;
      margin-right: 8px;
    }

    .match-value {
      font-family: monospace;
      color: #303133;
    }
  }

  .no-match {
    color: #909399;
    text-align: center;
  }
}
</style>
