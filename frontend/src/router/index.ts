import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login/index.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      component: MainLayout,
      meta: { requiresAuth: true },
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

// Navigation guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  if (to.meta.requiresAuth !== false && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/')
  } else {
    next()
  }
})

export default router
