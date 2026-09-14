<template>
  <div class="tools-page">
    <el-tabs v-model="activeTool">
      <!-- JSON Formatter -->
      <el-tab-pane label="JSON 格式化" name="json">
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
            <el-input
              v-model="jsonInput"
              type="textarea"
              :rows="12"
              placeholder="粘贴 JSON 数据..."
            />
            <el-input
              v-model="jsonOutput"
              type="textarea"
              :rows="12"
              readonly
              placeholder="格式化结果..."
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- Base64 -->
      <el-tab-pane label="Base64" name="base64">
        <div class="tool-container">
          <div class="tool-header">
            <el-button-group>
              <el-button @click="encodeBase64">编码</el-button>
              <el-button @click="decodeBase64">解码</el-button>
              <el-button @click="copyBase64">复制</el-button>
            </el-button-group>
          </div>
          <div class="tool-content">
            <el-input
              v-model="base64Input"
              type="textarea"
              :rows="8"
              placeholder="输入文本..."
            />
            <el-input
              v-model="base64Output"
              type="textarea"
              :rows="8"
              readonly
              placeholder="结果..."
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- URL Encode -->
      <el-tab-pane label="URL 编码" name="url">
        <div class="tool-container">
          <div class="tool-header">
            <el-button-group>
              <el-button @click="encodeUrl">编码</el-button>
              <el-button @click="decodeUrl">解码</el-button>
              <el-button @click="copyUrl">复制</el-button>
            </el-button-group>
          </div>
          <div class="tool-content">
            <el-input
              v-model="urlInput"
              type="textarea"
              :rows="6"
              placeholder="输入 URL 或文本..."
            />
            <el-input
              v-model="urlOutput"
              type="textarea"
              :rows="6"
              readonly
              placeholder="结果..."
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- Timestamp -->
      <el-tab-pane label="时间戳" name="timestamp">
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
            <div v-if="tsResult" class="timestamp-result">
              {{ tsResult }}
            </div>

            <el-divider />

            <div class="timestamp-row">
              <span class="label">时间转时间戳：</span>
              <el-date-picker
                v-model="dateInput"
                type="datetime"
                placeholder="选择时间"
              />
              <el-button @click="dateToTs">转换</el-button>
            </div>
            <div v-if="dateResult" class="timestamp-result">
              {{ dateResult }}
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- Regex Tester -->
      <el-tab-pane label="正则测试" name="regex">
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
                <el-input
                  v-model="regexInput"
                  type="textarea"
                  :rows="6"
                  placeholder="输入测试文本..."
                />
              </el-form-item>

              <el-form-item label="匹配结果">
                <div class="regex-result">
                  <div v-if="regexMatches.length > 0">
                    <div
                      v-for="(match, index) in regexMatches"
                      :key="index"
                      class="match-item"
                    >
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
      </el-tab-pane>

      <!-- Color Picker -->
      <el-tab-pane label="颜色转换" name="color">
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
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const activeTool = ref('json')

// JSON
const jsonInput = ref('')
const jsonOutput = ref('')

function formatJson() {
  try {
    const obj = JSON.parse(jsonInput.value)
    jsonOutput.value = JSON.stringify(obj, null, 2)
    ElMessage.success('格式化成功')
  } catch (e: any) {
    ElMessage.error('无效的 JSON: ' + e.message)
  }
}

function compressJson() {
  try {
    const obj = JSON.parse(jsonInput.value)
    jsonOutput.value = JSON.stringify(obj)
    ElMessage.success('压缩成功')
  } catch (e: any) {
    ElMessage.error('无效的 JSON: ' + e.message)
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

// Base64
const base64Input = ref('')
const base64Output = ref('')

function encodeBase64() {
  base64Output.value = btoa(unescape(encodeURIComponent(base64Input.value)))
}

function decodeBase64() {
  try {
    base64Output.value = decodeURIComponent(escape(atob(base64Input.value)))
  } catch (e) {
    ElMessage.error('无效的 Base64')
  }
}

async function copyBase64() {
  if (!base64Output.value) return
  await navigator.clipboard.writeText(base64Output.value)
  ElMessage.success('已复制')
}

// URL
const urlInput = ref('')
const urlOutput = ref('')

function encodeUrl() {
  urlOutput.value = encodeURIComponent(urlInput.value)
}

function decodeUrl() {
  try {
    urlOutput.value = decodeURIComponent(urlInput.value)
  } catch (e) {
    ElMessage.error('无效的 URL 编码')
  }
}

async function copyUrl() {
  if (!urlOutput.value) return
  await navigator.clipboard.writeText(urlOutput.value)
  ElMessage.success('已复制')
}

// Timestamp
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
  } catch (e) {
    ElMessage.error('无效的时间戳')
  }
}

function dateToTs() {
  if (!dateInput.value) return
  const ts = dayjs(dateInput.value).valueOf()
  dateResult.value = ts.toString()
}

// Regex
const regexPattern = ref('')
const regexInput = ref('')
const regexFlagList = ref<string[]>(['g'])

const regexFlags = computed(() => regexFlagList.value.join(''))

const regexMatches = computed(() => {
  if (!regexPattern.value || !regexInput.value) return []
  try {
    const regex = new RegExp(regexPattern.value, regexFlags.value)
    return regexInput.value.match(regex) || []
  } catch (e) {
    return []
  }
})

// Color
const colorValue = ref('#409eff')
const colorHex = ref('#409eff')
const colorRgb = ref('')
const colorHsl = ref('')

function onColorChange(val: string) {
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

onMounted(() => {
  refreshTimestamp()
})
</script>

<style scoped lang="scss">
.tools-page {
  .tool-container {
    padding: 16px;
  }

  .tool-header {
    margin-bottom: 16px;
  }

  .tool-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
}

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

.color-value {
  margin-left: 12px;
  font-family: monospace;
}
</style>
