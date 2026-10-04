/**
 * 单测环境：
 * - fake-indexeddb → 让 Dexie 在 Node 里跑起来
 * - localStorage 垫片 → settings / exportImport 会读写它
 *
 * 每个测试文件独立一套（vitest 默认按文件隔离模块，fake-indexeddb 随模块重建）。
 */
import 'fake-indexeddb/auto'

class MemoryStorage {
  private map = new Map<string, string>()
  getItem(key: string) {
    return this.map.has(key) ? this.map.get(key)! : null
  }
  setItem(key: string, value: string) {
    this.map.set(key, String(value))
  }
  removeItem(key: string) {
    this.map.delete(key)
  }
  clear() {
    this.map.clear()
  }
  get length() {
    return this.map.size
  }
}

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: new MemoryStorage(),
    writable: true,
    configurable: true
  })
}
