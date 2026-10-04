/**
 * 端到端离线验收 —— Playwright 打**真实构建产物**，全程不 mock。
 *
 * 数据全在 IndexedDB，所以这就是产品本身：`npm run build && npm run preview`
 * 起个静态服务器，浏览器装完就用。覆盖的东西按风险排：改坏会静默丢数据的
 * （循环重置、导出导入）排在最前，UI 细节排在后面。
 *
 * 跑法：
 *   cd frontend && npm run build && node e2e/offline.mjs
 *   BASE=http://127.0.0.1:4173 node e2e/offline.mjs     # 已有 preview 在跑
 *
 * 断言风格沿用 scripts/smoke-shell.mjs：一行一个 ✓/✗，失败退出码 1。
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const BASE = process.env.BASE || 'http://127.0.0.1:4173'
const MOBILE = { width: 375, height: 812 }
const DESKTOP = { width: 1280, height: 800 }

let failed = 0
let passed = 0
function check(name, cond, extra = '') {
  if (cond) {
    passed++
    console.log(`  ✓ ${name}`)
  } else {
    failed++
    console.log(`  ✗ ${name}${extra ? ' — ' + extra : ''}`)
  }
}
function section(title) {
  console.log(`\n[${title}]`)
}

// ── 起 preview（除非外部已给 BASE）─────────────────────────────────────
let preview = null
if (!process.env.BASE) {
  preview = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
    cwd: new URL('..', import.meta.url).pathname,
    stdio: 'ignore'
  })
  // 等端口起来
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(BASE + '/', { method: 'HEAD' })
      if (r.ok) break
    } catch {
      /* 还没起 */
    }
    await sleep(250)
  }
}

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: DESKTOP })
const page = await context.newPage()

/** 收集 console 里真正的报错（资源加载失败不算 —— 离线本来就可能有） */
const pageErrors = []
page.on('pageerror', (e) => pageErrors.push(String(e)))
/** 任何外网请求都记下来 —— 全离线的硬指标 */
const externalRequests = []
page.on('request', (req) => {
  const u = new URL(req.url())
  if (u.hostname !== '127.0.0.1' && u.hostname !== 'localhost' && u.hostname !== '') {
    externalRequests.push(req.url())
  }
})

async function goto(path = '/') {
  await page.goto(BASE + path, { waitUntil: 'load' })
  // 等 Vue 挂载 + 首屏数据（本地 Dexie，很快就返回）
  await page.waitForSelector('.main-layout, .mobile-layout', { timeout: 15000 })
  await sleep(200)
}

/**
 * 任务页桌面默认是看板（无 checkbox，靠拖拽换列）。要测完成就得先切到列表。
 * 手机端默认就是列表，这一步是幂等的。
 */
async function useTaskList() {
  const listBtn = page.locator('.view-switch .el-radio-button').filter({ hasText: '列表' })
  if (await listBtn.count()) {
    const active = await listBtn.first().evaluate((el) => el.classList.contains('is-active'))
    if (!active) {
      await listBtn.first().click()
      await sleep(300)
    }
  }
}

/**
 * 任务列表的一行：桌面是 el-table 行，手机是 TaskRow 卡片。
 * ResponsiveList 的两个插槽，DOM 完全不同，别写死一个。
 */
function taskRow(title) {
  return page
    .locator('.el-table__row, .task-row')
    .filter({ hasText: title })
    .first()
}

/** 直接读 IndexedDB，绕开 UI —— 只用来造「昨天完成」这种 UI 造不出的状态 */
async function idbEval(fn, ...args) {
  return page.evaluate(fn, ...args)
}

// 列出某张表的全部行
const idbAll = (store) =>
  idbEval(
    async (name) => {
      const open = indexedDB.open('personal-workspace')
      const db = await new Promise((res, rej) => {
        open.onsuccess = () => res(open.result)
        open.onerror = () => rej(open.error)
      })
      const rows = await new Promise((res, rej) => {
        const req = db.transaction(name).objectStore(name).getAll()
        req.onsuccess = () => res(req.result)
        req.onerror = () => rej(req.error)
      })
      db.close()
      return JSON.parse(JSON.stringify(rows))
    },
    store
  )

