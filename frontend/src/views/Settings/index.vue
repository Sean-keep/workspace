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
              <el-input v-model="profileForm.username" disabled />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="profileForm.email" placeholder="请输入邮箱" />
            </el-form-item>
            <el-form-item label="头像地址">
              <el-input v-model="profileForm.avatar" placeholder="https://..." clearable />
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

      <!-- Security Settings -->
      <el-tab-pane label="安全设置" name="security">
        <div class="setting-section">
          <h3>修改密码</h3>
          <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px" class="setting-form">
            <el-form-item label="当前密码" prop="oldPassword">
              <el-input v-model="passwordForm.oldPassword" type="password" show-password />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input v-model="passwordForm.newPassword" type="password" show-password />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="passwordSaving" @click="changePassword">修改密码</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <!-- About -->
      <el-tab-pane label="关于" name="about">
        <div class="setting-section">
          <h3>关于系统</h3>
          <div class="about-info">
            <p><strong>系统名称：</strong>个人工作台</p>
            <p><strong>版本：</strong>1.1.0</p>
            <p><strong>技术栈：</strong>Vue 3 + Element Plus + FastAPI</p>
            <p><strong>描述：</strong>一个高效的个人工作管理平台</p>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useSettingsStore } from '@/stores/settings'

const PRESET_COLORS = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#9a60b4', '#909399']
const FONT_SIZES = ['12px', '14px', '16px', '18px']

const userStore = useUserStore()
const settingsStore = useSettingsStore()

const activeTab = ref('profile')
const passwordFormRef = ref<FormInstance>()
const profileSaving = ref(false)
const passwordSaving = ref(false)
const appearanceSaving = ref(false)

const profileForm = reactive({
  username: '',
  email: '',
  avatar: ''
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules: FormRules = {
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_rule: unknown, value: string, callback: (e?: Error) => void) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

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
  } catch {
    // api interceptor already toasts
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
      email: profileForm.email,
      avatar: profileForm.avatar || undefined
    })
    await settingsStore.persist()
    loadProfile()
    ElMessage.success('个人资料已保存')
  } catch {
    // api interceptor already toasts
  } finally {
    profileSaving.value = false
  }
}

async function changePassword() {
  const valid = await passwordFormRef.value?.validate().catch(() => false)
  if (!valid) return
  passwordSaving.value = true
  try {
    await userStore.changePassword(passwordForm.oldPassword, passwordForm.newPassword)
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    passwordFormRef.value?.resetFields()
    ElMessage.success('密码已修改')
  } catch {
    // api interceptor already toasts — don't double-toast
  } finally {
    passwordSaving.value = false
  }
}

onMounted(async () => {
  if (!userStore.user) {
    try {
      await userStore.fetchUser()
    } catch {
      // handled by interceptor
    }
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
