import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api, { setTokens, clearTokens } from '@/utils/api'
import { useSettingsStore } from '@/stores/settings'
import type { AuthPayload } from '@/utils/api-types'

export type User = AuthPayload['user']

export interface ProfileUpdate {
  username?: string
  email?: string
  avatar?: string
  settings?: Record<string, unknown>
}

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const token = ref<string>(localStorage.getItem('token') || '')

  const isLoggedIn = computed(() => !!token.value)

  function applyAuth(data: AuthPayload) {
    user.value = data.user
    token.value = data.access_token
    setTokens({ access_token: data.access_token, refresh_token: data.refresh_token })
    // Appearance / preferences follow the user on login & register.
    void useSettingsStore().load()
  }

  async function login(username: string, password: string) {
    const res: any = await api.post('/auth/login', { username, password })
    applyAuth(res.data as AuthPayload)
    return res.data as AuthPayload
  }

  async function register(username: string, email: string, password: string) {
    const res: any = await api.post('/auth/register', { username, email, password })
    applyAuth(res.data as AuthPayload)
    return res.data as AuthPayload
  }

  async function fetchUser() {
    try {
      const res: any = await api.get('/auth/me')
      user.value = res.data as User
      return res.data as User
    } catch (error) {
      logout()
      throw error
    }
  }

  async function updateProfile(payload: ProfileUpdate) {
    const res: any = await api.put('/auth/me', payload)
    user.value = res.data as User
    return res.data as User
  }

  async function changePassword(oldPassword: string, newPassword: string) {
    await api.put('/auth/password', {
      old_password: oldPassword,
      new_password: newPassword
    })
  }

  function logout() {
    user.value = null
    token.value = ''
    clearTokens()
  }

  return {
    user,
    token,
    isLoggedIn,
    login,
    register,
    fetchUser,
    updateProfile,
    changePassword,
    logout
  }
})
