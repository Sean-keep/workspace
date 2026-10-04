/**
 * 把要落库的值洗成纯对象。
 *
 * Dexie 走 structured clone，**存不了 Proxy**。Vue 的 `ref()` / `reactive()` 包出来
 * 的就是 Proxy —— 比如 `selectedProject.value.subtasks` 或
 * `settings.taskStatuses.value` 直接塞进 Dexie，浏览器抛 DataCloneError。而
 * `useResourceList` 的 catch 会把这个错吃掉，于是 UI 显示「已保存」、库里一个字没动。
 * 子任务、标签这些嵌套数组最常踩。
 *
 * 落库的都是 JSON 形状（备份格式本身就是这么定义的），走一趟 JSON 最干净：
 * 丢掉 `undefined` 正好等价于「这个字段不设」。
 */
export function toPlain<T>(value: T): T {
  return value === undefined ? value : JSON.parse(JSON.stringify(value))
}
