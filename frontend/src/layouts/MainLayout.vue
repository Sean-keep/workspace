<template>
  <el-container class="main-layout">
    <!-- Sidebar -->
    <el-aside :width="isCollapse ? '50px' : '180px'" class="sidebar">
      <div class="logo" @click="router.push('/')">
        <el-icon :size="20"><Monitor /></el-icon>
        <span v-show="!isCollapse" class="logo-text">工作台</span>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        router
        class="sidebar-menu"
      >
        <el-menu-item index="/">
          <el-icon><HomeFilled /></el-icon>
          <template #title>工作台</template>
        </el-menu-item>

        <el-menu-item index="/tasks">
          <el-icon><List /></el-icon>
          <template #title>任务管理</template>
        </el-menu-item>

        <el-menu-item index="/calendar">
          <el-icon><Calendar /></el-icon>
          <template #title>日程管理</template>
        </el-menu-item>

        <el-menu-item index="/notes">
          <el-icon><Notebook /></el-icon>
          <template #title>笔记管理</template>
        </el-menu-item>

        <el-menu-item index="/bookmarks">
          <el-icon><Link /></el-icon>
          <template #title>书签管理</template>
        </el-menu-item>

        <el-menu-item index="/scripts">
          <el-icon><Document /></el-icon>
          <template #title>脚本管理</template>
        </el-menu-item>

        <el-menu-item index="/projects">
          <el-icon><Folder /></el-icon>
          <template #title>项目管理</template>
        </el-menu-item>

        <el-menu-item index="/tools">
          <el-icon><Tools /></el-icon>
          <template #title>工具箱</template>
        </el-menu-item>

        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <template #title>设置</template>
        </el-menu-item>
      </el-menu>

      <div class="collapse-btn" @click="isCollapse = !isCollapse">
        <el-icon :size="14">
          <component :is="isCollapse ? 'Expand' : 'Fold'" />
        </el-icon>
      </div>
    </el-aside>

    <!-- Main Content -->
    <el-container>
      <!-- Header -->
      <el-header class="header">
        <div class="header-left">
          <h2 class="page-title">{{ currentTitle }}</h2>
        </div>

        <div class="header-right">
          <!-- Search -->
          <el-input
            v-model="searchQuery"
            placeholder="搜索..."
            prefix-icon="Search"
            class="search-input"
            clearable
            size="small"
          />

          <!-- Notifications -->
          <el-popover
            placement="bottom"
            :width="300"
            trigger="click"
          >
            <template #reference>
              <el-badge :value="notifications.length" :max="99" class="notification-badge">
                <el-button :icon="Bell" circle size="small" />
              </el-badge>
            </template>

            <div class="notification-panel">
              <div class="notification-header">
                <span>消息通知</span>
                <el-button type="primary" link @click="clearNotifications">全部已读</el-button>
              </div>
              <el-scrollbar max-height="250px">
                <div v-if="notifications.length > 0">
                  <div
                    v-for="(item, index) in notifications"
                    :key="index"
                    class="notification-item"
                  >
                    <el-icon :size="14" :color="item.color || '#409eff'">
                      <component :is="item.icon || 'InfoFilled'" />
                    </el-icon>
                    <div class="notification-content">
                      <div class="notification-title">{{ item.title }}</div>
                      <div class="notification-time">{{ item.time }}</div>
                    </div>
                  </div>
                </div>
                <el-empty v-else description="暂无消息" :image-size="50" />
              </el-scrollbar>
            </div>
          </el-popover>

          <!-- User Menu -->
          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="28" :src="userStore.user?.avatar">
                {{ userStore.user?.username?.charAt(0).toUpperCase() }}
              </el-avatar>
              <span class="username">{{ userStore.user?.username }}</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                <el-dropdown-item command="settings">设置</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- Content -->
      <el-main class="content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { Bell } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isCollapse = ref(false)
const searchQuery = ref('')

const activeMenu = computed(() => route.path)
const currentTitle = computed(() => (route.meta.title as string) || '工作台')

// 通知数据
const notifications = ref([
  {
    title: '欢迎使用个人工作台',
    time: '刚刚',
    icon: 'SuccessFilled',
    color: '#67c23a'
  },
  {
    title: '您有 1 个待办任务',
    time: '5分钟前',
    icon: 'InfoFilled',
    color: '#409eff'
  },
  {
    title: '系统已更新到最新版本',
    time: '1小时前',
    icon: 'WarningFilled',
    color: '#e6a23c'
  }
])

function clearNotifications() {
  notifications.value = []
}

// Apply appearance settings on mount
function applyAppearanceSettings() {
  // Apply theme
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }

  // Apply primary color
  const savedColor = localStorage.getItem('primaryColor')
  if (savedColor) {
    document.documentElement.style.setProperty('--el-color-primary', savedColor)
    document.documentElement.style.setProperty('--primary-color', savedColor)
  }

  // Apply font size
  const savedFontSize = localStorage.getItem('fontSize')
  if (savedFontSize) {
    document.documentElement.style.setProperty('--font-size', savedFontSize)
    document.documentElement.style.fontSize = savedFontSize
  }
}

onMounted(async () => {
  applyAppearanceSettings()
  try {
    await userStore.fetchUser()
  } catch (error) {
    // User not logged in
  }
})

// Watch for settings changes
watch(() => localStorage.getItem('theme'), () => applyAppearanceSettings())
watch(() => localStorage.getItem('primaryColor'), () => applyAppearanceSettings())
watch(() => localStorage.getItem('fontSize'), () => applyAppearanceSettings())

function handleCommand(command: string) {
  switch (command) {
    case 'profile':
      router.push('/settings')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      userStore.logout()
      router.push('/login')
      break
  }
}
</script>

<style scoped lang="scss">
.main-layout {
  height: 100vh;
}

.sidebar {
  background-color: #1d1e1f;
  transition: width 0.3s;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.logo {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  cursor: pointer;
  border-bottom: 1px solid #333;
}

.logo-text {
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
}

.sidebar-menu {
  flex: 1;
  border-right: none;
  background-color: transparent;

  :deep(.el-menu-item) {
    color: #bfcbd9;
    height: 44px;
    line-height: 44px;
    font-size: 13px;

    &:hover, &.is-active {
      background-color: #263445;
      color: #409eff;
    }
  }
}

.collapse-btn {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #bfcbd9;
  cursor: pointer;
  border-top: 1px solid #333;

  &:hover {
    background-color: #263445;
  }
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 48px;
}

.page-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  width: 200px;
}

.notification-badge {
  cursor: pointer;
}

.notification-panel {
  .notification-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 10px;
    border-bottom: 1px solid #ebeef5;
    margin-bottom: 10px;

    span {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }
  }

  .notification-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px solid #f5f7fa;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background-color: #f5f7fa;
    }
  }

  .notification-content {
    flex: 1;

    .notification-title {
      font-size: 13px;
      color: #303133;
      margin-bottom: 2px;
    }

    .notification-time {
      font-size: 11px;
      color: #909399;
    }
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.username {
  font-size: 13px;
  color: #303133;
}

.content {
  background-color: #f5f7fa;
  padding: 16px;
  overflow-y: auto;
}
</style>
