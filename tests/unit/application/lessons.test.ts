import { describe, expect, it } from 'vitest'
import { MemoryAdapter } from '@/lib/adapters/MemoryAdapter'
import { getLessonById, listLessons } from '@/lib/application/lessons'

describe('listLessons', () => {
  it('returns builtin lessons normalized with variant_id', async () => {
    const lessons = await listLessons({}, new MemoryAdapter())
    expect(lessons.length).toBeGreaterThan(0)
    expect(lessons[0].variants[0]).toHaveProperty('variant_id')
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
