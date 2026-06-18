import { getLessonById, lessonMetas } from '@/lessons'
import { isSupabaseConfigured, supabase } from '@/lib/adapters/supabase'

// 数据访问统一入口：组件应通过 '@/lib/db' 访问数据，不直接调用 supabase。
// 未配置 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 时，自动使用 mock 数据，方便本地无后端启动。

const mockResults = []
let mockSession = null

export function isUsingMockData() {
  return !isSupabaseConfigured
}

export async function getCurrentSession() {
  if (isUsingMockData()) {
    return { data: { session: mockSession }, error: null }
  }

  return supabase.auth.getSession()
}

export function onAuthStateChange(callback) {
  if (isUsingMockData()) {
    return {
      data: {
        subscription: {
          unsubscribe() {},
        },
      },
    }
  }

  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
}

export async function signInWithPassword(credentials) {
  if (isUsingMockData()) {
    mockSession = {
      user: {
        id: 'mock-user-id',
        email: credentials.email,
      },
    }
    return { data: { session: mockSession, user: mockSession.user }, error: null }
  }

  return supabase.auth.signInWithPassword(credentials)
}

export async function signUp(credentials) {
  if (isUsingMockData()) {
    mockSession = {
      user: {
        id: 'mock-user-id',
        email: credentials.email,
      },
    }
    return { data: { session: mockSession, user: mockSession.user }, error: null }
  }

  return supabase.auth.signUp(credentials)
}

export async function signOut() {
  if (isUsingMockData()) {
    mockSession = null
    return { error: null }
  }

  return supabase.auth.signOut()
}

export async function listLessonMetas() {
  return lessonMetas
}

export async function findLessonById(id) {
  return getLessonById(id) ?? null
}

export async function saveResult(result) {
  if (isUsingMockData()) {
    const mockResult = {
      id: crypto.randomUUID?.() ?? String(Date.now()),
      created_at: new Date().toISOString(),
      ...result,
    }
    mockResults.push(mockResult)
    return { data: mockResult, error: null }
  }

  const { data, error } = await supabase.from('results').insert(result).select().single()
  return { data, error }
}

export async function listUserResults(userId) {
  if (isUsingMockData()) {
    return {
      data: mockResults
        .filter((result) => result.user_id === userId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
      error: null,
    }
  }

  const { data, error } = await supabase
    .from('results')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return { data, error }
}

export async function getBestLessonWpm(userId, lessonId) {
  if (isUsingMockData()) {
    const matches = mockResults.filter(
      (result) => result.user_id === userId && result.lesson_id === lessonId,
    )
    const bestWpm = matches.length > 0 ? Math.max(...matches.map((r) => r.wpm)) : null

    return { data: bestWpm, error: null }
  }

  const { data, error } = await supabase
    .from('results')
    .select('wpm')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .order('wpm', { ascending: false })
    .limit(1)
    .maybeSingle()

  return { data: data?.wpm ?? null, error }
}

export async function listLeaderboard() {
  if (isUsingMockData()) {
    const bestByUser = new Map()

    for (const result of mockResults) {
      const current = bestByUser.get(result.user_id)
      if (!current || result.wpm > current.best_wpm) {
        bestByUser.set(result.user_id, {
          user_id: result.user_id,
          email: result.email ?? 'mock@example.com',
          best_wpm: result.wpm,
          accuracy: result.accuracy,
        })
      }
    }

    return {
      data: [...bestByUser.values()].sort((a, b) => b.best_wpm - a.best_wpm).slice(0, 20),
      error: null,
    }
  }

  const { data, error } = await supabase.rpc('get_leaderboard')
  return { data, error }
}

// ——— 成就 ———

const mockAchievements = []

/**
 * 列出用户已解锁的成就 id 列表
 * @param {string} userId
 * @returns {Promise<string[]>}
 */
export async function listUserAchievements(userId) {
  if (isUsingMockData()) {
    return mockAchievements.filter((a) => a.user_id === userId).map((a) => a.achievement_id)
  }

  const { data, error } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId)

  if (error) throw error
  return (data ?? []).map((row) => row.achievement_id)
}

/**
 * 写入用户成就解锁记录；PK 冲突时幂等（不 throw）
 * @param {string} userId
 * @param {string} achievementId
 * @returns {Promise<void>}
 */