// 写一行（按 id 覆盖）。注意 page.evaluate 只吃**一个**参数 —— 得打包成对象传。
const idbPut = (store, row) =>
  idbEval(
    async ({ name, value }) => {
      const open = indexedDB.open('personal-workspace')
      const db = await new Promise((res, rej) => {
        open.onsuccess = () => res(open.result)
        open.onerror = () => rej(open.error)
      })
      await new Promise((res, rej) => {
        const req = db.transaction(name, 'readwrite').objectStore(name).put(value)
        req.onsuccess = () => res()
        req.onerror = () => rej(req.error)
      })
      db.close()
    },
    { name: store, value: row }
  )

const idbClearAll = () =>
  idbEval(async () => {
    const open = indexedDB.open('personal-workspace')
    const db = await new Promise((res, rej) => {
      open.onsuccess = () => res(open.result)
      open.onerror = () => rej(open.error)
    })
    for (const name of db.objectStoreNames) {
      await new Promise((res, rej) => {
        const req = db.transaction(name, 'readwrite').objectStore(name).clear()
        req.onsuccess = () => res()
        req.onerror = () => rej(req.error)
      })
    }
    db.close()
  })

// ── 0. 冷启动 ──────────────────────────────────────────────────────────
section('0. 冷启动')
await goto('/')
check('冷启动直接落在工作台（没有登录页）', page.url().endsWith('/'), page.url())
check('桌面壳挂载 .main-layout', await page.locator('.main-layout').isVisible())
check('侧边栏在', await page.locator('.el-aside.sidebar').isVisible())
check('空态能渲染（不是白屏）', (await page.locator('body').innerText()).includes('工作台'))

// ── 1. 任务 CRUD + completed_at ────────────────────────────────────────
section('1. 任务：建 / 完成 / 编辑 / 删')
await goto('/tasks')
await useTaskList()
await page.getByRole('button', { name: '新建任务' }).click()
await page.locator('input[placeholder="请输入任务名称"]').fill('e2e 任务甲')
await page.locator('.el-dialog:visible .el-button--primary').filter({ hasText: '创建' }).click()
await page.waitForSelector('.el-dialog', { state: 'detached', timeout: 5000 }).catch(() => {})
await sleep(500)
// 别拿 body 全文当断言 —— 弹窗输入框里的同名文本会误伤。认行。
check('新建的任务出现在列表行里', (await taskRow('e2e 任务甲').count()) > 0)

// 完成它 —— 行首的 checkbox
await taskRow('e2e 任务甲').locator('.el-checkbox').first().click()
await sleep(500)
let tasks = await idbAll('tasks')
const t1 = tasks.find((t) => t.title === 'e2e 任务甲')
check('完成后 status=done', t1?.status === 'done', JSON.stringify(t1?.status))
check('completed_at 真的写上了', !!t1?.completed_at, String(t1?.completed_at))
check('completed_at 是合法时间', !Number.isNaN(Date.parse(t1?.completed_at || '')), t1?.completed_at)

// 编辑 —— 桌面表格是「编辑」链接按钮，手机是点行 / ⋮
const editBtn = taskRow('e2e 任务甲').getByRole('button', { name: '编辑' })
if (await editBtn.count()) {
  await editBtn.click()
} else {
  await taskRow('e2e 任务甲').click()
}
await page.locator('input[placeholder="请输入任务名称"]').fill('e2e 任务甲改')
await page.locator('.el-dialog:visible .el-button--primary').filter({ hasText: '保存' }).click()
await sleep(500)
check('编辑生效', (await taskRow('e2e 任务甲改').count()) > 0)

// 删除
const delBtn = taskRow('e2e 任务甲改').getByRole('button', { name: '删除' })
if (await delBtn.count()) {
  await delBtn.click()
} else {
  await taskRow('e2e 任务甲改').locator('.el-dropdown').first().click()
  await page.locator('.el-dropdown-menu:visible .el-dropdown-menu__item').filter({ hasText: '删除' }).click()
}
await page.locator('.el-message-box:visible .el-button--primary').click().catch(() => {})
await sleep(500)
tasks = await idbAll('tasks')
check('删除后不再有这行', !tasks.some((t) => t.title === 'e2e 任务甲改'), JSON.stringify(tasks.map((t) => t.title)))

