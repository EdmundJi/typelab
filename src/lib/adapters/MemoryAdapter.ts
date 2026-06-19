import type {
  Collection,
  CollectionItem,
  CommunityLesson,
  LeaderboardEntry,
  Path,
  Session,
  SubmitLessonInput,
  UserResult,
} from '@/types'
import type { DbAdapter } from './types'

const id = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
const now = () => new Date().toISOString()

export class MemoryAdapter implements DbAdapter {
  session: Session | null = null
  results: UserResult[] = []
  achievements = new Map<string, Set<string>>()
  communityLessons: CommunityLesson[] = []
  collections: Collection[] = []
  collectionItems: CollectionItem[] = []
  paths: Path[] = []

  constructor(
    seed: Partial<
      Pick<
        MemoryAdapter,
        'results' | 'communityLessons' | 'collections' | 'collectionItems' | 'paths'
      >
    > = {},
  ) {
    this.results = [...(seed.results ?? [])]
    this.communityLessons = [...(seed.communityLessons ?? [])]
    this.collections = [...(seed.collections ?? [])]
    this.collectionItems = [...(seed.collectionItems ?? [])]
    this.paths = [...(seed.paths ?? [])]
  }

  reset() {
    this.session = null
    this.results = []
    this.achievements.clear()
    this.communityLessons = []
    this.collections = []
    this.collectionItems = []
    this.paths = []
  }
  async getCurrentSession() {
    return { data: { session: this.session }, error: null }
  }
  onAuthStateChange(_callback: (session: Session | null) => void) {
    return { data: { subscription: { unsubscribe() {} } } }
  }
  async signInWithPassword(credentials: { email: string; password: string }) {
    this.session = { user: { id: 'mock-user-id', email: credentials.email } }
    return { data: { session: this.session, user: this.session.user }, error: null }
  }
  async signUp(credentials: { email: string; password: string }) {
    return this.signInWithPassword(credentials)
  }
  async signOut() {
    this.session = null
    return { error: null }
  }
  async saveResult(result: Partial<UserResult>) {
    const row = { id: id(), created_at: now(), ...(result as UserResult) }
    this.results.push(row)
    return { data: row, error: null }
  }
  async listUserResults(userId: string) {
    return {
      data: this.results
        .filter((r) => r.user_id === userId)
        .sort((a, b) => Date.parse(b.created_at ?? '') - Date.parse(a.created_at ?? '')),
      error: null,
    }
  }
  async getBestLessonWpm(userId: string, lessonId: string) {
    const rows = this.results.filter((r) => r.user_id === userId && r.lesson_id === lessonId)
    return { data: rows.length ? Math.max(...rows.map((r) => r.wpm)) : null, error: null }
  }
  async listLeaderboard() {
    const best = new Map<string, LeaderboardEntry>()
    for (const r of this.results) {
      const current = best.get(r.user_id)
      if (!current || r.wpm > current.best_wpm)
        best.set(r.user_id, {
          user_id: r.user_id,
          email: r.email ?? 'mock@example.com',
          best_wpm: r.wpm,
          accuracy: r.accuracy,
        })
    }
    return {
      data: [...best.values()].sort((a, b) => b.best_wpm - a.best_wpm).slice(0, 20),
      error: null,
    }
  }
  async listUserAchievements(userId: string) {
    return [...(this.achievements.get(userId) ?? new Set<string>())]
  }
  async unlockAchievement(userId: string, achievementId: string) {
    if (!this.achievements.has(userId)) this.achievements.set(userId, new Set())
    this.achievements.get(userId)?.add(achievementId)
  }
  async queryCommunityLessons(filters: { status?: string; id?: string } = {}) {
    return {
      data: this.communityLessons.filter(
        (l) =>
          (!filters.status || l.status === filters.status) && (!filters.id || l.id === filters.id),
      ),
    }
  }
  async submitLesson(userId: string, lesson: SubmitLessonInput) {
    const entry: CommunityLesson = {
      id: id(),
      submitted_by: userId,
      title: lesson.title,
      language: lesson.language,
      code: lesson.code,
      text: lesson.code,
      note: lesson.note ?? null,
      status: 'pending',
      reject_reason: null,
      created_at: now(),
    }
    this.communityLessons.push(entry)
    return { data: entry, error: null }
  }
  async listMySubmissions(userId: string) {
    return {
      data: this.communityLessons
        .filter((s) => s.submitted_by === userId)
        .sort((a, b) => Date.parse(b.created_at ?? '') - Date.parse(a.created_at ?? '')),
    }
  }
  async listPendingSubmissions() {
    return { data: this.communityLessons.filter((s) => s.status === 'pending') }
  }
  async reviewLesson(
    idValue: string,
    { approved, rejectReason }: { approved: boolean; rejectReason?: string },
  ) {
    const row = this.communityLessons.find((s) => s.id === idValue)
    if (row) {
      row.status = approved ? 'approved' : 'rejected'
      row.reject_reason = approved ? null : (rejectReason ?? null)
    }
    return { error: null }
  }
  async createCollection(userId: string, name: string) {
    const c: Collection = { id: id(), user_id: userId, name, created_at: now() }
    this.collections.push(c)
    return { data: c, error: null }
  }
  async listCollections(userId: string) {
    return {
      data: this.collections
        .filter((c) => c.user_id === userId)
        .map((c) => ({
          ...c,
          item_count: this.collectionItems.filter((i) => i.collection_id === c.id).length,
        })),
      error: null,
    }
  }
  async addToCollection(collectionId: string, lessonRef: string) {
    if (
      this.collectionItems.some(
        (i) => i.collection_id === collectionId && i.lesson_ref === lessonRef,
      )
    )
      return { data: null, error: null }
    const item: CollectionItem = {
      id: id(),
      collection_id: collectionId,
      lesson_ref: lessonRef,
      added_at: now(),
    }
    this.collectionItems.push(item)
    return { data: item, error: null }
  }
  async removeFromCollection(collectionId: string, lessonRef: string) {
    this.collectionItems = this.collectionItems.filter(
      (i) => !(i.collection_id === collectionId && i.lesson_ref === lessonRef),
    )
    return { error: null }
  }
  async deleteCollection(collectionId: string) {
    this.collections = this.collections.filter((c) => c.id !== collectionId)
    this.collectionItems = this.collectionItems.filter((i) => i.collection_id !== collectionId)
    return { error: null }
  }
  async getCollectionStatus(userId: string, lessonRef: string) {
    const ids = new Set(this.collections.filter((c) => c.user_id === userId).map((c) => c.id))
    return {
      data: this.collectionItems
        .filter((i) => ids.has(i.collection_id) && i.lesson_ref === lessonRef)
        .map((i) => i.collection_id),
      error: null,
    }
  }
  async listPaths() {
    return { data: this.paths, error: null }
  }
  async getPathById(pathId: string) {
    return { data: this.paths.find((p) => p.id === pathId) ?? null, error: null }
  }
}
