import { reactive, ref, type Ref } from 'vue'
import api from '@/utils/api'
import { pageItems, type Envelope, type Page } from '@/utils/api-types'

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

export interface UseResourceListOptions {
  /** REST base path, e.g. '/tasks' */
  path: string
  /** Extra query params merged into every list request. */
  getParams?: () => Record<string, string | number | boolean | null | undefined>
  pageSize?: number
}

type Id = number

/**
 * Shared paginated CRUD list state.
 *
 * List reads go through `pageItems` (envelope `{code,msg,data:{items,total,skip,limit}}`);
 * `pagination` binds straight to `el-pagination`.
 */
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
      const params = {
        skip: (pagination.page - 1) * pagination.pageSize,
        limit: pagination.pageSize,
        ...(options.getParams?.() ?? {})
      }
      const res = (await api.get(options.path, { params })) as unknown as Envelope<
        Page<T> | T[]
      >
      items.value = pageItems<T>(res)
      const data = res.data
      if (data && !Array.isArray(data)) {
        pagination.total = data.total
        if (data.limit) pagination.pageSize = data.limit
      } else {
        pagination.total = items.value.length
      }
      return items.value
    } catch (e) {
      error.value = '加载失败'
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: Id): Promise<T | null> {
    try {
      const res = (await api.get(`${options.path}/${id}`)) as unknown as Envelope<T>
      return res.data
    } catch {
      return null
    }
  }

  async function create(
    payload: Partial<T> | Record<string, unknown>,
    opts: { refresh?: boolean } = {}
  ): Promise<T | null> {
    try {
      const res = (await api.post(options.path, payload)) as unknown as Envelope<T>
      if (opts.refresh !== false) await fetchList()
      return res.data
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
      const res = (await api.put(`${options.path}/${id}`, payload)) as unknown as Envelope<T>
      if (opts.refresh !== false) await fetchList()
      return res.data
    } catch {
      return null
    }
  }

  async function remove(id: Id, opts: { refresh?: boolean } = {}): Promise<boolean> {
    try {
      await api.delete(`${options.path}/${id}`)
      if (opts.refresh !== false) await fetchList()
      return true
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
