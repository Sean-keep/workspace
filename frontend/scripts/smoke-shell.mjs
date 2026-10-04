/**
 * 壳层结构冒烟测试 —— 用 SSR 渲染出真实 DOM 再断言。
 *
 * 跑在 Node 上（`node scripts/smoke-shell.mjs`，无需浏览器），覆盖的是分叉壳
 * 最容易出的错：抽 menuItems 时漏项/改序/改图标名、两个 router-view 同时挂载、
 * 手机壳把桌面搜索框这类死代码搬过去。**验不了像素** —— 布局对不对还是要
 * 拿 Chrome / 真机看。
 *
 * 不用额外依赖：vite 的 ssrLoadModule 加载真实组件，@vue/server-renderer 是
 * vue 自带的。样式全部替换成空模块（只验 DOM），SFC 的 <style> 在 transform
 * 里剥掉，绕开 vite SSR 里 sass FakeWorker 的兼容问题 —— 生产构建走另一条路径。
 *
 * 用法：
 *   cd frontend && node scripts/smoke-shell.mjs      # 全部通过时退出码 0
 *   DUMP=1 node scripts/smoke-shell.mjs              # 顺带打印两个分支的 HTML
 */
import { createServer } from 'vite'
import { createSSRApp, h } from 'vue'
import { createPinia } from 'pinia'
import dayjs from 'dayjs'
import { createRouter, createMemoryHistory } from 'vue-router'
import { renderToString } from 'vue/server-renderer'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
process.chdir(ROOT)

// ── 最小 DOM 桩：@/router 在模块加载时就会 createWebHistory() ──────────
const noop = () => {}
const fakeElement = {
  style: {},
  classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
  setAttribute: noop,
  getAttribute: () => null,
  appendChild: noop,
  removeChild: noop,
  addEventListener: noop,
  removeEventListener: noop,
  querySelector: () => null,
  querySelectorAll: () => [],
  firstChild: null,
  innerHTML: ''
}
globalThis.window = {
  history: {
    state: null,
    scrollRestoration: 'auto',
    pushState: noop,
    replaceState: noop,
    go: noop,
    back: noop,
    forward: noop,
    length: 1
  },
  location: {
    href: 'http://localhost/',
    origin: 'http://localhost',
    protocol: 'http:',
    host: 'localhost',
    hostname: 'localhost',
    port: '',
    pathname: '/',
    search: '',
    hash: '',
    assign: noop,
    replace: noop
  },
  matchMedia: (media) => ({
    matches: false,
    media,
    onchange: null,
    addEventListener: noop,
    removeEventListener: noop,
    addListener: noop,
    removeListener: noop,
    dispatchEvent: () => true
  }),
  addEventListener: noop,
  removeEventListener: noop,
  requestAnimationFrame: (cb) => setTimeout(cb, 0),
  cancelAnimationFrame: clearTimeout,
  navigator: { userAgent: 'smoke-shell' },
  getComputedStyle: () => ({ getPropertyValue: () => '' }),
  document: fakeElement
}
globalThis.document = {
  ...fakeElement,
  documentElement: fakeElement,
  head: fakeElement,
  body: fakeElement,
  baseURI: 'http://localhost/',
  createElement: () => ({ ...fakeElement, style: {} }),
  createComment: () => fakeElement,
  createTextNode: () => fakeElement,
  visibilityState: 'visible'
}
try {
  // Node 22 自带的 navigator 是只getter，只能 defineProperty 覆盖
  Object.defineProperty(globalThis, 'navigator', {
    value: { userAgent: 'smoke-shell' },
    configurable: true
  })
} catch {
  /* 有就用现成的 */
}
globalThis.location = globalThis.window.location
const store = new Map()
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear()
}
globalThis.sessionStorage = globalThis.localStorage

// ── 断言工具 ────────────────────────────────────────────────────────
let failed = 0
function check(name, cond, extra = '') {
  if (cond) {
    console.log(`  ✓ ${name}`)
  } else {
    failed++
    console.log(`  ✗ ${name}${extra ? ' — ' + extra : ''}`)
  }
}

/** 与改造前手写的 9 个 el-menu-item 一一对应：[path, title, icon, 是否手机 Tab] */
const EXPECTED = [
  ['/', '工作台', 'HomeFilled', true],
  ['/tasks', '任务管理', 'List', true],
  ['/calendar', '日程管理', 'Calendar', true],
  ['/notes', '笔记管理', 'Notebook', true],
  ['/bookmarks', '书签管理', 'Link', false],
  ['/scripts', '脚本管理', 'Document', false],
  ['/projects', '项目管理', 'Folder', false],
  ['/tools', '工具箱', 'Tools', false],
  ['/settings', '设置', 'Setting', false]
]

