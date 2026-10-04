import { reactive, ref, type Ref } from 'vue'
import {
  repoList,
  repoGet,
  repoCreate,
  repoUpdate,
  repoRemove,
  type TableName
} from '@/db/repo'

/**
 * 共享的分页 CRUD 列表状态 —— 六个业务域都走这里。
 *
 * 底层从 HTTP（axios + FastAPI）换成了本地 Dexie（`src/db/repo.ts`），
 * 但**公开 API 一字未变**：`fetchList` / `fetchOne` / `create` / `update` /
 * `remove` / `refresh` / `setPage` / `setPageSize`，`pagination` 照旧绑
 * `el-pagination`。业务 composable 只把 `path: '/tasks'` 换成 `table: 'tasks'`。
 */

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

export interface UseResourceListOptions {
  /** 本地表名，如 'tasks' */
  table: TableName
  /** 额外过滤参数，合并进每次列表请求（日历的 start_date/end_date 走这个）。 */
  getParams?: () => Record<string, string | number | boolean | null | undefined>
  pageSize?: number
}

type Id = number

export function useResourceList<T extends { id: Id }>(options: UseResourceListOptions) {
  const items = ref<T[]>([]) as Ref<T[]>
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = reactive<PaginationState>({
    page: 1,
    pageSize: options.pageSize ?? 50,
    total: 0
  })

  async function fetchList(): Promise<T[]> {
    loading.value = true
    error.value = null
    try {
      const res = await repoList<T>(options.table, {
        skip: (pagination.page - 1) * pagination.pageSize,
        limit: pagination.pageSize,
        ...(options.getParams?.() ?? {})
      })
      items.value = res.items
      pagination.total = res.total
      return res.items
    } catch (e) {
      error.value = '加载失败'
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: Id): Promise<T | null> {
    try {
      return await repoGet<T>(options.table, id)
    } catch {
      return null
    }
  }

  async function create(
    payload: Partial<T> | Record<string, unknown>,
    opts: { refresh?: boolean } = {}
  ): Promise<T | null> {
    try {
      const row = await repoCreate<T>(options.table, payload as Partial<T>)
      if (opts.refresh !== false) await fetchList()
      return row
    } catch {
      return null
    }
  }

  async function update(
    id: Id,
    payload: Partial<T> | Record<string, unknown>,
    opts: { refresh?: boolean } = {}
  ): Promise<T | null> {
    try {
      const row = await repoUpdate<T>(options.table, id, payload as Partial<T>)
      if (opts.refresh !== false) await fetchList()
      return row
    } catch {
      return null
    }
  }

  async function remove(id: Id, opts: { refresh?: boolean } = {}): Promise<boolean> {
    try {
      const ok = await repoRemove(options.table, id)
      if (opts.refresh !== false) await fetchList()
      return ok
    } catch {
      return false
    }
  }

  function refresh(): Promise<T[]> {
    return fetchList()
  }

  function setPage(page: number): void {
    pagination.page = page
    void fetchList()
  }

  function setPageSize(pageSize: number): void {
    pagination.pageSize = pageSize
    pagination.page = 1
    void fetchList()
  }

  return {
    items,
    loading,
    error,
    pagination,
    fetchList,
    fetchOne,
    create,
    update,
    remove,
    refresh,
    setPage,
    setPageSize
  }
}