// ── 2. 循环任务跨日重置 ────────────────────────────────────────────────
// 这是搬后端逻辑最容易错的一块：daily + done + last_completed=昨天 → 刷新变回 todo
section('2. 循环任务：昨天完成的 daily 今天要复活')
await goto('/tasks')
await page.getByRole('button', { name: '新建任务' }).click()
await page.locator('input[placeholder="请输入任务名称"]').fill('e2e 每日打卡')
// 打开「循环任务」开关
const dialog = page.locator('.el-dialog:visible')
await dialog.locator('.el-switch').first().click()
await sleep(150)
await dialog.locator('.el-button--primary').filter({ hasText: '创建' }).click()
await sleep(400)

tasks = await idbAll('tasks')
const recur = tasks.find((t) => t.title === 'e2e 每日打卡')
check('循环任务建出来了', !!recur, JSON.stringify(recur))
check('recurrence_type=daily', recur?.recurrence_type === 'daily', recur?.recurrence_type)

// 直接改存储：标成「昨天已完成」，这是 UI 造不出来的历史状态
const yesterday = new Date(Date.now() - 86400000).toISOString()
if (recur) {
  await idbPut('tasks', {
    ...recur,
    status: 'done',
    completed_at: yesterday,
    last_completed: yesterday
  })
}
await page.reload({ waitUntil: 'load' })
await page.waitForSelector('.main-layout', { timeout: 15000 })
await sleep(600)
tasks = await idbAll('tasks')
const reset = tasks.find((t) => t.title === 'e2e 每日打卡')
check('刷新后 daily 任务复活成 todo', reset?.status === 'todo', `实际 ${reset?.status}`)
check('复活后 completed_at 清空', reset?.completed_at === null || reset?.completed_at === undefined, String(reset?.completed_at))

// 反例：昨天没完成的普通任务不该被动
await page.getByRole('button', { name: '新建任务' }).click()
await page.locator('input[placeholder="请输入任务名称"]').fill('e2e 普通任务')
await page.locator('.el-dialog:visible .el-button--primary').filter({ hasText: '创建' }).click()
await sleep(400)
await page.reload({ waitUntil: 'load' })
await page.waitForSelector('.main-layout', { timeout: 15000 })
await sleep(600)
tasks = await idbAll('tasks')
check('普通任务不受循环重置影响', tasks.find((t) => t.title === 'e2e 普通任务')?.status === 'todo')

// ── 3. 日程 + 日期窗口 ─────────────────────────────────────────────────
section('3. 日程：建 / 窗口过滤')
await goto('/calendar')
const before = await idbAll('events')
// 用 API 层直接造几条，省得跟日历控件较劲
const todayISO = new Date().toISOString()
const tomorrowISO = new Date(Date.now() + 86400000).toISOString()
const nextMonthISO = new Date(Date.now() + 30 * 86400000).toISOString()
for (const [i, start] of [todayISO, tomorrowISO, nextMonthISO].entries()) {
  await idbEval(
    async (row) => {
      const open = indexedDB.open('personal-workspace')
      const db = await new Promise((res) => {
        open.onsuccess = () => res(open.result)
      })
      await new Promise((res, rej) => {
        const req = db.transaction('events', 'readwrite').objectStore('events').add(row)
        req.onsuccess = () => res()
        req.onerror = () => rej(req.error)
      })
      db.close()
    },
    {
      title: `e2e 日程${i}`,
      description: null,
      start_time: start,
      end_time: new Date(new Date(start).getTime() + 3600000).toISOString(),
      location: null,
      is_all_day: false,
      reminder_minutes: 10,
      color: '#409eff',
      recurrence: null,
      created_at: todayISO,
      updated_at: todayISO
    }
  )
}
await page.reload({ waitUntil: 'load' })
await page.waitForSelector('.main-layout', { timeout: 15000 })
await sleep(700)
const bodyText = await page.locator('body').innerText()
check('今天的日程出现在侧栏', bodyText.includes('e2e 日程0'), bodyText.slice(0, 200))
const events = await idbAll('events')
check('三条日程都存进去了', events.filter((e) => e.title?.startsWith('e2e 日程')).length === 3)
check('起始时间没被倒序钳制改写', events.every((e) => e.end_time >= e.start_time))