// 只验 DOM 结构 —— 把 SFC 的 <style> 剥掉，绕开 vite SSR 里 sass 的兼容问题。
// class 名写在模板里，不受影响。
const stripStyles = {
  name: 'smoke-strip-styles',
  enforce: 'pre',
  transform(code, id) {
    return id.endsWith('.vue') ? code.replace(/<style[\s\S]*?<\/style>/g, '<style></style>') : null
  }
}

// Element Plus 的样式副作用导入（…/style/css）指向真 .css，SSR 加载不了。
const stubCss = {
  name: 'smoke-stub-css',
  enforce: 'pre',
  resolveId(id) {
    return /\.css($|\?)/.test(id) || id.includes('theme-chalk') || id.includes('style/css')
      ? '\0smoke-css'
      : null
  },
  load(id) {
    return id === '\0smoke-css' ? 'export default {}' : null
  }
}

const server = await createServer({
  root: ROOT,
  plugins: [stripStyles, stubCss],
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  logLevel: 'error',
  // element-plus 交给 vite 处理（好让 stubCss 生效）；其余走 Node 原生加载
  ssr: {
    noExternal: ['element-plus'],
    external: ['vue', 'vue-router', 'pinia', 'axios', 'dayjs', '@element-plus/icons-vue']
  }
})

