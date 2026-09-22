import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { useResourceList, useConfirmDelete, useDialogForm } from '@/composables'
import type { Snippet, SnippetPayload } from '@/types/models'

export const commonLanguages = [
  'Python', 'JavaScript', 'TypeScript', 'Shell', 'Bash',
  'Go', 'Rust', 'Java', 'C', 'C++',
  'PHP', 'Ruby', 'SQL', 'PowerShell', 'Dockerfile',
  'YAML', 'JSON', 'Lua', 'Perl', 'R'
]

export const commonTags = [
  '工具', '自动化', '部署', '监控', '备份',
  '数据处理', '网络', '安全', '运维', '开发'
]

export function formatDate(date: string) {
  return dayjs(date).format('MM-DD HH:mm')
}

export interface ScriptFormState {
  title: string
  description: string
  language: string
  code: string
  tags: string[]
}

export function useScripts() {
  const {
    items: scripts,
    loading,
    fetchList,
    create,
    update,
    remove,
    refresh
  } = useResourceList<Snippet>({ path: '/snippets', pageSize: 200 })

  const { confirmDelete } = useConfirmDelete()
  const scriptDialog = useDialogForm<Snippet>()

  const searchQuery = ref('')
  const filterLanguage = ref('')

  const languages = computed(() => {
    const langs = new Set(scripts.value.map(s => s.language).filter(Boolean))
    return Array.from(langs)
  })

  const filteredScripts = computed(() => {
    let result = [...scripts.value]

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(
        s =>
          s.title.toLowerCase().includes(query) ||
          s.code.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query)
      )
    }

    if (filterLanguage.value) {
      result = result.filter(s => s.language === filterLanguage.value)
    }

    return result
  })

  async function submitScript(form: ScriptFormState) {
    scriptDialog.submitting = true
    try {
      const payload: SnippetPayload = { ...form }
      if (scriptDialog.editing) {
        await update(scriptDialog.editing.id, payload)
        ElMessage.success('脚本已更新')
      } else {
        await create(payload)
        ElMessage.success('脚本已创建')
      }
      scriptDialog.close()
    } finally {
      scriptDialog.submitting = false
    }
  }

  async function deleteScript(script: Snippet) {
    if (!(await confirmDelete('确定要删除这个脚本吗？'))) return
    await remove(script.id)
    ElMessage.success('脚本已删除')
  }

  async function copyScript(script: Snippet) {
    try {
      await navigator.clipboard.writeText(script.code)
      ElMessage.success('已复制到剪贴板')
    } catch {
      ElMessage.error('复制失败')
    }
  }

  return {
    scripts,
    loading,
    searchQuery,
    filterLanguage,
    languages,
    filteredScripts,
    scriptDialog,
    fetchScripts: fetchList,
    refresh,
    submitScript,
    deleteScript,
    copyScript
  }
}
