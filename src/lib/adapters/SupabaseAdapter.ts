import type { DbAdapter } from './types'

export class SupabaseAdapter implements DbAdapter {
  constructor(private client: any) {}
  get supabase() {
    return this.client
  }
  async getCurrentSession() {
    return this.supabase.auth.getSession()
  }
  onAuthStateChange(callback: (session: any) => void) {
    return this.supabase.auth.onAuthStateChange((_event: string, session: any) => callback(session))
  }
  async signInWithPassword(credentials: { email: string; password: string }) {
    return this.supabase.auth.signInWithPassword(credentials)
  }
  async signUp(credentials: { email: string; password: string }) {
    return this.supabase.auth.signUp(credentials)
  }
  async signOut() {
    return this.supabase.auth.signOut()
  }
  async saveResult(result: any) {
    const { data, error } = await this.supabase.from('results').insert(result).select().single()
    return { data, error }
  }
  async listUserResults(userId: string) {
    const { data, error } = await this.supabase
      .from('results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data: data ?? [], error }
  }
  async getBestLessonWpm(userId: string, lessonId: string) {
    const { data, error } = await this.supabase
      .from('results')
      .select('wpm')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .order('wpm', { ascending: false })
      .limit(1)
      .maybeSingle()
    return { data: data?.wpm ?? null, error }
  }
  async listLeaderboard() {
    const { data, error } = await this.supabase.rpc('get_leaderboard')
    return { data: data ?? [], error }
  }
  async listUserAchievements(userId: string) {
    const { data, error } = await this.supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId)
    if (error) throw error
    return (data ?? []).map((row: any) => row.achievement_id)
  }
  async unlockAchievement(userId: string, achievementId: string) {
    const { error } = await this.supabase.from('user_achievements').insert({
      user_id: userId,
      achievement_id: achievementId,
      unlocked_at: new Date().toISOString(),
    })
    if (error && error.code !== '23505') throw error
  }
  async queryCommunityLessons(filters: { status?: string; id?: string } = {}) {
    let query = this.supabase.from('community_lessons').select('*')
    if (filters.status) query = query.eq('status', filters.status)
    if (filters.id) query = query.eq('id', filters.id)
    const { data, error } = await query
    if (error) throw error
    return { data: data ?? [] }
  }
  async submitLesson(userId: string, lesson: any) {
    const { data, error } = await this.supabase
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
  async listMySubmissions(userId: string) {
    const { data, error } = await this.supabase
      .from('community_lessons')
      .select('id, title, language, text, status, reject_reason, created_at')
      .eq('submitted_by', userId)
      .order('created_at', { ascending: false })
    if (error) return { data: [] }
    return { data: (data ?? []).map((row: any) => ({ ...row, code: row.text })) }
  }
  async listPendingSubmissions() {
    const { data, error } = await this.supabase
      .from('community_lessons')
      .select('id, title, language, text, note, submitted_by, status, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
    if (error) return { data: [] }
    return { data: data ?? [] }
  }
  async reviewLesson(
    id: string,
    { approved, rejectReason }: { approved: boolean; rejectReason?: string },
  ) {
    const update = approved
      ? { status: 'approved', reject_reason: null, reviewed_at: new Date().toISOString() }
      : {
          status: 'rejected',
          reject_reason: rejectReason ?? null,
          reviewed_at: new Date().toISOString(),
        }
    const { error } = await this.supabase.from('community_lessons').update(update).eq('id', id)
    return { error }
  }
  async createCollection(userId: string, name: string) {
    const { data, error } = await this.supabase
      .from('collections')
      .insert({ user_id: userId, name })
      .select()
      .single()
    return { data, error }
  }
  async listCollections(userId: string) {
    const { data, error } = await this.supabase
      .from('collections')
      .select('*, collection_items(count)')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    if (error) return { data: [], error }
    return {
      data: (data ?? []).map((c: any) => ({
        ...c,
        item_count: c.collection_items?.[0]?.count ?? 0,
        collection_items: undefined,
      })),
      error: null,
    }
  }
  async addToCollection(collectionId: string, lessonRef: string) {
    const { data, error } = await this.supabase
      .from('collection_items')
      .insert({ collection_id: collectionId, lesson_ref: lessonRef })
      .select()
      .single()
    return { data, error }
  }
  async removeFromCollection(collectionId: string, lessonRef: string) {
    const { error } = await this.supabase
      .from('collection_items')
      .delete()
      .eq('collection_id', collectionId)
      .eq('lesson_ref', lessonRef)
    return { error }
  }
  async deleteCollection(collectionId: string) {
    await this.supabase.from('collection_items').delete().eq('collection_id', collectionId)
    const { error } = await this.supabase.from('collections').delete().eq('id', collectionId)
    return { error }
  }
  async getCollectionStatus(userId: string, lessonRef: string) {
    const { data: cols, error: colErr } = await this.supabase
      .from('collections')
      .select('id')
      .eq('user_id', userId)
    if (colErr) return { data: [], error: colErr }
    const ids = (cols ?? []).map((c: any) => c.id)
    if (!ids.length) return { data: [], error: null }
    const { data, error } = await this.supabase
      .from('collection_items')
      .select('collection_id')
      .in('collection_id', ids)
      .eq('lesson_ref', lessonRef)
    return { data: (data ?? []).map((i: any) => i.collection_id), error }
  }
  async listPaths() {
    const { data: paths, error: pathsError } = await this.supabase
      .from('paths')
      .select('*')
      .order('created_at', { ascending: true })
    if (pathsError) return { data: [], error: pathsError }
    const { data: items, error: itemsError } = await this.supabase
      .from('path_items')
      .select('*')
      .order('position', { ascending: true })
    if (itemsError) return { data: [], error: itemsError }
    return {
      data: (paths ?? []).map((p: any) => ({
        ...p,
        items: (items ?? []).filter((i: any) => i.path_id === p.id),
      })),
      error: null,
    }
  }
  async getPathById(pathId: string) {
    const { data: path, error: pathError } = await this.supabase
      .from('paths')
      .select('*')
      .eq('id', pathId)
      .maybeSingle()
    if (pathError || !path) return { data: null, error: pathError }
    const { data: items, error } = await this.supabase
      .from('path_items')
      .select('*')
      .eq('path_id', pathId)
      .order('position', { ascending: true })
    return { data: { ...path, items: items ?? [] }, error }
  }
}
