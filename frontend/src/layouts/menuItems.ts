/**
 * 桌面侧边栏 / 手机底部 Tab / 「更多」抽屉三处共用的导航配置。
 *
 * 抽出来的目的就是让三处永远一致：加一个页面只改这一处。手机 Tab 上的短标签
 * 走 `shortTitle`，`tab: true` 的才是底部 Tab，其余进「更多」。
 *
 * `icon` 是 `@element-plus/icons-vue` 的导出名，且必须在 `main.ts` 的
 * `globalIcons` 里注册过 —— 三处都用 `<component :is="item.icon" />` 渲染。
 */
export interface MenuItem {
  path: string
  title: string
  icon: string
  /** true = 手机底部 Tab */
  tab?: boolean
  /** 手机 Tab 上的短标签，缺省用 `title` */
  shortTitle?: string
}

export const menuItems: MenuItem[] = [
  // 「工作台」标题本身已经够短，Tab 上不用再起 shortTitle
  { path: '/', title: '工作台', icon: 'HomeFilled', tab: true },
  { path: '/tasks', title: '任务管理', icon: 'List', tab: true, shortTitle: '任务' },
  { path: '/calendar', title: '日程管理', icon: 'Calendar', tab: true, shortTitle: '日程' },
  { path: '/notes', title: '笔记管理', icon: 'Notebook', tab: true, shortTitle: '笔记' },
  // 书签退到「更多」抽屉 —— 那里展示的是 title，shortTitle 不再被读到
  { path: '/bookmarks', title: '书签管理', icon: 'Link' },
  { path: '/scripts', title: '脚本管理', icon: 'Document' },
  { path: '/projects', title: '项目管理', icon: 'Folder' },
  { path: '/tools', title: '工具箱', icon: 'Tools' },
  { path: '/settings', title: '设置', icon: 'Setting' }
]

/** 手机底部 Tab 的四项 */
export const tabItems: MenuItem[] = menuItems.filter((i) => i.tab)

/** 「更多」抽屉里的其余五项 */
export const moreItems: MenuItem[] = menuItems.filter((i) => !i.tab)
