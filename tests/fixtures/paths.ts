import type { Path } from '@/types'

export const pathFixtures: Path[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Python 算法入门',
    description: '从排序到图论，掌握 Python 核心算法',
    created_at: '2026-01-01T00:00:00.000Z',
    items: [
      {
        id: 'item-01',
        path_id: '00000000-0000-0000-0000-000000000001',
        lesson_ref: 'builtin:py-quicksort-01',
        position: 1,
      },
    ],
  },
]
