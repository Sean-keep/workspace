<template>
  <!--
    手机壳（≤767px）。桌面上这棵子树根本不 mount —— 这是「桌面布局不变」
    唯一可靠的保证，别改成 v-show（两个 router-view 会各打一遍接口）。
    断点见 stores/ui.ts 的 MOBILE_MEDIA。
  -->
  <div v-if="ui.isMobile" class="mobile-layout">
    <header class="mobile-header">
      <h1 class="mobile-title">{{ currentTitle }}</h1>
      <div class="mobile-actions">
        <NotificationPanel
          :notifications="notifications"
          @clear="clearNotifications"
          @open="openNotification"
        />
        <el-dropdown @command="handleCommand">
          <div class="mobile-user">
            <el-avatar :size="28" :src="userStore.user?.avatar || undefined">
              {{ userStore.user?.username?.charAt(0).toUpperCase() }}
            </el-avatar>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人资料</el-dropdown-item>
              <el-dropdown-item command="settings">设置</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <main class="mobile-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- 底部 Tab 用 router-link，不用 el-menu —— 那是桌面菜平原语义，会拖进一堆桌面菜单样式 -->
    <nav class="mobile-tabbar">
      <router-link
        v-for="item in tabItems"
        :key="item.path"
        :to="item.path"
        class="tab-item"
        :class="{ active: route.path === item.path }"
      >
        <el-icon :size="20"><component :is="item.icon" /></el-icon>
        <span class="tab-label">{{ item.shortTitle ?? item.title }}</span>
      </router-link>
      <button
        type="button"
        class="tab-item"
        :class="{ active: moreActive }"
        @click="ui.moreDrawerVisible = true"
      >
        <el-icon :size="20"><MoreFilled /></el-icon>
        <span class="tab-label">更多</span>
      </button>
    </nav>

    <el-drawer
      v-model="ui.moreDrawerVisible"
      direction="btt"
      size="auto"
      :with-header="false"
      class="more-drawer"
    >
      <div class="more-list">
        <button
          v-for="item in moreItems"
          :key="item.path"
          type="button"
          class="more-item"
          :class="{ active: route.path === item.path }"
          @click="goMore(item.path)"
        >
          <el-icon :size="18"><component :is="item.icon" /></el-icon>
          <span>{{ item.title }}</span>
        </button>
      </div>
    </el-drawer>
  </div>

  <!-- 桌面壳。除 v-else、菜单改成 menuItems 循环、通知面板抽成组件外，与改造前一致 -->
  <el-container v-else class="main-layout">
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
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>{{ item.title }}</template>
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
          <!--
            死代码：searchQuery 只绑定从不消费，路由里也没有搜索入口。
            桌面留着是为了不动现状；手机壳刻意不搬 —— 别当「漏了」补回来。
          -->
          <el-input
            v-model="searchQuery"
            placeholder="搜索..."
            prefix-icon="Search"
            class="search-input"
            clearable
            size="small"
          />

          <!-- Notifications -->
          <NotificationPanel
            :notifications="notifications"
            @clear="clearNotifications"
            @open="openNotification"
          />

          <!-- User Menu -->
          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="28" :src="userStore.user?.avatar || undefined">
                {{ userStore.user?.username?.charAt(0).toUpperCase() }}
              </el-avatar>
              <span class="username">{{ userStore.user?.username }}</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                <el-dropdown-item command="settings">设置</el-dropdown-item>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { startReminderScheduler, stopReminderScheduler } from '@/stores/reminderScheduler'
import { menuItems, tabItems, moreItems } from '@/layouts/menuItems'
import NotificationPanel from '@/layouts/NotificationPanel.vue'
import { getNotifications } from '@/db/logic/dashboard'
import type { NotificationItem } from '@/utils/api-types'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const settingsStore = useSettingsStore()
const ui = useUiStore()

const isCollapse = ref(false)
const searchQuery = ref('')

const activeMenu = computed(() => route.path)
const currentTitle = computed(() => (route.meta.title as string) || '工作台')
/** 非 Tab 路由时高亮「更多」 */
const moreActive = computed(() => moreItems.some((i) => i.path === route.path))

// 通知数据：逾期任务 + 今日日程，由本地库派生（`db/logic/dashboard.ts`）
const notifications = ref<NotificationItem[]>([])

async function fetchNotifications() {
  try {
    notifications.value = await getNotifications()
  } catch {
    notifications.value = []
  }
}

function clearNotifications() {
  // 只清本回合的展示，下次 fetch 重新从本地库算出来。
  notifications.value = []
}

