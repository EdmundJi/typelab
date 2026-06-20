export type LessonDifficulty = 1 | 2 | 3 | 4 | 5

export interface Variant {
  variant_id: string
  language: string
  style: 'verbose' | 'standard' | 'concise'
  step: 1 | 2 | 3
  label: string
  text: string
  note: string
}
export interface NormalizedLesson {
  id: string
  title: string
  topic: string
  difficulty: LessonDifficulty
  variants: Variant[]
}

export type VariantMeta = Omit<Variant, 'text' | 'note'>

export interface LessonMeta extends Omit<NormalizedLesson, 'variants'> {
  variants: VariantMeta[]
}

export interface LessonManifestEntry extends LessonMeta {
  source_file: string
}
export interface V1Lesson {
  id: string
  title: string
  category?: string
  language?: string
  text?: string
  code?: string
  difficulty?: number | string
  note?: string
}
export interface V2Lesson extends NormalizedLesson {}
export type RawLesson = V1Lesson | V2Lesson
export interface TypingResult {
  lessonId?: string
  lesson_id?: string
  variant_id?: string | null
  language?: string | null
  finishedAt?: string
  wpm: number
  accuracy: number
  duration: number
  errors: number
}
export interface UserResult extends TypingResult {
  id?: string
  user_id: string
  email?: string
  created_at?: string
}
export interface LeaderboardEntry {
  user_id: string
  email?: string
  best_wpm: number
  accuracy?: number
  rank?: number
}
export interface Collection {
  id: string
  user_id: string
  name: string
  created_at?: string
  item_count?: number
}
export interface CollectionItem {
  id: string
  collection_id: string
  lesson_ref: string
  added_at?: string
}
export interface CommunityLesson {
  id: string
  submitted_by?: string
  title: string
  language: string
  code?: string
  text?: string
  note?: string | null
  topic?: string
  style?: string
  step?: number
  status?: 'pending' | 'approved' | 'rejected'
  reject_reason?: string | null
  created_at?: string
}
export interface SubmitLessonInput {
  title: string
  language: string
  code: string
  note?: string
}
export interface PathItem {
  id: string
  path_id: string
  lesson_ref: string
  position: number
}
export interface Path {
  id: string
  name: string
  description?: string
  created_at?: string
  items?: PathItem[]
}
export interface CheckContext {
  allResults?: UserResult[]
  latestResult?: UserResult | TypingResult
  currentStreak?: number
  unlockedIds?: string[]
}
export interface Achievement {
  id: string
  title: string
  description: string
  check?: (context: CheckContext) => boolean
}
export interface Session {
  user: { id: string; email?: string; role?: string; user_metadata?: Record<string, unknown> }
}
export interface AuthResponse {
  data?: { session?: Session | null; user?: Session['user'] | null }
  error?: unknown
}
export type DbResult<T> = Promise<{ data: T; error?: unknown }>
