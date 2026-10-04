<template>
  <div class="settings-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- Profile Settings -->
      <el-tab-pane label="个人资料" name="profile">
        <div class="setting-section">
          <h3>个人信息</h3>
          <el-form :model="profileForm" label-width="100px" class="setting-form">
            <el-form-item label="头像">
              <el-avatar :size="64" :src="profileForm.avatar">
                {{ profileForm.username?.charAt(0).toUpperCase() }}
              </el-avatar>
            </el-form-item>
            <el-form-item label="用户名">
              <el-input v-model="profileForm.username" placeholder="怎么称呼你" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="profileForm.email" placeholder="可留空" />
            </el-form-item>
            <el-form-item label="头像地址">
              <el-input v-model="profileForm.avatar" placeholder="https://... 或 data:..." clearable />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="profileSaving" @click="saveProfile">保存</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <!-- Appearance -->
      <el-tab-pane label="外观" name="appearance">
        <div class="setting-section">
          <h3>外观设置</h3>
          <el-form label-width="100px" class="setting-form">
            <el-form-item label="主题">
              <el-switch
                v-model="isDark"
                active-text="暗色"
                inactive-text="亮色"
              />
            </el-form-item>
            <el-form-item label="主色调">
              <div class="color-row">
                <span
                  v-for="color in PRESET_COLORS"
                  :key="color"
                  class="color-swatch"
                  :class="{ active: settingsStore.primaryColor === color }"
                  :style="{ backgroundColor: color }"
                  @click="setPrimaryColor(color)"
                />
                <el-color-picker
                  :model-value="settingsStore.primaryColor"
                  @change="onCustomColor"
                />
              </div>
            </el-form-item>
            <el-form-item label="字体大小">
              <el-select v-model="fontSizeModel" style="width: 120px">
                <el-option v-for="size in FONT_SIZES" :key="size" :label="size" :value="size" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="appearanceSaving" @click="saveAppearance">
                保存外观设置
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <!-- Data: export / import. 数据只在本机，这是唯一的备份手段。 -->
      <el-tab-pane label="数据" name="data">
        <div class="setting-section">
          <h3>备份与还原</h3>
          <p class="data-hint">
            数据保存在本机，不上传任何服务器。换设备、清缓存之前请先导出一份。
          </p>
          <div class="data-actions">
            <el-button type="primary" :loading="exporting" @click="doExport">导出数据</el-button>
            <el-button :loading="importing" @click="pickImportFile">导入数据</el-button>
            <!-- 原生 <input type="file">：WebView 和浏览器都认，不用插件 -->
            <input
              ref="importInput"
              type="file"
              accept="application/json,.json"
              class="import-input"
              @change="onImportFile"
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- About -->
      <el-tab-pane label="关于" name="about">
        <div class="setting-section">
          <h3>关于系统</h3>
          <div class="about-info">
            <p><strong>系统名称：</strong>个人工作台</p>
            <p><strong>版本：</strong>1.1.0</p>
            <p><strong>技术栈：</strong>Vue 3 + Element Plus + Dexie（本地离线）</p>
            <p><strong>描述：</strong>一个全离线的个人工作管理平台</p>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useSettingsStore } from '@/stores/settings'
import {
  exportAll,
  importAll,
  readBackupFile,
  saveBackup,
  assertBackupFile
} from '@/db/exportImport'

const PRESET_COLORS = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#9a60b4', '#909399']
const FONT_SIZES = ['12px', '14px', '16px', '18px']

const userStore = useUserStore()
const settingsStore = useSettingsStore()

const activeTab = ref('profile')
const profileSaving = ref(false)
const appearanceSaving = ref(false)
const exporting = ref(false)
const importing = ref(false)
const importInput = ref<HTMLInputElement>()

const profileForm = reactive({
  username: '',
  email: '',
  avatar: ''
})

/** Live preview via settings store (patch -> applyAppearance). */
const isDark = computed({
  get: () => settingsStore.theme === 'dark',
  set: (val: boolean) => {
    settingsStore.patch({ theme: val ? 'dark' : 'light' })
  }
})

const fontSizeModel = computed({
  get: () => settingsStore.fontSize,
  set: (val: string) => {
    settingsStore.patch({ fontSize: val })
  }
})

function setPrimaryColor(color: string) {
  settingsStore.patch({ primaryColor: color })
}

function onCustomColor(color: string | null) {
  if (color) {
    settingsStore.patch({ primaryColor: color })
  }
}

async function saveAppearance() {
  appearanceSaving.value = true
  try {
    settingsStore.applyAppearance()
    await settingsStore.persist()
    ElMessage.success('外观设置已保存')
  } finally {
    appearanceSaving.value = false
  }
}

function loadProfile() {
  const u = userStore.user
  if (u) {
    profileForm.username = u.username
    profileForm.email = u.email
    profileForm.avatar = u.avatar || ''
  }
}

async function saveProfile() {
  profileSaving.value = true
  try {
    await userStore.updateProfile({
      username: profileForm.username || '我',
      email: profileForm.email,
      avatar: profileForm.avatar || ''
    })
    loadProfile()
    ElMessage.success('个人资料已保存')
  } finally {
    profileSaving.value = false
  }
}

async function doExport() {
  exporting.value = true
  try {
    const file = await exportAll()
    const where = await saveBackup(file)
    ElMessage.success(`已导出到 ${where}`)
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '导出失败')
  } finally {
    exporting.value = false
  }
}

function pickImportFile() {
  importInput.value?.click()
}

async function onImportFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // 允许连续选同一个文件
  if (!file) return

  let parsed
  try {
    parsed = await readBackupFile(file)
    assertBackupFile(parsed)
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '备份文件解析失败')
    return
  }

  try {
    await ElMessageBox.confirm(
      `将覆盖本机全部数据（${parsed.data.tasks?.length ?? 0} 个任务、${parsed.data.notes?.length ?? 0} 篇笔记等）。此操作不可撤销。`,
      '确认导入',
      { type: 'warning', confirmButtonText: '覆盖并导入', cancelButtonText: '取消' }
    )
  } catch {
    return
  }

  importing.value = true
  try {
    await importAll(parsed)
    ElMessage.success('导入成功，正在刷新…')
    // 让所有 store 重新从库读一遍，比逐个 refresh 可靠。
    setTimeout(() => window.location.reload(), 600)
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '导入失败')
  } finally {
    importing.value = false
  }
}

onMounted(async () => {
  if (!userStore.user) {
    await userStore.load()
  }
  loadProfile()
  if (!settingsStore.loaded) {
    await settingsStore.load()
  }
})
</script>

<style scoped lang="scss">
.settings-page {
  padding: 0;
}

.setting-section {
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 20px 0;
    padding-bottom: 10px;
    border-bottom: 1px solid #ebeef5;
  }
}

.setting-form {
  max-width: 500px;
}

.color-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.color-swatch {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  box-sizing: border-box;

  &.active {
    border-color: #303133;
  }

  &:hover {
    transform: scale(1.1);
  }
}

.data-hint {
  font-size: 13px;
  color: #909399;
  margin: 0 0 16px 0;
  line-height: 1.6;
}

.data-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

// 原生 file input 隐藏掉，由按钮触发 —— 但不能用 display:none，
// 某些 WebView 里那样 click() 不生效，用绝对定位移出视口。
.import-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  overflow: hidden;
}

.about-info {
  p {
    font-size: 14px;
    color: #606266;
    margin: 10px 0;
    line-height: 1.6;
  }
}

:deep(.el-tabs__content) {
  padding: 20px;
}
</style>
