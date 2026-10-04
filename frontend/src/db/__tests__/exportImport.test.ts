import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../index'
import { exportAll, importAll, assertBackupFile } from '../exportImport'
import { repoCreate, repoList } from '../repo'
import type { Task } from '@/types/models'

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
  localStorage.clear()
})

function taskSeed(title: string): Partial<Task> {
  return {
    title,
    description: null,
    status: 'todo',
    priority: 'medium',
    due_date: null,
    tags: ['a'],
    is_pinned: false,
    is_recurring: false,
    recurrence_type: 'none',
    recurrence_days: null,
    last_completed: null,
    completed_at: null
  }
}

describe('exportAll / importAll', () => {
  it('导出 → 清空 → 导入，行完全一致（含 id）', async () => {
    await repoCreate<Task>('tasks', taskSeed('任务甲'))
    await repoCreate<Task>('tasks', taskSeed('任务乙'))
    await db.meta.put({ key: 'settings', value: { theme: 'dark', primaryColor: '#f56c6c' } })
    await db.meta.put({ key: 'profile', value: { username: '老王', email: '', avatar: '' } })

    const file = await exportAll()
    expect(file.app).toBe('personal-workspace')
    expect(file.version).toBe(1)
    expect(file.data.tasks).toHaveLength(2)
    expect(file.data.settings.theme).toBe('dark')
    expect(file.data.profile.username).toBe('老王')

    // 模拟换机：全清
    await Promise.all(db.tables.map((t) => t.clear()))
    expect((await repoList<Task>('tasks', { skip: 0, limit: 50 })).total).toBe(0)

    await importAll(file)

    const restored = await repoList<Task>('tasks', { skip: 0, limit: 50 })
    expect(restored.total).toBe(2)
    expect(restored.items.map((t) => t.title).sort()).toEqual(['任务乙', '任务甲'].sort())
    // id 必须保留 —— 别的表（比如笔记的 parent_id）指着它
    const ids = restored.items.map((t) => t.id).sort()
    expect(ids).toEqual(file.data.tasks.map((t) => t.id).sort())

    const settings = await db.meta.get('settings')
    expect((settings?.value as { theme: string }).theme).toBe('dark')
    // localStorage 缓存也回写了，刷新后主题不会跳
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('导入是整体覆盖，不会残留旧数据', async () => {
    await repoCreate<Task>('tasks', taskSeed('旧的'))
    const file = await exportAll()

    // 用户后来又建了一条
    await repoCreate<Task>('tasks', taskSeed('后建的'))

    await importAll(file)
    const rows = await repoList<Task>('tasks', { skip: 0, limit: 50 })
    expect(rows.items.map((t) => t.title)).toEqual(['旧的'])
  })

  it('拒收外来 / 损坏的文件', () => {
    expect(() => assertBackupFile(null)).toThrow()
    expect(() => assertBackupFile({})).toThrow()
    expect(() => assertBackupFile({ app: 'other-app', version: 1, data: {} })).toThrow(
      /不是「个人工作台」/
    )
    expect(() =>
      assertBackupFile({ app: 'personal-workspace', version: 99, data: {} })
    ).toThrow(/不支持的备份版本/)
    expect(() =>
      assertBackupFile({ app: 'personal-workspace', version: 1 })
    ).toThrow(/缺少数据段/)
    expect(() =>
      assertBackupFile({ app: 'personal-workspace', version: 1, data: {} })
    ).not.toThrow()
  })
})
