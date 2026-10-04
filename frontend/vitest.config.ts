import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  test: {
    environment: 'node',
    // 每个测试文件一份干净的 IndexedDB（fake-indexeddb 在 setup 里挂到全局）。
    setupFiles: ['./src/db/__tests__/setup.ts'],
    include: ['src/**/__tests__/**/*.test.ts']
  }
})