function openNotification(item: NotificationItem) {
  if (item.link) {
    router.push(item.link)
  }
}

function goMore(path: string) {
  ui.moreDrawerVisible = false
  router.push(path)
}

onMounted(async () => {
  settingsStore.applyAppearance()
  await settingsStore.load()
  await userStore.load()
  fetchNotifications()
  // 日程提醒。必须在这里调（不是 App.vue）：MainLayout 是主壳，
  // 而且 startReminderScheduler 里带音频解锁，要在用户手势前就装上。
  startReminderScheduler()
})

onUnmounted(() => {
  stopReminderScheduler()
})

function handleCommand(command: string) {
  switch (command) {
    case 'profile':
    case 'settings':
      router.push('/settings')
      break
  }
}
</script>

<style scoped lang="scss">
.main-layout {
  height: 100vh;
}

.sidebar {
  // Match the rest of the chrome (light header / light content) instead of a
  // standalone dark rail. Everything keys off Element Plus vars so the whole
  // sidebar follows theme (`.dark` on <html>) automatically.
  --sidebar-bg: var(--el-bg-color);
  --sidebar-fg: var(--el-text-color-regular);
  --sidebar-hover: var(--el-fill-color-light);
  --sidebar-line: var(--el-border-color-lighter);

  --el-menu-bg-color: var(--sidebar-bg);
  --el-menu-text-color: var(--sidebar-fg);
  --el-menu-active-color: var(--el-color-primary);
  --el-menu-hover-bg-color: var(--sidebar-hover);
  --el-menu-item-hover-fill: var(--sidebar-hover);
  --el-menu-border-color: transparent;

  background-color: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-line);
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
  color: var(--el-text-color-primary);
  cursor: pointer;
  border-bottom: 1px solid var(--sidebar-line);
}

.logo-text {
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
}

.sidebar-menu {
  flex: 1;
  border-right: none;
  background-color: var(--sidebar-bg);

  :deep(.el-menu-item) {
    color: var(--sidebar-fg);
    height: 44px;
    line-height: 44px;
    font-size: 13px;
    background-color: var(--sidebar-bg);

    &:hover,
    &.is-active {
      background-color: var(--sidebar-hover);
      color: var(--el-color-primary);
    }
  }
}

.collapse-btn {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--sidebar-fg);
  cursor: pointer;
  border-top: 1px solid var(--sidebar-line);
  background-color: var(--sidebar-bg);

  &:hover {
    background-color: var(--sidebar-hover);
  }
}

.header {
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
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

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.username {
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.content {
  background-color: var(--el-fill-color-lighter);
  padding: 16px;
  overflow-y: auto;
}

// ── 手机壳 ────────────────────────────────────────────────────────
//
// 只在 ≤767px 生效。⚠️ 断点与 stores/ui.ts 的 MOBILE_MEDIA、
// assets/styles/main.scss 的 $bp-mobile 保持同步（768px）。
// 这个壳本身就是手机专属，样式写在这里而不是 @media 里也没关系 ——
// 外面套着 v-if="ui.isMobile"，桌面上根本不 mount。
.mobile-layout {
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background-color: var(--el-fill-color-lighter);
}

.mobile-header {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: calc(var(--mobile-header-height, 48px) + var(--safe-top, 0px));
  padding: var(--safe-top, 0px) 12px 0;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.mobile-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: none;
}

.mobile-user {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px;
}

.mobile-main {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px;
  padding-bottom: calc(var(--mobile-bottom-chrome, 52px) + 12px);
}

.mobile-tabbar {
  flex: none;
  display: flex;
  align-items: stretch;
  background-color: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);
  padding-bottom: var(--safe-bottom, 0px);
}

.tab-item {
  flex: 1 1 0;
  min-width: 0;
  // 5 格 × 72px = 360px，放得下最窄的常见手机；点击区 ≥44px
  min-height: 44px;
  height: var(--mobile-tabbar-height, 52px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;

  .tab-label {
    font-size: 11px;
    line-height: 1;
  }

  &.active {
    color: var(--el-color-primary);
  }
}

.more-list {
  display: flex;
  flex-direction: column;
  padding-bottom: var(--safe-bottom, 0px);
}

.more-item {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 52px;
  padding: 0 8px;
  border: none;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: none;
  cursor: pointer;
  font-size: 15px;
  color: var(--el-text-color-primary);
  text-align: left;
  -webkit-tap-highlight-color: transparent;

  &:last-child {
    border-bottom: none;
  }

  &.active {
    color: var(--el-color-primary);
    background-color: var(--el-fill-color-light);
  }
}
</style>
