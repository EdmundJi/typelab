/**
 * lessons.js — LessonLoader
 *
 * 负责：
 * - 加载内置 JSON 课程（src/lessons/index.js）
 * - 加载已审核社区课程（通过 adapters/db.js）
 * - 将 v1 旧格式自动标准化为 v2 多变体格式
 * - 按 lesson_ref 格式（builtin:<id> / community:<uuid>）解析单条课程
 * - 提供按 language 筛选的列表接口
 *
 * 不直接导入 adapters/supabase.js，只使用 adapters/db.js。
 */

import { lessons as builtinLessons } from '@/lessons/index'
import * as db from '@/lib/adapters/db'
import { parse } from '@/lib/domain/lessonRef'

/**
 * 将 v1 格式（无 variants）标准化为 v2 多变体格式
 * @param {Object} lesson
 * @returns {Object} NormalizedLesson（含 variants[]）
 */
function normalizeToV2(lesson) {
  // 已是 v2 格式
  if (Array.isArray(lesson.variants)) {
    return lesson
  }

  // v1 格式：推断语言
  const language = lesson.language ?? inferLanguage(lesson)

  const variant = {
    variant_id: `${lesson.id}-${language}-standard`,
    language,
    style: 'standard',
    difficulty: lesson.difficulty ?? 'intermediate',
    code: lesson.text ?? lesson.code ?? '',
    note: lesson.note,
  }

  const { text, code, language: _lang, note: _note, ...rest } = lesson

  return {
    ...rest,
    variants: [variant],
  }
}

/**
 * 当 v1 课程缺少 language 字段时，按 category 推断语言
 * @param {Object} lesson
 * @returns {string}
 */
function inferLanguage(lesson) {
  const cat = lesson.category ?? ''
  if (cat === 'warmup' || cat === 'concepts') return 'text'
  return 'python'
}

/**
 * 列出课程元数据（含 variants 列表）
 * @param {{ language?: string }} [filters]
 * @returns {Promise<Object[]>}
 */
export async function listLessons(filters = {}) {
  const { language } = filters

  // 加载内置课程（已标准化）
  let lessons = builtinLessons.map(normalizeToV2)

  // 尝试加载社区课程（降级处理）
  try {
    const communityResult = await db.queryCommunityLessons({ status: 'approved' })
    const communityData = communityResult?.data ?? communityResult ?? []
    if (Array.isArray(communityData)) {
      const communityLessons = communityData.map((cl) => normalizeCommunityLesson(cl))
      lessons = [...lessons, ...communityLessons]
    }
  } catch {
    // Supabase 查询失败 → 降级为纯内置，不 throw
  }

  // 按语言筛选
  if (language) {
    lessons = lessons.filter((lesson) => lesson.variants.some((v) => v.language === language))
  }

  return lessons
}

/**
 * 按 lesson_ref 获取单条课程
 * @param {string} ref — 'builtin:<id>' 或 'community:<uuid>'
 * @returns {Promise<Object|null>}
 */
export async function getLessonById(ref) {
  let parsed
  try {
    parsed = parse(ref)
  } catch {
    return null
  }

  if (parsed.type === 'builtin') {
    const lesson = builtinLessons.find((l) => l.id === parsed.id)
    if (!lesson) return null
    return normalizeToV2(lesson)
  }

  if (parsed.type === 'community') {
    try {
      const result = await db.queryCommunityLessons({ id: parsed.id, status: 'approved' })
      const data = result?.data ?? result
      const item = Array.isArray(data) ? data[0] : data
      if (!item) return null
      return normalizeCommunityLesson(item)
    } catch {
      return null
    }
  }

  return null
}

/**
 * 将社区课程记录转换为 NormalizedLesson 格式
 * @param {Object} cl — community_lessons 行
 * @returns {Object}
 */
function normalizeCommunityLesson(cl) {
  const variant = {
    variant_id: `${cl.id}-${cl.language}-${cl.style ?? 'standard'}`,
    language: cl.language ?? 'python',
    style: cl.style ?? 'standard',
    difficulty: cl.step ? `step${cl.step}` : 'intermediate',
    code: cl.text ?? '',
    note: cl.note,
  }

  return {
    id: `community:${cl.id}`,
    title: cl.title ?? '',
    category: cl.topic,
    variants: [variant],
  }
}