try {
  // ── 1. menuItems 与改造前手写的 9 项逐条对齐 ────────────────────────
  console.log('\n[1] layouts/menuItems.ts')
  const { menuItems, tabItems, moreItems } = await server.ssrLoadModule('/src/layouts/menuItems.ts')
  check('共 9 项', menuItems.length === 9, `实际 ${menuItems.length}`)
  for (const [i, [itemPath, title, icon, tab]] of EXPECTED.entries()) {
    const it = menuItems[i]
    check(
      `#${i} ${itemPath} / ${title} / ${icon}`,
      it && it.path === itemPath && it.title === title && it.icon === icon && !!it.tab === tab,
      `实际 ${JSON.stringify(it)}`
    )
  }
  check('tab 项 4 个', tabItems.length === 4, `实际 ${tabItems.length}`)
  check('更多项 5 个', moreItems.length === 5, `实际 ${moreItems.length}`)
  check(
    'Tab 短标签（缺 shortTitle 就回落 title）',
    tabItems.map((i) => i.shortTitle ?? i.title).join(',') === '工作台,任务,日程,笔记',
    tabItems.map((i) => i.shortTitle ?? i.title).join(',')
  )

  // ── 2. 渲染 MainLayout 两个分支 ───────────────────────────────────
  console.log('\n[2] MainLayout.vue 分支')
  const { default: MainLayout } = await server.ssrLoadModule('/src/layouts/MainLayout.vue')
  const { useUiStore } = await server.ssrLoadModule('/src/stores/ui.ts')

  async function renderShell({ path: routePath, mobile }) {
    const app = createSSRApp({ render: () => h(MainLayout) })
    const pinia = createPinia()
    app.use(pinia)
    const routes = EXPECTED.map(([p, title]) => ({
      path: p,
      component: { render: () => h('div', 'PAGE') },
      meta: { title }
    }))
    const router = createRouter({ history: createMemoryHistory(), routes })
    app.use(router)
    await router.push(routePath)
    await router.isReady()
    const uiStore = useUiStore(pinia)
    uiStore.isMobile = mobile
    const ctx = { teleports: {} }
    const html = await renderToString(app, ctx)
    return { html, teleports: ctx.teleports }
  }

  const d = await renderShell({ path: '/', mobile: false })
  const m = await renderShell({ path: '/tasks', mobile: true })
  const desktop = d.html
  const mobile = m.html
  // el-popover 默认 append-to-body，内容在 teleports 里，不在主 HTML 里
  const popoverHtml = Object.values(d.teleports).join('\n')

  if (process.env.DUMP) {
    console.log(`\n--- DESKTOP ---\n${desktop}\n--- MOBILE ---\n${mobile}\n--- END ---\n`)
  }

  // el-menu-item 渲染成 <li class="el-menu-item">，**不**输出 index 属性；
  // 标题也变成裸文本而不是 <template #title>。断言要对着真实 DOM 写。
  const menuStart = desktop.indexOf('<ul role="menubar"')
  const menuEnd = desktop.indexOf('</ul>', menuStart)
  const menuHtml = menuStart >= 0 ? desktop.slice(menuStart, menuEnd) : ''
  const order = EXPECTED.map(([, title]) => menuHtml.indexOf(title))

  console.log('\n  —— 桌面分支 ——')
  check('渲染出 .el-aside.sidebar', desktop.includes('class="el-aside sidebar"'))
  check('侧边栏宽度沿用 :width 绑定', desktop.includes('--el-aside-width:180px'))
  check('渲染出 .main-layout', desktop.includes('class="el-container main-layout"'))
  check('没有手机壳 .mobile-layout', !desktop.includes('mobile-layout'))
  check('没有手机 Tab .mobile-tabbar', !desktop.includes('mobile-tabbar'))
  check('logo 区还在', desktop.includes('class="logo"') && desktop.includes('class="logo-text"'))
  check('折叠按钮还在', desktop.includes('class="collapse-btn"'))
  check(
    '菜单项正好 9 个',
    (menuHtml.match(/class="el-menu-item/g) || []).length === 9,
    `实际 ${(menuHtml.match(/class="el-menu-item/g) || []).length}`
  )
  check('9 个标题都在', order.every((i) => i >= 0), `索引 ${order.join(',')}`)
  check(
    '标题顺序与 menuItems 一致',
    order.every((v, i, a) => i === 0 || v > a[i - 1]),
    `索引 ${order.join(',')}`
  )
  // 每页只有一个 router-view —— v-show 分叉会做出两个，请求就翻倍了
  check(
    '只有一个 router-view 挂载点（只有一处 PAGE）',
    (desktop.match(/PAGE/g) || []).length === 1,
    `${(desktop.match(/PAGE/g) || []).length} 处`
  )
  check(
    '搜索框还在（桌面死代码保留）',
    desktop.includes('class="el-input el-input--small') && desktop.includes('搜索')
  )
  check('通知铃 + 徽标还在', desktop.includes('notification-badge'))
  check('用户下拉还在', desktop.includes('class="user-info'))
  check('内容区 .el-main.content 还在', desktop.includes('class="el-main content"'))

  console.log('\n  —— 手机分支 ——')
  check('渲染出手机壳 .mobile-layout', mobile.includes('mobile-layout'))
  check('渲染出底部 Tab .mobile-tabbar', mobile.includes('mobile-tabbar'))
  check('没有桌面侧边栏', !mobile.includes('el-aside'))
  check('没有搜索框（死代码不搬）', !mobile.includes('搜索'))
  for (const label of ['工作台', '任务', '日程', '笔记', '更多']) {
    check(`Tab 含「${label}」`, mobile.includes(`>${label}<`) || mobile.includes(`<!--]-->${label}<!--`))
  }
  // router-link 会把 tab-item 和自己的 active class 合进同一个 class 属性
  check('Tab 格正好 5 个', (mobile.match(/tab-item/g) || []).length === 5, `实际 ${(mobile.match(/tab-item/g) || []).length}`)
  const tabbarStart = mobile.indexOf('<nav class="mobile-tabbar">')
  const tabbarHtml = mobile.slice(tabbarStart, mobile.indexOf('</nav>', tabbarStart))
  check(
    'Tab 用短标签，不是「任务管理」这类长标题',
    !/(任务管理|日程管理|笔记管理|书签管理)/.test(tabbarHtml),
    tabbarHtml.slice(0, 200)
  )
  // el-drawer 的 body 由 useDialog 的 `rendered` 门控，只有 modelValue 真正翻成 true
  // （watch / onMounted）才置位 —— SSR 里两者都不跑，所以 body 是空的。这是 SSR 限制，
  // 不是 bug：抽屉里的 5 项在 [1] 的 moreItems 已经验过，这里只验抽屉本身在场。
  check('「更多」抽屉在场', mobile.includes('class="more-drawer el-drawer btt"'), mobile.slice(-400))
  check('抽屉是 btt 方向', mobile.includes('el-drawer btt'))
  check('抽屉 size=auto 生效（height:auto）', mobile.includes('height:auto'))
  check('通知面板抽到了 body 上（两侧共用）', popoverHtml.includes('消息通知'))
  check(
    '只有一个 router-view 挂载点',
    (mobile.match(/PAGE/g) || []).length === 1,
    `${(mobile.match(/PAGE/g) || []).length} 处`
  )

  // ── 3. ResponsiveList：表格↔卡片的开关真的隔离两个分支 ────────────
  // 「桌面 DOM 不变」这条承诺对这张表/卡开关最要命 —— 桌面分支必须原样
  // 渲染调用方塞进来的 el-table，不能多出卡片、也不能少表格。
  console.log('\n[3] ResponsiveList.vue 分支开关')
  const { default: ResponsiveList } = await server.ssrLoadModule('/src/components/ResponsiveList.vue')

  async function renderList({ mobile: isMobile, items, loading = false }) {
    const pinia = createPinia()
    useUiStore(pinia).isMobile = isMobile
    const app = createSSRApp({
      render: () =>
        h(ResponsiveList, { items, loading, emptyText: '暂无任务' }, {
          mobile: ({ item }) => h('div', { class: 'is-mobile-card' }, `CARD-${item.id}`),
          desktop: () => h('table', { class: 'is-desktop-table' }, 'TABLE')
        })
    })
    app.use(pinia)
    return await renderToString(app)
  }

  const rows = [{ id: 1 }, { id: 2 }, { id: 3 }]
  const rlDesktop = await renderList({ mobile: false, items: rows })
  const rlMobile = await renderList({ mobile: true, items: rows })
  const rlEmpty = await renderList({ mobile: true, items: [] })

  console.log('\n  —— 桌面分支 ——')
  check('原样渲染 desktop 插槽', rlDesktop.includes('class="is-desktop-table"'))
  check('没有卡片容器 .rl-mobile', !rlDesktop.includes('rl-mobile'))
  check('没有卡片行 .rl-row', !rlDesktop.includes('rl-row'))
  check('没有渲染 mobile 插槽', !rlDesktop.includes('is-mobile-card'))
  check('没有空态（有数据）', !rlDesktop.includes('暂无任务'))

  console.log('\n  —— 手机分支 ——')
  check('渲染 .rl-mobile', rlMobile.includes('rl-mobile'))
  check('卡片行正好 3 个', (rlMobile.match(/rl-row/g) || []).length === 3, `实际 ${(rlMobile.match(/rl-row/g) || []).length}`)
  check('每行渲染 mobile 插槽', (rlMobile.match(/is-mobile-card/g) || []).length === 3)
  check('三行 id 齐', rlMobile.includes('CARD-1') && rlMobile.includes('CARD-2') && rlMobile.includes('CARD-3'))
  check('没有渲染 desktop 插槽', !rlMobile.includes('is-desktop-table'))
  check('有数据时不显示空态', !rlMobile.includes('暂无任务'))

  console.log('\n  —— 空态 ——')
  check('手机空列表出 el-empty', rlEmpty.includes('暂无任务'))
  check('手机空列表没有卡片行', !rlEmpty.includes('rl-row'))

  // ── 4. 日历侧栏拆分后桌面 DOM 不变 ─────────────────────────────────
  // EventList 是 fragment root，EventSidebar 只负责那层 .calendar-sidebar ——
  // 拆分前的 DOM 就是 `.calendar-sidebar > (.sidebar-header + .event-list-sidebar)`。
  console.log('\n[4] EventSidebar / EventList 拆分')
  const { default: EventSidebar } = await server.ssrLoadModule('/src/views/Calendar/components/EventSidebar.vue')
  const { default: EventList } = await server.ssrLoadModule('/src/views/Calendar/components/EventList.vue')
  const fakeEvents = [
    { id: 1, title: '日程甲', description: 'desc', start_time: '2026-10-01T09:00:00Z', end_time: '2026-10-01T10:00:00Z', is_all_day: false, color: '#409eff' },
    { id: 2, title: '日程乙', description: null, start_time: '2026-10-01T14:00:00Z', end_time: '2026-10-01T15:00:00Z', is_all_day: true, color: '#67c23a' }
  ]

  async function renderCal(Comp, props) {
    const pinia = createPinia()
    useUiStore(pinia).isMobile = false
    const app = createSSRApp({ render: () => h(Comp, props) })
    app.use(pinia)
    return await renderToString(app)
  }

  const sidebarHtml = await renderCal(EventSidebar, { title: '10月1日 星期四', events: fakeEvents })
  const listHtml = await renderCal(EventList, { title: '10月1日 星期四', events: fakeEvents })

  // SSR 会把模板注释和 fragment 锚点（<!--[-->）一起吐出来 —— 断言前先剥掉，
  // 不然「中间无包裹」会被注释文字误伤。
  const stripComments = (s) => s.replace(/<!--[\s\S]*?-->/g, '')

  // 侧栏容器把两个内层节点**直接**包起来 —— 中间没有多余包裹元素
  const csTag = '<div class="calendar-sidebar">'
  const csStart = sidebarHtml.indexOf(csTag)
  const shStart = sidebarHtml.indexOf('<div class="sidebar-header">')
  const elsStart = sidebarHtml.indexOf('<div class="event-list-sidebar">')
  check('渲染出 .calendar-sidebar', csStart >= 0)
  check('.sidebar-header 在容器内', shStart > csStart, `cs=${csStart} sh=${shStart}`)
  check(
    '.sidebar-header 是容器的直接子节点（中间无包裹）',
    shStart >= 0 && stripComments(sidebarHtml.slice(csStart + csTag.length, shStart)).trim() === '',
    JSON.stringify(sidebarHtml.slice(csStart + csTag.length, shStart))
  )
  check('.event-list-sidebar 紧随其后', elsStart > shStart, `sh=${shStart} els=${elsStart}`)
  check('两条日程都渲染', sidebarHtml.includes('日程甲') && sidebarHtml.includes('日程乙'))

  // EventList 自己没有包裹元素 —— fragment root，手机端拿去当「当日议程」
  const listBody = stripComments(listHtml).trimStart()
  check(
    'EventList 是 fragment（首节点就是 .sidebar-header）',
    listBody.startsWith('<div class="sidebar-header">'),
    listBody.slice(0, 60)
  )
  check('EventList 没有 .calendar-sidebar 包裹', !/<div class="calendar-sidebar"/.test(listHtml))
  check('EventList 内容与侧栏一致', listHtml.includes('日程甲') && listHtml.includes('日程乙'))

  // ── 5. 提醒触发点的计算规则 ───────────────────────────────────────
  // 纯函数，是整套提醒里最容易悄悄算错的地方：reminder_minutes<=0 要不提醒，
  // 全天事件固定当天 09:00，其余是 start - reminder_minutes。
  console.log('\n[5] reminderScheduler 触发点')
  const { remindersOf } = await server.ssrLoadModule('/src/stores/reminderScheduler.ts')
  const ms = (s) => new Date(s).getTime()
  const mkEvent = (over) => ({
    id: 7,
    user_id: 1,
    title: '测试日程',
    description: null,
    start_time: '2026-10-03T10:00:00Z',
    end_time: '2026-10-03T11:00:00Z',
    location: null,
    is_all_day: false,
    reminder_minutes: 10,
    color: '#409eff',
    recurrence: null,
    created_at: '',
    updated_at: '',
    ...over
  })

  const ten = remindersOf([mkEvent({})])
  check('提前 10 分钟 → start-10m', ten.length === 1 && ten[0].triggerAt === ms('2026-10-03T09:50:00Z'), JSON.stringify(ten))
  check('key 是 `${eventId}:${triggerAt}`', ten[0]?.key === `7:${ms('2026-10-03T09:50:00Z')}`, ten[0]?.key)
  check('保留原开始时间', ten[0]?.startAt === ms('2026-10-03T10:00:00Z'))
  check('提前 60 分钟', remindersOf([mkEvent({ reminder_minutes: 60 })])[0]?.triggerAt === ms('2026-10-03T09:00:00Z'))
  check('reminder_minutes = 0 → 不提醒', remindersOf([mkEvent({ reminder_minutes: 0 })]).length === 0)
  check('reminder_minutes < 0 → 不提醒', remindersOf([mkEvent({ reminder_minutes: -1 })]).length === 0)
  check('reminder_minutes 缺失 → 不提醒', remindersOf([mkEvent({ reminder_minutes: undefined })]).length === 0)

  const allDay = remindersOf([mkEvent({ is_all_day: true, start_time: '2026-10-03T00:00:00Z', reminder_minutes: 30 })])
  check('全天事件当天 09:00 触发', allDay.length === 1, JSON.stringify(allDay))
  check(
    '全天触发点是本地 09:00（与机器时区无关）',
    allDay.length === 1 && dayjs(allDay[0].triggerAt).hour() === 9 && dayjs(allDay[0].triggerAt).minute() === 0,
    allDay.length === 1 ? dayjs(allDay[0].triggerAt).format('YYYY-MM-DD HH:mm') : ''
  )
  check('全天 + reminder_minutes=0 → 不提醒', remindersOf([mkEvent({ is_all_day: true, reminder_minutes: 0 })]).length === 0)

  check(
    '多条日程各自成排程项',
    remindersOf([mkEvent({ id: 1 }), mkEvent({ id: 2, reminder_minutes: 30 })]).length === 2
  )
  check(
    '不传 reminder_minutes 的事件不会误排',
    remindersOf([mkEvent({ reminder_minutes: undefined })]).length === 0
  )
} finally {
  await server.close()
}

console.log(failed ? `\n${failed} 项失败\n` : '\n全部通过\n')
process.exit(failed ? 1 : 0)
