/**
 * 合并内置课程 manifest 与已审核社区课程，并在进入题目时加载正文。
 */
import { getLessonById as getBuiltinLessonById, lessonMetas } from '@/lessons'
import { db } from '@/lib/adapters/db'
import type { DbAdapter } from '@/lib/adapters/types'
import { parse } from '@/lib/domain/lessonRef'
import type {
  CommunityLesson,
  LessonDifficulty,
  LessonMeta,
  NormalizedLesson,
  RawLesson,
  Variant,
} from '@/types'

interface CompatibleVariant {
  variant_id?: string
  id?: string
  language?: string
  style?: string
  difficulty?: string | number
  step?: number
  label?: string
  text?: string
  code?: string
  note?: string | null
}

interface CompatibleLesson {
  id: string
  title: string
  topic?: string
  category?: string
  difficulty?: string | number
  language?: string
  text?: string
  code?: string
  note?: string | null
  variants?: CompatibleVariant[]
}

interface LessonFilters {
  topic?: string
  category?: string
  language?: string
  search?: string
}

function normalizeDifficulty(value: unknown): LessonDifficulty {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return Math.max(1, Math.min(5, value)) as LessonDifficulty
  }
  return ({ beginner: 1, intermediate: 3, advanced: 5 }[String(value)] ?? 3) as LessonDifficulty
}

function normalizeVariant(
  raw: CompatibleVariant,
  lesson: CompatibleLesson,
  index: number,
): Variant {
  const language = raw.language ?? lesson.language ?? inferLanguage(lesson)
  const style: Variant['style'] = ['verbose', 'standard', 'concise'].includes(raw.style ?? '')
    ? (raw.style as Variant['style'])
    : 'standard'
  const step: Variant['step'] = [1, 2, 3].includes(raw.step ?? 0)
    ? (raw.step as Variant['step'])
    : 3
  return {
    variant_id: raw.variant_id ?? raw.id ?? `${lesson.id}-${language}-${style}-${index + 1}`,
    language,
    style,
    step,
    label: raw.label ?? `${language} · ${style}`,
    text: raw.text ?? raw.code ?? '',
    note: raw.note ?? lesson.note ?? '',
  }
}

/** 兼容旧 v1 数据与早期使用 category/code 的 v2 数据。 */
export function normalizeToV2(lesson: RawLesson | CompatibleLesson): NormalizedLesson {
  const rawVariants = Array.isArray(lesson.variants)
    ? lesson.variants
    : [
        {
          language: lesson.language,
          text: lesson.text,
          code: lesson.code,
          note: lesson.note,
        },
      ]

  return {
    id: lesson.id,
    title: lesson.title,
    topic: lesson.topic ?? lesson.category ?? 'other',
    difficulty: normalizeDifficulty(lesson.difficulty ?? rawVariants[0]?.difficulty),
    variants: rawVariants.map((variant, index) => normalizeVariant(variant, lesson, index)),
  }
}

function inferLanguage(lesson: CompatibleLesson) {
  const topic = lesson.topic ?? lesson.category ?? ''
  return topic === 'warmup' || topic === 'concepts' ? 'text' : 'python'
}

function toLessonMeta(lesson: NormalizedLesson): LessonMeta {
  return {
    id: lesson.id,
    title: lesson.title,
    topic: lesson.topic,
    difficulty: lesson.difficulty,
    variants: lesson.variants.map(({ text: _text, note: _note, ...variant }) => variant),
  }
}

export async function listLessons(filters: LessonFilters = {}, adapter: DbAdapter = db) {
  const { language, search } = filters
  const topic = filters.topic ?? filters.category
  let lessons: LessonMeta[] = [...lessonMetas]

  try {
    const communityResult = await adapter.queryCommunityLessons({ status: 'approved' })
    const communityData = communityResult?.data ?? communityResult ?? []
    if (Array.isArray(communityData)) {
      lessons = [
        ...lessons,
        ...communityData.map((lesson) => toLessonMeta(normalizeCommunityLesson(lesson))),
      ]
    }
  } catch {
    // Supabase 查询失败时仍可使用内置题库。
  }

  if (topic && topic !== 'all') lessons = lessons.filter((lesson) => lesson.topic === topic)
  if (language && language !== 'all') {
    lessons = lessons.filter((lesson) =>
      lesson.variants.some((variant) => variant.language === language),
    )
  }
  if (search) {
    const query = String(search).toLowerCase()
    lessons = lessons.filter((lesson) => lesson.title.toLowerCase().includes(query))
  }

  return lessons
}

export async function getLessonById(
  ref: string,
  adapter: DbAdapter = db,
): Promise<NormalizedLesson | null> {
  let parsed: { type: string; id: string }
  try {
    parsed = parse(ref)
  } catch {
    return null
  }

  if (parsed.type === 'builtin') {
    const lesson = await getBuiltinLessonById(parsed.id)
    return lesson ? normalizeToV2(lesson) : null
  }

  if (parsed.type === 'community') {
    try {
      const result = await adapter.queryCommunityLessons({ id: parsed.id, status: 'approved' })
      const data = result?.data ?? result
      const item = Array.isArray(data) ? data[0] : data
      return item ? normalizeCommunityLesson(item) : null
    } catch {
      return null
    }
  }

  return null
}

function normalizeCommunityLesson(lesson: CommunityLesson): NormalizedLesson {
  return normalizeToV2({
    id: `community:${lesson.id}`,
    title: lesson.title ?? '',
    topic: lesson.topic ?? 'community',
    difficulty: lesson.step ?? 3,
    variants: [
      {
        variant_id: `${lesson.id}-${lesson.language}-${lesson.style ?? 'standard'}`,
        language: lesson.language ?? 'python',
        style: lesson.style ?? 'standard',
        step: lesson.step ?? 3,
        text: lesson.text ?? lesson.code ?? '',
        note: lesson.note ?? '',
      },
    ],
  })
}
