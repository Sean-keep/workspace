import type { ProjectSubtask } from '@/types/models'

/** 译自 `backend/app/schemas/project.py` —— done / completed 都算完成。 */
export const PROGRESS_STATUSES = new Set(['done', 'completed'])

/**
 * 项目进度 = 已完成子任务占比（0-100）。
 *
 * 后端 `compute_progress` 里非 dict 项不计入分子但仍计入分母；这里的
 * `ProjectSubtask[]` 已经是结构化的，同样把缺 `status` 的算未完成。
 */
export function computeProgress(subtasks?: ProjectSubtask[] | null): number {
  if (!subtasks?.length) return 0
  const completed = subtasks.filter((t) => PROGRESS_STATUSES.has(t?.status ?? '')).length
  return Math.round((completed / subtasks.length) * 100)
}
