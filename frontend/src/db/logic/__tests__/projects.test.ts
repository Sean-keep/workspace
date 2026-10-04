import { describe, expect, it } from 'vitest'
import { computeProgress } from '../projects'

function sub(status: string) {
  return { id: 1, title: 'x', status, priority: 'low' }
}

describe('computeProgress', () => {
  it('没有子任务 → 0', () => {
    expect(computeProgress([])).toBe(0)
    expect(computeProgress(null)).toBe(0)
    expect(computeProgress(undefined)).toBe(0)
  })

  it('全完成 → 100', () => {
    expect(computeProgress([sub('done'), sub('done')])).toBe(100)
  })

  it('completed 也算完成（和后端 PROGRESS_STATUSES 一致）', () => {
    expect(computeProgress([sub('completed'), sub('done')])).toBe(100)
  })

  it('混合 → 四舍五入的百分比', () => {
    expect(computeProgress([sub('done'), sub('todo'), sub('todo'), sub('todo')])).toBe(25)
    expect(computeProgress([sub('done'), sub('done'), sub('todo')])).toBe(67)
  })

  it('缺 status 的算未完成', () => {
    expect(computeProgress([{ id: 1, title: 'x', status: '', priority: 'low' }])).toBe(0)
  })
})