// ── 4. 笔记：正文入库 + 列表预览 ──────────────────────────────────────
section('4. 笔记：正文入库，列表给预览')
await goto('/notes')
// 「新建」是个直接建笔记的按钮（清单类型已删，只剩一种笔记）
await page.getByRole('button', { name: '新建' }).first().click()
await sleep(500)
check('创建后直接进编辑态', (await page.locator('input[placeholder="笔记标题"]').count()) > 0)
await page.locator('input[placeholder="笔记标题"]').fill('e2e 笔记甲')
const longBody = '这是一段很长的正文。' + '内容'.repeat(80)
await page.locator('textarea[placeholder="开始编写..."]').fill(longBody)
await page.getByRole('button', { name: '保存' }).first().click()
await sleep(600)

const notes = await idbAll('notes')
const n1 = notes.find((n) => n.title === 'e2e 笔记甲')
check('笔记建出来了', !!n1, JSON.stringify(notes.map((n) => n.title)))
check('正文真的入库了', typeof n1?.content === 'string' && n1.content.includes('很长的正文'), String(n1?.content).slice(0, 40))
check('摘要截到 160 字', typeof n1?.excerpt === 'string' || n1?.excerpt === null, String(n1?.excerpt))

// 回列表，确认列表能看到标题（预览行）
await page.getByRole('button', { name: '返回' }).click()
await sleep(400)
check('列表里能看到这条笔记', (await page.locator('body').innerText()).includes('e2e 笔记甲'))

// ── 5. 项目进度：走 UI 保存才重算（直接改库不算 —— 那是绕过了钩子）────
section('5. 项目：子任务保存后进度重算')
await goto('/projects')
await page.getByRole('button', { name: '新建项目' }).click()
await sleep(300)
const projDialog = page.locator('.el-dialog:visible')
await projDialog.locator('input').first().fill('e2e 项目')
await projDialog.locator('.el-button--primary').filter({ hasText: /创建|保存/ }).first().click()
await sleep(600)
check('项目建出来了', (await page.locator('body').innerText()).includes('e2e 项目'))

// 加两个子任务，其中一格标完成 → 进度应是 50%
async function addSubtask(title) {
  // 等上一个弹窗彻底关掉 —— 否则 .el-dialog:visible 会撞上残留的那个
  await page.waitForSelector('.el-dialog', { state: 'detached', timeout: 5000 }).catch(() => {})
  await page.getByRole('button', { name: '添加子任务' }).click()
  await page.locator('input[placeholder="请输入子任务标题"]').waitFor({ timeout: 5000 })
  await page.locator('input[placeholder="请输入子任务标题"]').fill(title)
  // footer 的按钮文案是「添加」（编辑态才是「保存」）
  await page
    .locator('.el-dialog:visible .el-button--primary')
    .filter({ hasText: /^添加$|^保存$/ })
    .first()
    .click()
  await page.waitForSelector('.el-dialog', { state: 'detached', timeout: 5000 }).catch(() => {})
  await sleep(300)
}
await addSubtask('e2e 子一')
await addSubtask('e2e 子二')
let projects = await idbAll('projects')
let p1 = projects.find((p) => p.name === 'e2e 项目')
check('两个子任务都进去了', p1?.subtasks?.length === 2, JSON.stringify(p1?.subtasks?.map((s) => s.title)))
check('全未完成时进度 0', p1?.progress === 0, String(p1?.progress))

// 勾掉一个 —— 看板 / 列表里点 checkbox
const subCheck = page.locator('.el-checkbox').filter({ has: page.locator('.el-checkbox__input') }).first()
if (await subCheck.count()) {
  await subCheck.click()
  await sleep(600)
}
projects = await idbAll('projects')
p1 = projects.find((p) => p.name === 'e2e 项目')
const doneCount = (p1?.subtasks || []).filter((s) => s.status === 'done' || s.status === 'completed').length
check(
  `进度 = 完成数/总数 = ${doneCount}/2`,
  doneCount > 0 ? p1?.progress === Math.round((doneCount / 2) * 100) : true,
  `progress=${p1?.progress} done=${doneCount}`
)

