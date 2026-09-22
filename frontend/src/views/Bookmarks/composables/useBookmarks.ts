import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useResourceList, useConfirmDelete, useDialogForm } from '@/composables'
import type { Bookmark, BookmarkPayload } from '@/types/models'

export function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  } catch {
    return ''
  }
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

export interface BookmarkFormState {
  url: string
  title: string
  description: string
  category: string
  tags: string[]
}

export function useBookmarks() {
  const {
    items: bookmarks,
    loading,
    fetchList,
    create,
    update,
    remove,
    refresh
  } = useResourceList<Bookmark>({ path: '/bookmarks', pageSize: 200 })

  const { confirmDelete } = useConfirmDelete()
  const bookmarkDialog = useDialogForm<Bookmark>()

  const searchQuery = ref('')

  const categories = computed(() => {
    const cats = new Set(bookmarks.value.map(b => b.category).filter(Boolean))
    return Array.from(cats)
  })

  const sortedCategories = computed(() => {
    const categoryMap = new Map<string, Bookmark[]>()

    let filtered = [...bookmarks.value]
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(
        b =>
          b.title.toLowerCase().includes(query) ||
          b.url.toLowerCase().includes(query) ||
          b.description?.toLowerCase().includes(query)
      )
    }

    filtered.forEach(b => {
      const cat = b.category || ''
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, [])
      }
      categoryMap.get(cat)!.push(b)
    })

    const result = Array.from(categoryMap.entries()).map(([name, items]) => ({
      name,
      bookmarks: items
    }))

    result.sort((a, b) => {
      if (!a.name) return 1
      if (!b.name) return -1
      return a.name.localeCompare(b.name)
    })

    return result
  })

  async function submitBookmark(form: BookmarkFormState) {
    bookmarkDialog.submitting = true
    try {
      const payload: BookmarkPayload = { ...form }
      if (bookmarkDialog.editing) {
        await update(bookmarkDialog.editing.id, payload)
        ElMessage.success('书签已更新')
      } else {
        await create(payload)
        ElMessage.success('书签已添加')
      }
      bookmarkDialog.close()
    } finally {
      bookmarkDialog.submitting = false
    }
  }

  async function deleteBookmark(bookmark: Bookmark) {
    if (!(await confirmDelete('确定要删除这个书签吗？'))) return
    await remove(bookmark.id)
    ElMessage.success('书签已删除')
  }

  function handleAction(cmd: string, bookmark: Bookmark) {
    if (cmd === 'edit') bookmarkDialog.openEdit(bookmark)
    if (cmd === 'delete') void deleteBookmark(bookmark)
    if (cmd === 'open') openBookmark(bookmark)
  }

  function openBookmark(bookmark: Bookmark) {
    window.open(bookmark.url, '_blank')
  }

  return {
    bookmarks,
    loading,
    searchQuery,
    categories,
    sortedCategories,
    bookmarkDialog,
    fetchBookmarks: fetchList,
    refresh,
    submitBookmark,
    deleteBookmark,
    handleAction,
    openBookmark
  }
}
