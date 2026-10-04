import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../index'
import { repoCreate, repoUpdate } from '../repo'
import type { Project } from '@/types/models'

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
})

/**
 * 回归：Vue 的 reactive 树上抠下来的数据是 Proxy，Dexie 的 structured clone
 * 存不了它（DataCloneError）。以前这个错被 useResourceList 的 catch 吃掉，
 * UI 报「已保存」、库里一个字没动 —— 子任务 / 标签全都中招。
 *
 * 这里故意用真 Proxy 喂 repo，钉住「写库前先洗成纯对象」这条。
 */
describe('落库前把 Proxy 洗成纯对象', () => {
  function reactive<T extends object>(target: T): T {
    // 造一个和 Vue reactive 一样「存不进 IDB」的 Proxy
    return new Proxy(target, {
      get: (t, k) => Reflect.get(t, k),
      ownKeys: (t) => Reflect.ownKeys(t),
      getOwnPropertyDescriptor: (t, k) => Reflect.getOwnPropertyDescriptor(t, k)
    })
  }

  it('repoCreate 收 Proxy 数组照样落库', async () => {
    const subtasks = reactive([
      reactive({ id: 1, title: '子一', status: 'done' }),
      reactive({ id: 2, title: '子二', status: 'todo' })
    ])
    const created = await repoCreate<Project>('projects', {
      name: 'p',
      status: 'active',
      priority: 'medium',
      subtasks: subtasks as Project['subtasks']
    })
    const row = await db.projects.get(created.id)
    expect(row?.subtasks).toHaveLength(2)
  })

  it('repoUpdate 收 Proxy 数组照样落库，且 progress 重算', async () => {
    const created = await repoCreate<Project>('projects', {
      name: 'p',
      status: 'active',
      priority: 'medium',
      subtasks: []
    })
    const updated = await repoUpdate<Project>('projects', created.id, {
      subtasks: reactive([
        reactive({ id: 1, title: '子一', status: 'done' }),
        reactive({ id: 2, title: '子二', status: 'todo' })
      ]) as Project['subtasks'],
      progress: 999
    })
    expect(updated).toBeTruthy()
    expect(updated!.subtasks).toHaveLength(2)
    // 进度不认客户端塞进来的陈旧值，按 subtasks 重算
    expect(updated!.progress).toBe(50)
    const row = await db.projects.get(created.id)
    expect(row?.progress).toBe(50)
  })
})