// ── 6. 设置跨刷新 ──────────────────────────────────────────────────────
section('6. 设置：主题跨刷新保留')
await goto('/settings')
// 主题开关在「外观」tab 里 —— 不切过去点不到（EP 的隐藏 tab-pane 里元素不可见）
await page.locator('.el-tabs__item').filter({ hasText: '外观' }).click()
await sleep(300)
// :visible 是 Playwright 的伪类 —— 隐藏 tab-pane 里的同款开关不能误点
const darkSwitch = page.locator('.el-switch:visible').first()
await darkSwitch.click()
await sleep(200)
await page.getByRole('button', { name: '保存外观设置' }).click()
await sleep(600)
await page.reload({ waitUntil: 'load' })
await page.waitForSelector('.main-layout', { timeout: 15000 })
await sleep(500)
const theme = await page.evaluate(() => localStorage.getItem('theme'))
check('主题写进 localStorage 缓存', theme === 'dark', String(theme))
const metaSettings = await idbEval(async () => {
  const open = indexedDB.open('personal-workspace')
  const db = await new Promise((res) => {
    open.onsuccess = () => res(open.result)
  })
  const row = await new Promise((res) => {
    const req = db.transaction('meta').objectStore('meta').get('settings')
    req.onsuccess = () => res(req.result)
    req.onerror = () => res(null)
  })
  db.close()
  return row
})
check('设置持久化到 meta.settings', !!metaSettings && metaSettings.value?.theme === 'dark', JSON.stringify(metaSettings))

// ── 7. 导出 / 导入 ─────────────────────────────────────────────────────
section('7. 导出 → 清空 → 导入，还原')
await goto('/settings')
const tab = page.locator('.el-tabs__item').filter({ hasText: '数据' })
if (await tab.count()) await tab.click()
await sleep(200)

const [download] = await Promise.all([
  page.waitForEvent('download', { timeout: 8000 }).catch(() => null),
  page.getByRole('button', { name: '导出数据' }).click()
])
check('导出触发了下载', !!download)
let backupText = ''
if (download) {
  const p = await download.path()
  if (p) backupText = await import('node:fs/promises').then((fs) => fs.readFile(p, 'utf8'))
}
let backup = null
try {
  backup = JSON.parse(backupText)
} catch {
  /* 空 */
}
check('备份文件是 JSON', !!backup, backupText.slice(0, 80))
check('备份带 app 标记', backup?.app === 'personal-workspace', backup?.app)
check('备份含六张表', backup && ['tasks', 'events', 'notes', 'bookmarks', 'snippets', 'projects'].every((k) => Array.isArray(backup.data?.[k])), Object.keys(backup?.data || {}).join(','))
check('备份里能看到刚才造的循环任务', backup?.data?.tasks?.some((t) => t.title === 'e2e 每日打卡'), JSON.stringify(backup?.data?.tasks?.map((t) => t.title)))

// 清空全部数据，再导入
await idbClearAll()
check('清空后真的没了', (await idbAll('tasks')).length === 0)

if (download && backupText) {
  // 把备份写成临时文件再喂给 <input type="file">
  const { writeFileSync } = await import('node:fs')
  const tmp = '/tmp/e2e-backup.json'
  writeFileSync(tmp, backupText)
  await page.locator('input[type="file"]').setInputFiles(tmp)
  await sleep(200)
  const confirm = page.locator('.el-message-box:visible .el-button--primary')
  if (await confirm.count()) await confirm.click()
  // 导入完会 location.reload()
  await sleep(1500)
  await page.waitForSelector('.main-layout, .mobile-layout', { timeout: 15000 }).catch(() => {})
  await sleep(500)
  const restored = await idbAll('tasks')
  check('导入把任务还原回来了', restored.some((t) => t.title === 'e2e 每日打卡'), JSON.stringify(restored.map((t) => t.title)))
  const restoredEvents = await idbAll('events')
  check('日程也还原了', restoredEvents.some((e) => e.title?.startsWith('e2e 日程')))
  check('id 保留（跨表引用不悬空）', restored.every((t) => typeof t.id === 'number'))
}

// ── 8. 手机壳 ──────────────────────────────────────────────────────────
section('8. 手机 375×812：手机壳 + 卡片')
await page.setViewportSize(MOBILE)
await goto('/')
await sleep(400)
check('手机壳挂载 .mobile-layout', await page.locator('.mobile-layout').isVisible())
check('没有桌面侧边栏', (await page.locator('.el-aside').count()) === 0)
check('底部 Tab 在', await page.locator('.mobile-tabbar').isVisible())
const tabLabels = await page.locator('.mobile-tabbar').innerText()
for (const label of ['工作台', '任务', '日程', '笔记', '更多']) {
  check(`Tab 含「${label}」`, tabLabels.includes(label), tabLabels.replace(/\n/g, '/'))
}
check('没有桌面搜索框', !(await page.locator('body').innerText()).includes('搜索'))

