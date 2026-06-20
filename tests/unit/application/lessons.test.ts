import { describe, expect, it } from 'vitest'
import { MemoryAdapter } from '@/lib/adapters/MemoryAdapter'
import { getLessonById, listLessons, normalizeToV2 } from '@/lib/application/lessons'

const remoteLesson = {
  id: 'remote-only-01',
  title: 'Remote only',
  topic: 'basics',
  difficulty: 1 as const,
  variants: [
    {
      variant_id: 'remote-only-01-python-standard',
      language: 'python',
      style: 'standard' as const,
      step: 3 as const,
      label: 'Python · 标准实现',
      text: 'print("remote")',
      note: 'remote note',
    },
  ],
}

describe('listLessons', () => {
  it('returns canonical builtin metadata without lesson bodies', async () => {
    const lessons = await listLessons({}, new MemoryAdapter())
    expect(lessons).toHaveLength(40)
    expect([...new Set(lessons.map((lesson) => lesson.topic))]).toEqual(
      expect.arrayContaining([
        'basics',
        'arrays',
        'strings',
        'searching',
        'stack-queue',
        'recursion',
      ]),
    )
    expect(lessons[0]).toHaveProperty('topic')
    expect(lessons[0]).not.toHaveProperty('category')
    expect(lessons[0].variants[0]).toHaveProperty('variant_id')
    expect(lessons[0].variants[0]).not.toHaveProperty('text')
    expect(lessons[0].variants[0]).not.toHaveProperty('code')
  })
  it('includes approved community lessons and excludes pending/rejected', async () => {
    const adapter = new MemoryAdapter({
      communityLessons: [
        {
          id: 'a',
          title: 'Approved',
          language: 'python',
          text: 'print(1)',
          status: 'approved',
          topic: 'graph',
        },
        { id: 'p', title: 'Pending', language: 'python', text: 'print(2)', status: 'pending' },
        { id: 'r', title: 'Rejected', language: 'python', text: 'print(3)', status: 'rejected' },
      ],
    })
    const lessons = await listLessons({}, adapter)
    expect(lessons.some((l) => l.id === 'community:a')).toBe(true)
    expect(lessons.some((l) => l.id === 'community:p')).toBe(false)
    expect(lessons.some((l) => l.id === 'community:r')).toBe(false)
  })
  it('uses database metadata as the builtin source when available', async () => {
    const lessons = await listLessons({}, new MemoryAdapter({ builtinLessons: [remoteLesson] }))
    expect(lessons).toHaveLength(1)
    expect(lessons[0].id).toBe('remote-only-01')
    expect(lessons[0].variants[0]).not.toHaveProperty('text')
  })
  it('supports combined search/category/language filtering', async () => {
    const lessons = await listLessons(
      { search: 'BFS', category: 'graph', language: 'python' },
      new MemoryAdapter(),
    )
    expect(
      lessons.every(
        (l) =>
          l.title.toLowerCase().includes('bfs') && l.variants.some((v) => v.language === 'python'),
      ),
    ).toBe(true)
  })
})

describe('getLessonById', () => {
  it('loads builtin lesson refs', async () => {
    const lesson = await getLessonById('builtin:py-bfs-01', new MemoryAdapter())
    expect(lesson?.id).toBe('py-bfs-01')
    expect(lesson?.topic).toBe('trees')
    expect(lesson?.variants[0].text).toContain('def bfs')
    expect(lesson?.variants[0]).not.toHaveProperty('code')
  })
  it('loads a database-only builtin lesson before the local fallback', async () => {
    const lesson = await getLessonById(
      'builtin:remote-only-01',
      new MemoryAdapter({ builtinLessons: [remoteLesson] }),
    )
    expect(lesson?.variants[0].text).toBe('print("remote")')
  })
  it('loads approved community refs', async () => {
    const adapter = new MemoryAdapter({
      communityLessons: [
        { id: 'c1', title: 'C', language: 'python', text: 'x', status: 'approved' },
      ],
    })
    const lesson = await getLessonById('community:c1', adapter)
    expect(lesson?.id).toBe('community:c1')
  })
})

describe('normalizeToV2', () => {
  it('keeps legacy category/code lessons readable', () => {
    const lesson = normalizeToV2({
      id: 'legacy',
      title: 'Legacy',
      category: 'sorting',
      difficulty: 'beginner',
      variants: [{ language: 'python', code: 'print(1)', difficulty: 'beginner' }],
    })

    expect(lesson.topic).toBe('sorting')
    expect(lesson.difficulty).toBe(1)
    expect(lesson.variants[0].text).toBe('print(1)')
  })
})
