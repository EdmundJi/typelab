/**
 * achievementEvaluator.js — 触发成就解锁流程（写 db）
 *
 * 职责：
 * - 调用 domain/achievements.js 的 checkNewUnlocks 计算新解锁 id
 * - 对每个新 id 调用 db.unlockAchievement 写入数据库
 * - PK 冲突（重复插入）→ 静默忽略
 * - 返回实际解锁的成就 id 数组
 */

import * as db from '@/lib/adapters/db'
import { checkNewUnlocks } from '@/lib/domain/achievements'

/**
 * 评估并解锁新成就
 * @param {string} userId
 * @param {Object} latestResult — 本次成绩 { wpm, accuracy, language, finishedAt? }
 * @param {Object[]} allResults — 用户所有历史成绩
 * @param {number} currentStreak — 当前连续天数
 * @returns {Promise<string[]>} 本次实际解锁的成就 id 列表
 */
export async function evaluateAndUnlock(userId, latestResult, allResults, currentStreak) {
  let alreadyUnlocked = []

  try {
    alreadyUnlocked = await db.listUserAchievements(userId)
  } catch (err) {
    console.warn('[achievementEvaluator] 获取已解锁成就失败，降级为空列表', err)
  }

  const newUnlocks = checkNewUnlocks({
    allResults,
    latestResult,
    currentStreak,
    alreadyUnlocked,
  })

  const actuallyUnlocked = []

  for (const id of newUnlocks) {
    try {
      await db.unlockAchievement(userId, id)
      actuallyUnlocked.push(id)
    } catch (err) {
      // PK 冲突或其他错误 → 静默忽略，不计入返回值
      console.warn(`[achievementEvaluator] 解锁 ${id} 失败（已忽略）`, err)
    }
  }

  return actuallyUnlocked
}
