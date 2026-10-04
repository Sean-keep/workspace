/**
 * 日程提醒调度器 —— **App 前台到点弹**。
 *
 * 裸 HTTP 内网拿不到 secure context：`window.Notification` / Service Worker /
 * Web Push 全都不存在，所以「关掉 App 也能收」这件事做不到（已在 README 说明）。
 * 这里做的是：App 开着时到点弹 ElNotification + 两声提示音 + 点一下「稍后 10 分钟」。
 *
 * 三个容易做错的地方（照抄，别自己想）：
 *
 * ① **可靠路径是 `visibilitychange`，不是 `setTimeout`。** 手机浏览器把后台定时器
 *    节流到几乎没有，长 `setTimeout` 会迟到或被合并。所以：
 *      - `setTimeout` 链**单次最多 5 分钟**，到点重排
 *      - `setInterval` 60s 只当兜底（后台 tab 一样会被冻）
 *      - `visibilitychange` / `focus` → `catchUp()` 才是真正扛事的恢复路径；
 *        `catchUp()` 是「`Date.now()` 对着排程表跑一遍」的纯函数，多晚跑都正确
 *
 * ② **`catchUp()` 开头就要判断 `document.visibilityState !== 'visible'` 就返回** ——
 *    这就是「前台到点弹」的实现。后台/锁屏一律不弹。
 *
 * ③ **`installAudioUnlock()` 必须在用户一进来就调。** Android Chrome 的
 *    `AudioContext` 初始是 `suspended`，不在一次用户手势里 `resume()`，
 *    提醒就**永远没声音**。监听器刻意不摘（iOS 上每次手势后都可能再次 suspend）。
 *
 * 数据源用 `GET /events`（带 `start_date`/`end_date`），**不要**用
 * `/dashboard/upcoming-events` —— 后者手工挑了 6 个字段，漏了 `reminder_minutes`。
 *
 * 已触发的 key 存 `sessionStorage`：按标签页会话语义正确（同一台设备重开要重提醒），
 * 别的设备也照样提醒。
 */
import { ElNotification } from 'element-plus'
import dayjs from 'dayjs'
import { db } from '@/db'
import type { Event } from '@/types/models'

/** 单次 setTimeout 上限。到点重排，不做「一发 8 小时的定时器」。 */
const MAX_TIMEOUT_MS = 5 * 60_000
/** 过了触发点 5 分钟就丢弃 —— 不弹一堆过期的。 */
const STALE_MS = 5 * 60_000
/** 兜底轮询。 */
const POLL_MS = 60_000
/** 重拉日程。 */
const RELOAD_MS = 5 * 60_000
/** 稍后。 */
const SNOOZE_MS = 10 * 60_000
/** 只排未来 24 小时内的触发点；日程本身往前多拉一点，好覆盖「提前 1 天」这类大 lead。 */
const HORIZON_MS = 24 * 60 * 60_000
const FETCH_DAYS = 2

const FIRED_KEY = 'pw.reminders.fired'

export interface Reminder {
  /** `${eventId}:${triggerAt}`，snooze 会另起一个 key */
  key: string
  eventId: number
  title: string
  startAt: number
  triggerAt: number
  isAllDay: boolean
}

// ── 提示音（WebAudio 振荡器，不引音频资产）───────────────────────────
let audioCtx: AudioContext | null = null
let unlockInstalled = false

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor: typeof AudioContext | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!audioCtx) audioCtx = new Ctor()
  return audioCtx
}

/**
 * 在**第一次用户手势**里 resume AudioContext。必须在页面一进来就调，
 * 否则 Android Chrome 的 suspended 上下文会让提醒永远没声音。
 */
export function installAudioUnlock(): void {
  if (unlockInstalled || typeof window === 'undefined') return
  unlockInstalled = true
  const unlock = () => {
    const ctx = getCtx()
    if (ctx && ctx.state === 'suspended') void ctx.resume()
  }
  // 刻意不摘监听：iOS 上每次手势后都可能再次 suspend，留着很便宜
  window.addEventListener('pointerdown', unlock)
  window.addEventListener('touchend', unlock)
  window.addEventListener('keydown', unlock)
}

function playTone(ctx: AudioContext): void {
  const now = ctx.currentTime
  // 两个音：880Hz → 660Hz
  for (const [freq, offset] of [[880, 0], [660, 0.18]] as const) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, now + offset)
    gain.gain.exponentialRampToValueAtTime(0.25, now + offset + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.16)
    osc.connect(gain).connect(ctx.destination)
    osc.start(now + offset)
    osc.stop(now + offset + 0.2)
  }
}

function beep(): void {
  const ctx = getCtx()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume().then(() => playTone(ctx))
  else playTone(ctx)
}