export async function unlockAchievement(userId, achievementId) {
  if (isUsingMockData()) {
    const exists = mockAchievements.some(
      (a) => a.user_id === userId && a.achievement_id === achievementId,
    )
    if (!exists) {
      mockAchievements.push({
        user_id: userId,
        achievement_id: achievementId,
        unlocked_at: new Date().toISOString(),
      })
    }
    return
  }

  const { error } = await supabase.from('user_achievements').insert({
    user_id: userId,
    achievement_id: achievementId,
    unlocked_at: new Date().toISOString(),
  })

  // PK 冲突（重复解锁）→ 静默忽略
  if (error && error.code !== '23505') {
    throw error
  }
}

/**
 * 查询社区课程（供 LessonLoader 使用）
 * @param {{ status?: string, id?: string }} [filters]
 * @returns {Promise<{ data: Object[] }>}
 */
export async function queryCommunityLessons(filters = {}) {
  if (isUsingMockData()) {
    return { data: [] }
  }

  let query = supabase.from('community_lessons').select('*')

  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.id) {
    query = query.eq('id', filters.id)
  }

  const { data, error } = await query
  if (error) throw error
  return { data: data ?? [] }
}

// ——— 收藏夹 ———

const mockCollections = [] // { id, user_id, name, created_at }
const mockCollectionItems = [] // { id, collection_id, lesson_ref, added_at }

/**
 * 创建收藏夹
 * @param {string} userId
 * @param {string} name
 * @returns {Promise<{ data: Object, error: any }>}
 */
export async function createCollection(userId, name) {
  if (isUsingMockData()) {
    const collection = {
      id: crypto.randomUUID?.() ?? String(Date.now()),
      user_id: userId,
      name,
      created_at: new Date().toISOString(),
    }
    mockCollections.push(collection)
    return { data: collection, error: null }
  }

  const { data, error } = await supabase
    .from('collections')
    .insert({ user_id: userId, name })
    .select()
    .single()
  return { data, error }
}

/**
 * 列出用户的所有收藏夹（含每个收藏夹的课程数）
 * @param {string} userId
 * @returns {Promise<{ data: Object[], error: any }>}
 */
