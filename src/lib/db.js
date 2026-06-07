import { getLessonById, lessonMetas } from '@/lessons'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

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
    const bestWpm = mockResults
      .filter((result) => result.user_id === userId && result.lesson_id === lessonId)
      .reduce((best, result) => Math.max(best, result.wpm), 0)

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

  return { data: data?.wpm ?? 0, error }
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

  // 具体聚合 SQL / RPC 可在排行榜任务中按 Supabase 项目策略完善。
  const { data, error } = await supabase
    .from('results')
    .select('user_id, wpm, accuracy')
    .order('wpm', { ascending: false })
    .limit(20)

  return { data, error }
}