// ── 已触发集合（sessionStorage）─────────────────────────────────────
function loadFired(): Set<string> {
  try {
    const raw = sessionStorage.getItem(FIRED_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function saveFired(fired: Set<string>): void {
  try {
    // 只留最近的 200 条，别让 sessionStorage 无界增长
    const list = [...fired].slice(-200)
    sessionStorage.setItem(FIRED_KEY, JSON.stringify(list))
  } catch {
    /* 隐私模式下可能写不进去 —— 少一道去重而已 */
  }
}

// ── 触发点计算 ─────────────────────────────────────────────────────
function triggerAtOf(event: Event): number | null {
  // reminder_minutes <= 0 = 不提醒
  if (!(event.reminder_minutes > 0)) return null
  const start = dayjs(event.start_time)
  if (event.is_all_day) {
    // 全天事件在当天 09:00 触发（本地时间）
    return start.startOf('day').hour(9).valueOf()
  }
  return start.subtract(event.reminder_minutes, 'minute').valueOf()
}

export function remindersOf(events: Event[]): Reminder[] {
  const out: Reminder[] = []
  for (const e of events) {
    const triggerAt = triggerAtOf(e)
    if (triggerAt === null) continue
    out.push({
      key: `${e.id}:${triggerAt}`,
      eventId: e.id,
      title: e.title,
      startAt: dayjs(e.start_time).valueOf(),
      triggerAt,
      isAllDay: e.is_all_day
    })
  }
  return out
}

// ── 调度 ───────────────────────────────────────────────────────────
let schedule: Reminder[] = []
const snoozes: Reminder[] = []
const fired = loadFired()
let timeoutHandle: ReturnType<typeof setTimeout> | null = null
let pollHandle: ReturnType<typeof setInterval> | null = null
let reloadHandle: ReturnType<typeof setInterval> | null = null
let started = false

function all(): Reminder[] {
  return schedule.concat(snoozes)
}

function notify(r: Reminder): void {
  const startText = r.isAllDay
    ? '全天'
    : dayjs(r.startAt).format('MM-DD HH:mm')
  const n = ElNotification({
    title: '日程提醒',
    message: `${r.title} · ${startText}`,
    type: 'warning',
    // 不自动关：手机上 8 秒很容易错过
    duration: 0,
    showClose: true,
    onClick: () => {
      snooze(r)
      n.close()
    }
  })
  beep()
}

function snooze(r: Reminder): void {
  const triggerAt = Date.now() + SNOOZE_MS
  const copy: Reminder = { ...r, key: `${r.eventId}:snooze:${triggerAt}`, triggerAt }
  snoozes.push(copy)
  armTimeout()
}

/**
 * 对着排程表跑一遍。纯函数式的正确性：多晚跑都对。
 * **必须**在可见时才弹 —— 这就是「前台到点弹」。
 */
function catchUp(): void {
  if (typeof document === 'undefined' || document.visibilityState !== 'visible') return
  const now = Date.now()
  for (const r of all()) {
    if (r.triggerAt > now) continue
    if (now - r.triggerAt > STALE_MS) {
      // 过期太久：记成已触发，免得下次又排到它
      fired.add(r.key)
      continue
    }
    if (fired.has(r.key)) continue
    fired.add(r.key)
    notify(r)
  }
  saveFired(fired)
}

function nextTriggerAt(): number | null {
  const now = Date.now()
  let min: number | null = null
  for (const r of all()) {
    if (r.triggerAt <= now || fired.has(r.key)) continue
    if (min === null || r.triggerAt < min) min = r.triggerAt
  }
  return min
}

function armTimeout(): void {
  if (timeoutHandle !== null) {
    clearTimeout(timeoutHandle)
    timeoutHandle = null
  }
  const next = nextTriggerAt()
  if (next === null) return
  // 单次最多 5 分钟，到点重排 —— 后台定时器被冻住时，靠 visibilitychange 补
  const delay = Math.min(Math.max(next - Date.now(), 0), MAX_TIMEOUT_MS)
  timeoutHandle = setTimeout(() => {
    timeoutHandle = null
    catchUp()
    armTimeout()
  }, delay)
}

async function reload(): Promise<void> {
  try {
    // 数据源是 events 表本身 —— dashboard 的「近期日程」漏了 reminder_minutes。
    const start = dayjs().subtract(1, 'hour').valueOf()
    const end = dayjs().add(FETCH_DAYS, 'day').valueOf()
    const rows = await db.events.toArray()
    const window = rows.filter((e) => {
      const s = new Date(e.start_time).getTime()
      return s >= start && s <= end
    })
    const now = Date.now()
    schedule = remindersOf(window).filter(r => r.triggerAt <= now + HORIZON_MS)
  } catch {
    // 读不到就沿用上一份排程
    return
  }
  armTimeout()
}

function onVisibility(): void {
  if (typeof document === 'undefined' || document.visibilityState !== 'visible') return
  // 后台回来：先补弹（纯函数，多晚都对），再重拉一次日程
  catchUp()
  void reload()
}

/** 启动。幂等。必须在用户一进来就调（里面会装音频解锁）。 */
export function startReminderScheduler(): void {
  if (started || typeof window === 'undefined') return
  started = true
  installAudioUnlock()
  void reload()
  pollHandle = setInterval(catchUp, POLL_MS)
  reloadHandle = setInterval(() => void reload(), RELOAD_MS)
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('focus', onVisibility)
  armTimeout()
}

export function stopReminderScheduler(): void {
  if (!started) return
  started = false
  if (timeoutHandle !== null) clearTimeout(timeoutHandle)
  if (pollHandle !== null) clearInterval(pollHandle)
  if (reloadHandle !== null) clearInterval(reloadHandle)
  timeoutHandle = pollHandle = reloadHandle = null
  if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisibility)
  if (typeof window !== 'undefined') window.removeEventListener('focus', onVisibility)
}

/** 增删改日程后立刻重排。 */
export function refreshReminders(): void {
  if (started) void reload()
}
