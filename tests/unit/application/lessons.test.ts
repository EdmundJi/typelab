import { describe, expect, it } from 'vitest'
import { MemoryAdapter } from '@/lib/adapters/MemoryAdapter'
import { getLessonById, listLessons, normalizeToV2 } from '@/lib/application/lessons'

describe('listLessons', () => {
  it('returns canonical builtin metadata without lesson bodies', async () => {
    const lessons = await listLessons({}, new MemoryAdapter())
    expect(lessons.length).toBeGreaterThan(0)
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
