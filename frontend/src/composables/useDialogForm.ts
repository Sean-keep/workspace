import { reactive, type UnwrapRef } from 'vue'

export interface DialogFormState<T> {
  visible: boolean
  submitting: boolean
  editing: T | null
  openCreate: () => void
  openEdit: (row: T) => void
  close: () => void
}

/**
 * Shared dialog open/close + editing-row state for add/edit dialogs.
 * Form fields stay page-specific — only the shell is shared.
 * Returned as a reactive object so templates bind without `.value`.
 */
export function useDialogForm<T = unknown>(): DialogFormState<T> {
  // reactive() deep-unwraps to UnwrapRef<T>; store that and re-type on the way out
  // so callers keep the plain `T | null` shape without generic UnwrapRef friction.
  const dialog = reactive({
    visible: false,
    submitting: false,
    editing: null as UnwrapRef<T> | null
  })

  function openCreate(): void {
    dialog.editing = null
    dialog.visible = true
  }

  function openEdit(row: T): void {
    dialog.editing = row as unknown as typeof dialog.editing
    dialog.visible = true
  }

  function close(): void {
    dialog.visible = false
  }

  return Object.assign(dialog, { openCreate, openEdit, close }) as unknown as DialogFormState<T>
}
