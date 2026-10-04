import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/db'
import { toPlain } from '@/db/plain'

/**
 * 本地个人资料 —— 没有服务端，也就没有登录。
 *
 * 数据住在 IndexedDB 的 `meta.profile`。首启播种一份默认值，之后
 * Settings 页可以改。文件名和 `user` ref 保留，MainLayout / Settings 的
 * 模板一行都不用动。
 */

export interface User {
  username: string
  email: string
  avatar: string
}

export interface ProfileUpdate {
  username?: string
  email?: string
  avatar?: string
}

const DEFAULT_PROFILE: User = {
  username: '我',
  email: '',
  avatar: ''
}

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)

  async function load() {
    try {
      const row = await db.meta.get('profile')
      if (row?.value) {
        user.value = { ...DEFAULT_PROFILE, ...(row.value as Partial<User>) }
        return user.value
      }
    } catch {
      /* 落到播种 */
    }
    // 首启：没有 profile 就写一份默认的，以后 Export 才带得走。
    user.value = { ...DEFAULT_PROFILE }
    await db.meta.put({ key: 'profile', value: toPlain(user.value) })
    return user.value
  }

  async function updateProfile(payload: ProfileUpdate) {
    const next: User = {
      ...(user.value ?? DEFAULT_PROFILE),
      ...payload
    }
    user.value = next
    // toPlain：ref 取出来是 Proxy，Dexie 的 structured clone 存不了（见 db/plain.ts）
    await db.meta.put({ key: 'profile', value: toPlain(next) })
    return next
  }

  return {
    user,
    load,
    updateProfile
  }
})