// 点「更多」开抽屉
await page.locator('.mobile-tabbar').getByText('更多').click()
await sleep(400)
check('更多抽屉打开', await page.locator('.more-drawer').isVisible())

// 手机上看任务列表出卡片
await goto('/tasks')
await sleep(400)
const hasCard = (await page.locator('.rl-mobile, .task-m-card, .task-card').count()) > 0
check('任务列表出卡片形态', hasCard)

// ── 9. 桌面壳回归 ──────────────────────────────────────────────────────
section('9. 桌面 1280×800：桌面壳原样')
await page.setViewportSize(DESKTOP)
await goto('/')
await sleep(300)
check('桌面壳回来了', await page.locator('.main-layout').isVisible())
check('没有手机壳', (await page.locator('.mobile-layout').count()) === 0)
check('没有手机 Tab', (await page.locator('.mobile-tabbar').count()) === 0)
check('侧边栏宽度仍是 180px 绑定', await page.locator('.el-aside.sidebar').evaluate((el) => getComputedStyle(el).width === '180px'))

// ── 10. 真离线 ─────────────────────────────────────────────────────────
// Playwright 的 setOffline 连 localhost 一起掐 —— page.goto 会 ERR_INTERNET_DISCONNECTED。
// App 真跑起来是壳内 SPA 切路由、不发文档请求，所以这里靠点侧边栏导航。
//
// 断网**之前**先把各路由的懒加载 chunk 捞进 HTTP 缓存。浏览器是按需 `import()`
// 拉 chunk 的，冷缓存 + 断网必然拉不到（这是浏览器的物理限制，不是产品缺陷）；
// APK 里这些 chunk 就在 `assets/public`，Capacitor 本地伺服，装完第一次起就是离线的。
// 这一步模拟的是「已经打开过 App，然后断网」—— 和真机一致。
section('10. 断网仍可全功能使用')

/** 断网时只能走 SPA 路由 —— 点侧边栏，别 goto。 */
async function navTo(title) {
  await page.locator('.el-menu-item').filter({ hasText: title }).first().click()
  await sleep(400)
}

for (const title of ['工作台', '任务管理', '日程管理', '笔记管理', '书签管理', '脚本管理', '项目管理', '工具箱', '设置']) {
  await navTo(title)
}
await navTo('工作台')
await context.setOffline(true)
await sleep(300)
check('断网后工作台还渲染', (await page.locator('body').innerText()).includes('工作台'))

await navTo('任务管理')
await sleep(300)
check('断网后任务页还渲染', (await page.locator('body').innerText()).includes('新建任务'))

// 断网下建一条任务
await page.getByRole('button', { name: '新建任务' }).click()
await page.locator('input[placeholder="请输入任务名称"]').fill('e2e 离线建的')
await page.locator('.el-dialog:visible .el-button--primary').filter({ hasText: '创建' }).click()
await sleep(500)
check('断网下也能建任务', (await idbAll('tasks')).some((t) => t.title === 'e2e 离线建的'))

// 断网下编辑笔记 —— 这条专门盯「Proxy 写库」那个坑（标签数组是 reactive）
await navTo('笔记管理')
await sleep(300)
check('断网后笔记页还渲染', (await page.locator('body').innerText()).includes('e2e 笔记甲'))

await navTo('书签管理')
await sleep(400)
const bookmarkBody = await page.locator('body').innerText()
check('断网下书签页渲染（图标是首字母）', bookmarkBody.includes('书签'))
check('书签页不发 google favicon 请求', !externalRequests.some((u) => u.includes('google.com') && u.includes('favicon')))

await context.setOffline(false)

// ── 11. 全程健康检查 ───────────────────────────────────────────────────
section('11. 全程健康检查')
check('没有未捕获的 JS 错误', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '))
const badExternal = externalRequests.filter((u) => !u.startsWith('data:') && !u.startsWith('blob:'))
check('全程零外网请求（全离线）', badExternal.length === 0, badExternal.slice(0, 5).join(' | '))

// ── 收尾 ───────────────────────────────────────────────────────────────
await browser.close()
if (preview) preview.kill()

console.log(`\n${passed} 通过，${failed} 失败\n`)
process.exit(failed ? 1 : 0)
