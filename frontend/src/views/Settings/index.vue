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
            <el-form-item>
              <el-button type="primary" @click="saveProfile">保存</el-button>
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
              <el-button type="primary" @click="changePassword">修改密码</el-button>
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
            <p><strong>版本：</strong>1.0.0</p>
            <p><strong>技术栈：</strong>Vue 3 + Element Plus + FastAPI</p>
            <p><strong>描述：</strong>一个高效的个人工作管理平台</p>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'

const activeTab = ref('profile')
const passwordFormRef = ref<FormInstance>()

const profileForm = reactive({
  username: 'admin',
  email: '',
  avatar: ''
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: Function) => {
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

function saveProfile() {
  ElMessage.success('个人资料已保存')
}

async function changePassword() {
  const valid = await passwordFormRef.value?.validate().catch(() => false)
  if (!valid) return
  ElMessage.success('密码已修改')
}
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
