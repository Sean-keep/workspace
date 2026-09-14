import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/utils/api'

interface User {
  id: number
  username: string
  email: string
  avatar: string | null
  settings: Record<string, any>
}

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const token = ref<string>(localStorage.getItem('token') || '')

  const isLoggedIn = computed(() => !!token.value)

  async function login(username: string, password: string) {
    try {
      const res: any = await api.post('/auth/login', { username, password })
      user.value = res.data.user
      token.value = res.data.token
      localStorage.setItem('token', res.data.token)
      return res.data
    } catch (error) {
      throw error
    }
  }

  async function register(username: string, email: string, password: string) {
    try {
      const res: any = await api.post('/auth/register', { username, email, password })
      user.value = res.data.user
      token.value = res.data.token
      localStorage.setItem('token', res.data.token)
      return res.data
    } catch (error) {
      throw error
    }
  }

  async function fetchUser() {
    try {
      const res: any = await api.get('/auth/me')
      user.value = res.data
      return res.data
    } catch (error) {
      logout()
      throw error
    }
  }

  function logout() {
    user.value = null
    token.value = ''
    localStorage.removeItem('token')
  }

  return {
    user,
    token,
    isLoggedIn,
    login,
    register,
    fetchUser,
    logout
  }
})
