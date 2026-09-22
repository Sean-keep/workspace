import { ElMessageBox } from 'element-plus'

/** ElMessageBox.confirm wrapper — resolves true only when the user confirms. */
export function useConfirmDelete() {
  async function confirmDelete(
    message = '确定要删除吗？',
    title = '提示'
  ): Promise<boolean> {
    try {
      await ElMessageBox.confirm(message, title, { type: 'warning' })
      return true
    } catch {
      return false
    }
  }

  return { confirmDelete }
}
