import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock adapters/db.js before importing the module under test
vi.mock('@/lib/adapters/db', () => ({
  queryCommunityLessons: vi.fn().mockResolvedValue({ data: [] }),
}))

// Mock src/lessons/index.js with v1 format lessons
vi.mock('@/lessons/index', () => {
  return {
    lessons: [
      // v1 格式（无 variants）— Python 课程
      {
        id: 'py-bfs-01',
        title: 'BFS 广度优先遍历（Python）',
        category: 'trees',
        difficulty: 2,
        text: 'from collections import deque\n\ndef bfs(root):\n    return []',
        note: 'BFS 使用队列',
      },
      // v1 格式 — Python 排序
      {
        id: 'py-quicksort-01',
        title: '快速排序（Python）',
        category: 'sorting',
        difficulty: 3,
        text: 'def quicksort(arr): return arr',
        note: '快速排序',
      },
      // v1 格式 — JavaScript 课程
      {
        id: 'js-array-methods-01',
        title: 'JavaScript 数组常用方法',
        category: 'js',
        difficulty: 2,
        language: 'javascript',
        text: 'const doubled = numbers.map(n => n * 2)',
        note: 'map filter reduce',
      },
      // warmup 课程（无 language，应推断为 text）
      {
        id: 'warmup-home-row-01',
        title: 'Home Row 基础练习',
        category: 'warmup',
        difficulty: 1,
        text: 'asdf jkl;',
        note: 'Home Row',
      },
    ],
  }
})

import * as db from '@/lib/adapters/db'
import { getLessonById, listLessons } from '@/lib/application/lessons'

beforeEach(() => {
  vi.clearAllMocks()
  db.queryCommunityLessons.mockResolvedValue({ data: [] })
})

describe('listLessons', () => {
  it('returns all builtin lessons when no filter', async () => {
    const lessons = await listLessons()
    expect(lessons.length).toBeGreaterThanOrEqual(4)
  })

  it('v1 format (no variants) is auto-wrapped to v2 with variants[]', async () => {
    const lessons = await listLessons()
    for (const lesson of lessons) {
      expect(Array.isArray(lesson.variants)).toBe(true)
      expect(lesson.variants.length).toBeGreaterThan(0)
    }
  })

  it('each variant has required fields', async () => {
    const lessons = await listLessons()
    for (const lesson of lessons) {
      for (const v of lesson.variants) {
        expect(v).toHaveProperty('variant_id')
        expect(v).toHaveProperty('language')
        expect(v).toHaveProperty('style')
        expect(v).toHaveProperty('code')
      }
    }
  })

  it('listLessons({ language: "javascript" }) returns only lessons with JS variants', async () => {
    const lessons = await listLessons({ language: 'javascript' })
    expect(lessons.length).toBeGreaterThan(0)
    for (const lesson of lessons) {
      const hasJS = lesson.variants.some((v) => v.language === 'javascript')
      expect(hasJS).toBe(true)
    }
  })

  it('listLessons({ language: "javascript" }) excludes Python-only lessons', async () => {
    const lessons = await listLessons({ language: 'javascript' })
    const ids = lessons.map((l) => l.id)
    // py-bfs-01 has no language field, defaults to python → should be excluded
    expect(ids).not.toContain('py-bfs-01')
  })

  it('listLessons({ language: "python" }) includes python lessons', async () => {
    const lessons = await listLessons({ language: 'python' })
    expect(lessons.some((l) => l.id === 'py-bfs-01')).toBe(true)
  })

  it('warmup lessons without language field infer language as "text"', async () => {
    const lessons = await listLessons()
    const warmup = lessons.find((l) => l.id === 'warmup-home-row-01')
    expect(warmup).toBeDefined()
    expect(warmup.variants[0].language).toBe('text')
  })

  it('gracefully degrades when community query fails', async () => {
    db.queryCommunityLessons.mockRejectedValueOnce(new Error('Supabase down'))
    // should not throw
    const lessons = await listLessons()
    // still returns builtin lessons
    expect(lessons.length).toBeGreaterThan(0)
  })
})

describe('getLessonById', () => {
  it('getLessonById("builtin:py-bfs-01") returns lesson with variants[]', async () => {
    const lesson = await getLessonById('builtin:py-bfs-01')
    expect(lesson).not.toBeNull()
    expect(lesson.id).toBe('py-bfs-01')
    expect(Array.isArray(lesson.variants)).toBe(true)
    expect(lesson.variants.length).toBeGreaterThan(0)
  })

  it('getLessonById("builtin:py-quicksort-01") returns lesson', async () => {
    const lesson = await getLessonById('builtin:py-quicksort-01')
    expect(lesson).not.toBeNull()
    expect(lesson.id).toBe('py-quicksort-01')
    expect(Array.isArray(lesson.variants)).toBe(true)
  })

  it('getLessonById with non-existent builtin id returns null', async () => {
    const lesson = await getLessonById('builtin:does-not-exist')
    expect(lesson).toBeNull()
  })

  it('community:<uuid> not found → returns null (no throw)', async () => {
    db.queryCommunityLessons.mockResolvedValueOnce({ data: [] })
    const lesson = await getLessonById('community:00000000-0000-0000-0000-000000000000')
    expect(lesson).toBeNull()
  })

  it('community db query failure → returns null (no throw)', async () => {
    db.queryCommunityLessons.mockRejectedValueOnce(new Error('DB error'))
    const lesson = await getLessonById('community:some-uuid')
    expect(lesson).toBeNull()
  })

  it('invalid ref format returns null (no throw)', async () => {
    const lesson = await getLessonById('invalid-format')
    expect(lesson).toBeNull()
  })
})
