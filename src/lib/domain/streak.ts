/**
 * streak.js — Streak 计算（纯函数）
 *
 * 日期归属按 UTC+8 换算（固定偏移 +8h）。
 */

const UTC8_OFFSET_MS = 8 * 60 * 60 * 1000

/**
 * 将 UTC 时间戳转为 UTC+8 的 'YYYY-MM-DD' 字符串
 * @param {string} isoTimestamp
 * @returns {string | null}
 */
function toUTC8DateKey(isoTimestamp) {
  const ms = Date.parse(isoTimestamp)
  if (Number.isNaN(ms)) return null
  const utc8Date = new Date(ms + UTC8_OFFSET_MS)
  const y = utc8Date.getUTCFullYear()
  const m = String(utc8Date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(utc8Date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * 将 'YYYY-MM-DD' 字符串解析为整数天数（相对于某个基准）以便做连续性比较
 * 这里直接用 Date.UTC 得到毫秒数再除以一天毫秒数
 * @param {string} dateKey 'YYYY-MM-DD'
 * @returns {number}
 */
function dateKeyToDayIndex(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / (24 * 60 * 60 * 1000))
}

/**
 * 计算 Streak 指标
 * @param {Array<{ created_at: string } | string>} timestamps
 *   可以传对象数组（含 created_at 字段）或直接传 ISO 字符串数组
 * @returns {{ currentStreak: number, bestStreak: number, calendarData: Record<string, number> }}
 */
export function calcStreak(timestamps) {
  if (!Array.isArray(timestamps) || timestamps.length === 0) {
    return { currentStreak: 0, bestStreak: 0, calendarData: {} }
  }

  // 支持对象（含 created_at）或直接字符串
  const rawStrings = timestamps.map((t) => (typeof t === 'string' ? t : t?.created_at))

  // 构建 calendarData，跳过无效时间戳
  const calendarData = {}
  for (const ts of rawStrings) {
    const key = toUTC8DateKey(ts)
    if (key === null) continue
    calendarData[key] = (calendarData[key] ?? 0) + 1
  }

  const activeDays = Object.keys(calendarData).sort() // 'YYYY-MM-DD' 字典排序即时间排序

  if (activeDays.length === 0) {
    return { currentStreak: 0, bestStreak: 0, calendarData: {} }
  }

  // 计算今天的 UTC+8 日期键
  const todayKey = toUTC8DateKey(new Date().toISOString())
  const todayIndex = dateKeyToDayIndex(todayKey)
  const yesterdayIndex = todayIndex - 1

  // 从最新的有记录日期往前数连续天数（currentStreak）
  // 允许今天或昨天有记录才算当前 streak 活跃
  let currentStreak = 0
  const lastDayIndex = dateKeyToDayIndex(activeDays[activeDays.length - 1])

  if (lastDayIndex === todayIndex || lastDayIndex === yesterdayIndex) {
    // 从最后有记录的一天往前遍历
    currentStreak = 1
    let prev = lastDayIndex
    for (let i = activeDays.length - 2; i >= 0; i--) {
      const cur = dateKeyToDayIndex(activeDays[i])
      if (prev - cur === 1) {
        currentStreak++
        prev = cur
      } else {
        break
      }
    }
  }

  // 计算 bestStreak（遍历所有有记录天数）
  let bestStreak = 0
  let runStreak = 1
  for (let i = 1; i < activeDays.length; i++) {
    const prevIndex = dateKeyToDayIndex(activeDays[i - 1])
    const curIndex = dateKeyToDayIndex(activeDays[i])
    if (curIndex - prevIndex === 1) {
      runStreak++
    } else {
      bestStreak = Math.max(bestStreak, runStreak)
      runStreak = 1
    }
  }
  bestStreak = Math.max(bestStreak, runStreak)

  // bestStreak 不应小于 currentStreak
  bestStreak = Math.max(bestStreak, currentStreak)

  return { currentStreak, bestStreak, calendarData }
}
