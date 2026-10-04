import { Capacitor } from '@capacitor/core'
import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'

/**
 * 路由历史：浏览器走 history（URL 干净，nginx 有 SPA 回落）；原生 APK 走 hash。
 *
 * Capacitor 的本地服务器只认得到 `assets/public` 里真实存在的文件，`/settings`
 * 这种路径刷新会 404 —— 设置页导入完还要 `location.reload()`，会踩到。hash 模式
 * 下路径永远是 `/`，刷新安全；浏览器端行为一个像素都不变。
 */
const history = Capacitor.isNativePlatform() ? createWebHashHistory() : createWebHistory()

const router = createRouter({
  history,
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '',
          name: 'Dashboard',
          component: () => import('@/views/Dashboard/index.vue'),
          meta: { title: '工作台' }
        },
        {
          path: 'tasks',
          name: 'Tasks',
          component: () => import('@/views/Tasks/index.vue'),
          meta: { title: '任务管理' }
        },
        {
          path: 'calendar',
          name: 'Calendar',
          component: () => import('@/views/Calendar/index.vue'),
          meta: { title: '日程管理' }
        },
        {
          path: 'notes',
          name: 'Notes',
          component: () => import('@/views/Notes/index.vue'),
          meta: { title: '笔记管理' }
        },
        {
          path: 'bookmarks',
          name: 'Bookmarks',
          component: () => import('@/views/Bookmarks/index.vue'),
          meta: { title: '书签管理' }
        },
        {
          path: 'scripts',
          name: 'Scripts',
          component: () => import('@/views/Scripts/index.vue'),
          meta: { title: '脚本管理' }
        },
        {
          path: 'projects',
          name: 'Projects',
          component: () => import('@/views/Projects/index.vue'),
          meta: { title: '项目管理' }
        },
        {
          path: 'tools',
          name: 'Tools',
          component: () => import('@/views/Tools/index.vue'),
          meta: { title: '工具箱' }
        },
        {
          path: 'settings',
          name: 'Settings',
          component: () => import('@/views/Settings/index.vue'),
          meta: { title: '设置' }
        }
      ]
    }
  ]
})

// 没有服务端，也就没有登录 —— 不设导航守卫，装完直接进工作台。
export default router
