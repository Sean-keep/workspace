import { computed, ref, type Ref } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import MarkdownIt from 'markdown-it'
import { useResourceList, useConfirmDelete } from '@/composables'
import type { ChecklistItem, Note, NoteType } from '@/types/models'

const md = new MarkdownIt()

export function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

export function getCheckedCount(note: { checklist_items?: ChecklistItem[] | null } | null) {
  if (!note?.checklist_items) return 0
  return note.checklist_items.filter(item => item.checked).length
}

export function getChecklistProgress(note: { checklist_items?: ChecklistItem[] | null } | null) {
  if (!note?.checklist_items?.length) return 0
  return Math.round((getCheckedCount(note) / note.checklist_items.length) * 100)
}

export function getContentPreview(excerpt: string | null | undefined) {
  if (!excerpt) return '暂无内容'
  return excerpt.substring(0, 80) + (excerpt.length > 80 ? '...' : '')
}

export function useNotes() {
  const {
    items: notes,
    loading,
    fetchList,
    fetchOne,
    create,
    update,
    remove,
    refresh
  } = useResourceList<Note>({ path: '/notes', pageSize: 200 })

  const { confirmDelete } = useConfirmDelete()

  const currentNote: Ref<Note | null> = ref(null)
  const searchQuery = ref('')
  const filterType = ref('')
  const mode = ref<'browse' | 'edit'>('browse')
  const isEditing = ref(false)
  const saving = ref(false)

  const filteredNotes = computed(() => {
    let result = [...notes.value]

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(
        n =>
          n.title.toLowerCase().includes(query) ||
          n.excerpt?.toLowerCase().includes(query)
      )
    }

    if (filterType.value) {
      result = result.filter(n => n.note_type === filterType.value)
    }

    result.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return b.is_pinned ? 1 : -1
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })

    return result
  })

  const renderedContent = computed(() => {
    if (!currentNote.value?.content) return ''
    return md.render(currentNote.value.content)
  })

  /** Open a note for viewing or editing — body comes from GET /notes/{id}. */
  async function openNote(source: Note, edit: boolean) {
    const full =
      source.content !== undefined ? source : await fetchOne(source.id)
    if (!full) return
    currentNote.value = {
      ...full,
      content: full.content ?? '',
      checklist_items: full.checklist_items ? [...full.checklist_items] : []
    }
    isEditing.value = edit
    mode.value = 'edit'
  }

  function startEdit() {
    if (!currentNote.value) return
    isEditing.value = true
  }

  function cancelEdit() {
    isEditing.value = false
  }

  function backToList() {
    mode.value = 'browse'
    currentNote.value = null
    isEditing.value = false
    void refresh()
  }

  async function saveNote(payload: {
    title: string
    tags: string[]
    content?: string
    checklist_items?: ChecklistItem[]
  }) {
    const note = currentNote.value
    if (!note) return

    saving.value = true
    try {
      const updateData: Record<string, unknown> = {
        title: payload.title,
        tags: payload.tags,
        note_type: note.note_type
      }
      if (note.note_type === 'checklist') {
        updateData.checklist_items = (payload.checklist_items || []).filter(
          item => item.text.trim() !== ''
        )
      } else {
        updateData.content = payload.content
      }

      const saved = await update(note.id, updateData, { refresh: false })
      if (saved) {
        note.title = payload.title
        note.content = payload.content
        note.tags = [...payload.tags]
        note.checklist_items = [...(payload.checklist_items || [])]
      }
      isEditing.value = false
      ElMessage.success('保存成功')
    } finally {
      saving.value = false
    }
  }

  async function createNoteByType(type: NoteType) {
    const data: Record<string, unknown> = {
      title: type === 'checklist' ? '新建清单' : '新建笔记',
      note_type: type
    }
    if (type === 'checklist') {
      data.checklist_items = [{ text: '', checked: false }]
    } else {
      data.content = ''
    }

    const created = (await create(data, { refresh: false })) as Note | null
    if (created) {
      notes.value.unshift(created)
      await openNote(created, true)
    }
  }

  async function deleteNote(row: Note) {
    if (!(await confirmDelete('确定要删除这个笔记吗？'))) return
    const ok = await remove(row.id, { refresh: false })
    if (!ok) return
    notes.value = notes.value.filter(n => n.id !== row.id)
    if (currentNote.value?.id === row.id) {
      backToList()
    }
    ElMessage.success('笔记已删除')
  }

  async function handleAction(command: string) {
    const note = currentNote.value
    if (!note) return

    switch (command) {
      case 'pin': {
        const saved = await update(
          note.id,
          { is_pinned: !note.is_pinned },
          { refresh: false }
        )
        if (saved) note.is_pinned = !note.is_pinned
        break
      }
      case 'favorite': {
        const saved = await update(
          note.id,
          { is_favorite: !note.is_favorite },
          { refresh: false }
        )
        if (saved) note.is_favorite = !note.is_favorite
        break
      }
      case 'delete':
        await deleteNote(note)
        break
    }
  }

  return {
    notes,
    loading,
    filteredNotes,
    currentNote,
    searchQuery,
    filterType,
    mode,
    isEditing,
    saving,
    renderedContent,
    fetchNotes: fetchList,
    openNote,
    startEdit,
    cancelEdit,
    backToList,
    saveNote,
    createNoteByType,
    deleteNote,
    handleAction
  }
}