export async function listCollections(userId) {
  if (isUsingMockData()) {
    const collections = mockCollections
      .filter((c) => c.user_id === userId)
      .map((c) => ({
        ...c,
        item_count: mockCollectionItems.filter((i) => i.collection_id === c.id).length,
      }))
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    return { data: collections, error: null }
  }

  const { data, error } = await supabase
    .from('collections')
    .select('*, collection_items(count)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) return { data: [], error }

  const normalized = (data ?? []).map((c) => ({
    ...c,
    item_count: c.collection_items?.[0]?.count ?? 0,
    collection_items: undefined,
  }))
  return { data: normalized, error: null }
}

/**
 * 将课程添加到收藏夹
 * @param {string} collectionId
 * @param {string} lessonRef
 * @returns {Promise<{ data: Object, error: any }>}
 */
export async function addToCollection(collectionId, lessonRef) {
  if (isUsingMockData()) {
    const exists = mockCollectionItems.some(
      (i) => i.collection_id === collectionId && i.lesson_ref === lessonRef,
    )
    if (exists) return { data: null, error: null }
    const item = {
      id: crypto.randomUUID?.() ?? String(Date.now()),
      collection_id: collectionId,
      lesson_ref: lessonRef,
      added_at: new Date().toISOString(),
    }
    mockCollectionItems.push(item)
    return { data: item, error: null }
  }

  const { data, error } = await supabase
    .from('collection_items')
    .insert({ collection_id: collectionId, lesson_ref: lessonRef })
    .select()
    .single()
  return { data, error }
}

/**
 * 从收藏夹移除课程
 * @param {string} collectionId
 * @param {string} lessonRef
 * @returns {Promise<{ error: any }>}
 */
export async function removeFromCollection(collectionId, lessonRef) {
  if (isUsingMockData()) {
    const idx = mockCollectionItems.findIndex(
      (i) => i.collection_id === collectionId && i.lesson_ref === lessonRef,
    )
    if (idx !== -1) mockCollectionItems.splice(idx, 1)
    return { error: null }
  }

  const { error } = await supabase
    .from('collection_items')
    .delete()
    .eq('collection_id', collectionId)
    .eq('lesson_ref', lessonRef)
  return { error }
}

/**
 * 删除收藏夹（同时删除其中的所有课程）
 * @param {string} collectionId
 * @returns {Promise<{ error: any }>}
 */
export async function deleteCollection(collectionId) {
  if (isUsingMockData()) {
    const cIdx = mockCollections.findIndex((c) => c.id === collectionId)
    if (cIdx !== -1) mockCollections.splice(cIdx, 1)
    // 同时删除该收藏夹下的所有条目
    let i = mockCollectionItems.length - 1
    while (i >= 0) {
      if (mockCollectionItems[i].collection_id === collectionId) {
        mockCollectionItems.splice(i, 1)
      }
      i--
    }
    return { error: null }
  }

  // Supabase: 先删 items（或依赖 CASCADE），再删收藏夹
  await supabase.from('collection_items').delete().eq('collection_id', collectionId)
  const { error } = await supabase.from('collections').delete().eq('id', collectionId)
  return { error }
}

/**
 * 获取某课程在用户收藏夹中的状态（被哪些收藏夹收藏）
 * @param {string} userId
 * @param {string} lessonRef
 * @returns {Promise<{ data: string[], error: any }>} 收藏夹 id 列表
 */
export async function getCollectionStatus(userId, lessonRef) {
  if (isUsingMockData()) {
    const userCollectionIds = mockCollections.filter((c) => c.user_id === userId).map((c) => c.id)
    const collected = mockCollectionItems
      .filter((i) => userCollectionIds.includes(i.collection_id) && i.lesson_ref === lessonRef)
      .map((i) => i.collection_id)
    return { data: collected, error: null }
  }

  // 先取用户的所有收藏夹 id
  const { data: cols, error: colErr } = await supabase
    .from('collections')
    .select('id')
    .eq('user_id', userId)
  if (colErr) return { data: [], error: colErr }

  const collectionIds = (cols ?? []).map((c) => c.id)
  if (collectionIds.length === 0) return { data: [], error: null }

  const { data: items, error: itemErr } = await supabase
    .from('collection_items')
    .select('collection_id')
    .in('collection_id', collectionIds)
    .eq('lesson_ref', lessonRef)
  if (itemErr) return { data: [], error: itemErr }

  return { data: (items ?? []).map((i) => i.collection_id), error: null }
}

// ——— 社区投稿 ———

const mockCommunitySubmissions = []

/**
 * 提交新题目（状态: 'pending'）
 * @param {string} userId
 * @param {{ title: string, language: string, code: string, note?: string }} lesson
 * @returns {Promise<{ data: Object, error: null | Object }>}
 */
export async function submitLesson(userId, lesson) {
  if (isUsingMockData()) {
    const entry = {
      id: crypto.randomUUID?.() ?? String(Date.now()),
      submitted_by: userId,
      title: lesson.title,
      language: lesson.language,
      code: lesson.code,
      note: lesson.note ?? null,
      status: 'pending',
      reject_reason: null,
      created_at: new Date().toISOString(),
    }
    mockCommunitySubmissions.push(entry)
    return { data: entry, error: null }
  }

  const { data, error } = await supabase
    .from('community_lessons')
    .insert({
      submitted_by: userId,
      title: lesson.title,
      language: lesson.language,
      text: lesson.code,
      note: lesson.note ?? null,
      status: 'pending',
    })
    .select()
    .single()

  return { data, error }
}

/**
 * 查询用户自己的投稿列表
 * @param {string} userId
 * @returns {Promise<{ data: Array<{ id: string, title: string, language: string, code: string, status: string, reject_reason: string | null, created_at: string }> }>}
 */
export async function listMySubmissions(userId) {
  if (isUsingMockData()) {
    return {
      data: mockCommunitySubmissions
        .filter((s) => s.submitted_by === userId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    }
  }

  const { data, error } = await supabase
    .from('community_lessons')
    .select('id, title, language, text, status, reject_reason, created_at')
    .eq('submitted_by', userId)
    .order('created_at', { ascending: false })

  if (error) return { data: [] }
  return {
    data: (data ?? []).map((row) => ({ ...row, code: row.text })),
  }
}

/**
 * 管理员：列出所有 pending 投稿
 * @returns {Promise<{ data: Object[] }>}
 */
export async function listPendingSubmissions() {
  if (isUsingMockData()) {
    return {
      data: mockCommunitySubmissions.filter((s) => s.status === 'pending'),
    }
  }

  const { data, error } = await supabase
    .from('community_lessons')
    .select('id, title, language, text, note, submitted_by, status, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) return { data: [] }
  return { data: data ?? [] }
}

/**
 * 管理员：审核投稿（通过/拒绝）
 * @param {string} id
 * @param {{ approved: boolean, rejectReason?: string }} options
 * @returns {Promise<{ error: null | Object }>}
 */
export async function reviewLesson(id, { approved, rejectReason }) {
  if (isUsingMockData()) {
    const idx = mockCommunitySubmissions.findIndex((s) => s.id === id)
    if (idx !== -1) {
      mockCommunitySubmissions[idx].status = approved ? 'approved' : 'rejected'
      mockCommunitySubmissions[idx].reject_reason = approved ? null : (rejectReason ?? null)
    }
    return { error: null }
  }

  const update = approved
    ? { status: 'approved', reject_reason: null, reviewed_at: new Date().toISOString() }
    : {
        status: 'rejected',
        reject_reason: rejectReason ?? null,
        reviewed_at: new Date().toISOString(),
      }

  const { error } = await supabase.from('community_lessons').update(update).eq('id', id)

  return { error }
}

// ——— 学习路径 ———

const mockPaths = [
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
      {
        id: 'item-02',
        path_id: '00000000-0000-0000-0000-000000000001',
        lesson_ref: 'builtin:py-mergesort-01',
        position: 2,
      },
      {
        id: 'item-03',
        path_id: '00000000-0000-0000-0000-000000000001',
        lesson_ref: 'builtin:py-bfs-01',
        position: 3,
      },
      {
        id: 'item-04',
        path_id: '00000000-0000-0000-0000-000000000001',
        lesson_ref: 'builtin:py-dfs-01',
        position: 4,
      },
      {
        id: 'item-05',
        path_id: '00000000-0000-0000-0000-000000000001',
        lesson_ref: 'builtin:py-dijkstra-01',
        position: 5,
      },
      {
        id: 'item-06',
        path_id: '00000000-0000-0000-0000-000000000001',
        lesson_ref: 'builtin:py-fibonacci-01',
        position: 6,
      },
    ],
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: '数据结构基础',
    description: '树、图、DP 全覆盖',
    created_at: '2026-01-01T00:00:00.000Z',
    items: [
      {
        id: 'item-11',
        path_id: '00000000-0000-0000-0000-000000000002',
        lesson_ref: 'builtin:py-bfs-01',
        position: 1,
      },
      {
        id: 'item-12',
        path_id: '00000000-0000-0000-0000-000000000002',
        lesson_ref: 'builtin:py-dfs-01',
        position: 2,
      },
      {
        id: 'item-13',
        path_id: '00000000-0000-0000-0000-000000000002',
        lesson_ref: 'builtin:py-dijkstra-01',
        position: 3,
      },
      {
        id: 'item-14',
        path_id: '00000000-0000-0000-0000-000000000002',
        lesson_ref: 'builtin:py-fibonacci-01',
        position: 4,
      },
    ],
  },
]

/**
 * 读取路径列表（含 items 数组，用于 PathsView）
 * @returns {Promise<{ data: Object[], error: Object|null }>}
 */
export async function listPaths() {
  if (isUsingMockData()) {
    return { data: mockPaths, error: null }
  }

  const { data: paths, error: pathsError } = await supabase
    .from('paths')
    .select('*')
    .order('created_at', { ascending: true })

  if (pathsError) return { data: [], error: pathsError }

  const { data: items, error: itemsError } = await supabase
    .from('path_items')
    .select('*')
    .order('position', { ascending: true })

  if (itemsError) return { data: [], error: itemsError }

  const pathsWithItems = (paths ?? []).map((path) => ({
    ...path,
    items: (items ?? []).filter((item) => item.path_id === path.id),
  }))

  return { data: pathsWithItems, error: null }
}

/**
 * 读取单个路径及其课程列表（用于 PathDetail）
 * @param {string} pathId
 * @returns {Promise<{ data: Object|null, error: Object|null }>}
 */
export async function getPathById(pathId) {
  if (isUsingMockData()) {
    const path = mockPaths.find((p) => p.id === pathId) ?? null
    return { data: path, error: null }
  }

  const { data: path, error: pathError } = await supabase
    .from('paths')
    .select('*')
    .eq('id', pathId)
    .maybeSingle()

  if (pathError) return { data: null, error: pathError }
  if (!path) return { data: null, error: null }

  const { data: items, error: itemsError } = await supabase
    .from('path_items')
    .select('*')
    .eq('path_id', pathId)
    .order('position', { ascending: true })

  if (itemsError) return { data: null, error: itemsError }

  return { data: { ...path, items: items ?? [] }, error: null }
}
