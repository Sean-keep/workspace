import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

/** Endpoints that must never carry an Authorization header (and never trigger refresh). */
const NO_AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh']

export function setTokens(tokens: { access_token: string; refresh_token: string }) {
  localStorage.setItem('token', tokens.access_token)
  localStorage.setItem('refresh_token', tokens.refresh_token)
}

export function clearTokens() {
  localStorage.removeItem('token')
  localStorage.removeItem('refresh_token')
}

function isAuthPath(url?: string) {
  if (!url) return false
  return NO_AUTH_PATHS.some((path) => url.includes(path))
}

/** Server errors are `{ code, msg, data }`; fall back to FastAPI `detail`. */
function extractMsg(data: any): string {
  if (!data) return ''
  if (typeof data.msg === 'string' && data.msg) return data.msg
  if (typeof data.detail === 'string' && data.detail) return data.detail
  return ''
}

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    if (!isAuthPath(config.url)) {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/** Single-flight refresh: parallel 401s share one refresh call. */
let refreshPromise: Promise<string> | null = null

function refreshTokens(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        throw new Error('Missing refresh token')
      }
      // Raw axios — bypass interceptors so a failed refresh cannot recurse.
      const res = await axios.post(
        '/api/auth/refresh',
        { refresh_token: refreshToken },
        { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
      )
      const body = res.data as { code?: number; msg?: string; data?: { access_token: string; refresh_token: string } }
      if (!body || body.code !== 200 || !body.data?.access_token) {
        throw new Error(body?.msg || 'Token refresh failed')
      }
      setTokens({
        access_token: body.data.access_token,
        refresh_token: body.data.refresh_token
      })
      return body.data.access_token
    })().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

function handleAuthExpired() {
  clearTokens()
  router.push('/login')
  ElMessage.error('登录已过期，请重新登录')
}

// Response interceptor
api.interceptors.response.use(
  (response) => {
    const { data } = response
    if (data && data.code === 200) {
      return data
    }
    ElMessage.error(data?.msg || '请求失败')
    return Promise.reject(new Error(data?.msg || '请求失败'))
  },
  async (error: AxiosError) => {
    const config = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    const status = error.response?.status
    const url = config?.url || ''

    // Silent refresh on 401 — skip auth endpoints and the refresh call itself.
    if (status === 401 && config && !config._retry && !isAuthPath(url)) {
      config._retry = true
      try {
        const accessToken = await refreshTokens()
        config.headers.Authorization = `Bearer ${accessToken}`
        return api(config)
      } catch {
        handleAuthExpired()
        return Promise.reject(error)
      }
    }

    if (error.response) {
      const msg = extractMsg(error.response.data)
      switch (status) {
        case 401:
          if (isAuthPath(url)) {
            // Login / register / refresh failures: surface the server message only.
            ElMessage.error(msg || '请求失败')
          } else {
            handleAuthExpired()
          }
          break
        case 403:
          ElMessage.error(msg || '没有权限访问')
          break
        case 404:
          ElMessage.error(msg || '请求的资源不存在')
          break
        case 422:
          ElMessage.error(msg || '请求参数错误')
          break
        default:
          ElMessage.error(msg || '服务器错误')
      }
    } else {
      ElMessage.error('网络连接失败')
    }
    return Promise.reject(error)
  }
)

export default api
