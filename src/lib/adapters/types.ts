import type {
  AuthResponse,
  Collection,
  CollectionItem,
  CommunityLesson,
  DbResult,
  LeaderboardEntry,
  LessonMeta,
  NormalizedLesson,
  Path,
  Session,
  SubmitLessonInput,
  UserResult,
} from '@/types'

export interface Subscription {
  unsubscribe: () => void
}

export interface DbAdapter {
  getCurrentSession(): Promise<AuthResponse>
  onAuthStateChange(callback: (session: Session | null) => void): {
    data: { subscription: Subscription }
  }
  signInWithPassword(credentials: { email: string; password: string }): Promise<AuthResponse>
  signUp(credentials: { email: string; password: string }): Promise<AuthResponse>
  signOut(): Promise<{ error: unknown }>
  saveResult(result: Partial<UserResult>): DbResult<UserResult | null>
  listUserResults(userId: string): DbResult<UserResult[]>
  getBestLessonWpm(userId: string, lessonId: string): DbResult<number | null>
  listLeaderboard(): DbResult<LeaderboardEntry[]>
  listUserAchievements(userId: string): Promise<string[]>
  unlockAchievement(userId: string, achievementId: string): Promise<void>
  listBuiltinLessonMetas(): Promise<{ data: LessonMeta[] }>
  getBuiltinLesson(id: string): Promise<{ data: NormalizedLesson | null }>
  queryCommunityLessons(filters?: {
    status?: string
    id?: string
  }): Promise<{ data: CommunityLesson[] }>
  submitLesson(userId: string, lesson: SubmitLessonInput): DbResult<CommunityLesson | null>
  listMySubmissions(userId: string): Promise<{ data: CommunityLesson[] }>
  listPendingSubmissions(): Promise<{ data: CommunityLesson[] }>
  reviewLesson(
    id: string,
    options: { approved: boolean; rejectReason?: string },
  ): Promise<{ error: unknown }>
  createCollection(userId: string, name: string): DbResult<Collection | null>
  listCollections(userId: string): DbResult<Collection[]>
  addToCollection(collectionId: string, lessonRef: string): DbResult<CollectionItem | null>
  removeFromCollection(collectionId: string, lessonRef: string): Promise<{ error: unknown }>
  deleteCollection(collectionId: string): Promise<{ error: unknown }>
  getCollectionStatus(userId: string, lessonRef: string): DbResult<string[]>
  listPaths(): DbResult<Path[]>
  getPathById(pathId: string): DbResult<Path | null>
}
