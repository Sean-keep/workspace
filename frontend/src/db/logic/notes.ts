/** 译自 `backend/app/api/notes.py` 的 `EXCERPT_LEN`。 */
export const EXCERPT_LEN = 160

/**
 * 笔记列表行的摘要。超长加 `…` —— 和后端 `_list_dict` 一致，
 * `useNotes` 的列表卡片直接吃这个字段。
 */
export function makeExcerpt(content: string | null | undefined, len: number = EXCERPT_LEN): string | null {
  if (!content) return null
  return content.slice(0, len) + (content.length > len ? '…' : '')
}
