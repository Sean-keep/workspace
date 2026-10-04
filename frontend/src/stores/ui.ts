import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 手机 / 桌面的唯一分支权威。
 *
 * 结构换壳（侧边栏→Tab、表格→卡片、日历形态）都读这里的 `isMobile`，用 `v-if`
 * 分叉 —— 桌面上那棵子树根本不 mount，这是「桌面布局不变」唯一可靠的保证。
 *
 * 不要用 `v-show` 代替：两棵子树都活着就是两个 `router-view`，每页打两遍接口。
 * 也不要用纯 CSS 塌缩 `el-table` —— `fixed` 列是独立的绝对定位表格碎片，
 * `display:block` 塌缩在 Element Plus 升级时会悄悄坏掉桌面。
 *
 * 代价：跨断点会重挂载 `router-view`，丢页面局部状态。手机不会跨 768px，
 * 只有桌面拖窗口会触发。
 *
 * ⚠️ 断点必须和 `assets/styles/main.scss` 的 `$bp-mobile` 保持同步（768px），
 * 那边的 `@media (max-width: 767px)` 块里也写着同一句提醒。
 */
export const MOBILE_MEDIA = '(max-width: 767px)'

export const useUiStore = defineStore('ui', () => {
  const isMobile = ref(false)
  /** 「更多」底部抽屉（工作台/脚本/项目/工具箱/设置）的显隐 */
  const moreDrawerVisible = ref(false)

  let mql: MediaQueryList | null = null

  function init(): void {
    if (mql) return // 幂等 —— App.vue 挂载时调一次就够了
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    mql = window.matchMedia(MOBILE_MEDIA)
    isMobile.value = mql.matches
    const onChange = (e: MediaQueryListEvent) => {
      isMobile.value = e.matches
    }
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', onChange)
    } else {
      // Safari < 14 只有废弃的 addListener
      ;(mql as unknown as { addListener: (fn: (e: MediaQueryListEvent) => void) => void }).addListener(onChange)
    }
  }

  return { isMobile, moreDrawerVisible, init }
})
