/**
 * achievements.js — 成就解锁规则（纯函数）
 *
 * 不依赖 Supabase、Vue、DOM。
 */

/**
 * 成就元数据
 * @type {Array<{ id: string, name: string, description: string, condition: string }>}
 */
export const ACHIEVEMENTS = [
  {
    id: 'first-finish',
    name: '起步',
    description: '完成第一次练习',
    condition: '完成任意一次打字练习',
  },
  {
    id: 'wpm-100',
    name: '百键侠',
    description: 'WPM ≥ 100',
    condition: '单次练习达到 100 WPM 或以上',
  },
  {
    id: 'perfect-accuracy',
    name: '完美主义者',
    description: '准确率 100%',
    condition: '单次练习准确率达到 100%',
  },
  {
    id: 'streak-7',
    name: '七日不间断',
    description: '连续 7 天练习',
    condition: '连续打卡 7 天（UTC+8 时区）',
  },
  {
    id: 'multilingual',
    name: '多语言玩家',
    description: '练习过 ≥ 3 种不同语言',
    condition: '在历史记录中涵盖至少 3 种不同编程语言',
  },
  {
    id: 'practice-50',
    name: '勤练派',
    description: '累计完成 50 次练习',
    condition: '历史练习总次数达到 50 次',
  },
  {
    id: 'night-owl',
    name: '夜枭',
    description: '在深夜完成练习',
    condition: '在本地时间 00:00–04:00 完成一次练习',
  },
]

/**
 * 成就 id → 解锁判断函数的映射
 * @type {Record<string, (ctx: CheckContext) => boolean>}
 */
const UNLOCK_RULES = {
  'first-finish': ({ allResults }) => allResults.length === 1,
  'wpm-100': ({ latestResult }) => latestResult?.wpm >= 100,
  'perfect-accuracy': ({ latestResult }) => latestResult?.accuracy === 100,
  'streak-7': ({ currentStreak }) => currentStreak >= 7,
  multilingual: ({ allResults }) => {
    const langs = new Set(allResults.map((r) => r.language).filter(Boolean))
    return langs.size >= 3
  },
  'practice-50': ({ allResults }) => allResults.length >= 50,
  'night-owl': ({ latestResult }) => {
    if (!latestResult?.finishedAt) return false
    const hour = new Date(latestResult.finishedAt).getHours()
    return hour >= 0 && hour < 4
  },
}

/**
 * @typedef {Object} CheckContext
 * @property {Array<{ wpm: number, accuracy: number, language: string, finishedAt?: string }>} allResults
 * @property {{ wpm: number, accuracy: number, language: string, finishedAt?: string }} latestResult
 * @property {number} currentStreak
 * @property {string[]} alreadyUnlocked
 */

/**
 * 检查并返回本次新解锁的成就 id 数组
 * @param {CheckContext} ctx
 * @returns {string[]}
 */
export function checkNewUnlocks({ allResults, latestResult, currentStreak, alreadyUnlocked }) {
  const alreadySet = new Set(alreadyUnlocked ?? [])
  const newUnlocks = []

  for (const achievement of ACHIEVEMENTS) {
    if (alreadySet.has(achievement.id)) continue
    const rule = UNLOCK_RULES[achievement.id]
    if (!rule) continue
    try {
      if (rule({ allResults, latestResult, currentStreak, alreadyUnlocked })) {
        newUnlocks.push(achievement.id)
      }
    } catch {
      // 单个规则评估失败不影响其他规则
    }
  }

  return newUnlocks
}
