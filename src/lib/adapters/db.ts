import { getLessonById as getBuiltinLessonById, lessonMetas } from '@/lessons'
import type { Session, SubmitLessonInput, UserResult } from '@/types'
import { MemoryAdapter } from './MemoryAdapter'
import { SupabaseAdapter } from './SupabaseAdapter'
import { isSupabaseConfigured, supabase } from './supabase'
import type { DbAdapter } from './types'

export function isUsingMockData() {
  return !isSupabaseConfigured
}
export const db: DbAdapter =
  isSupabaseConfigured && supabase ? new SupabaseAdapter(supabase) : new MemoryAdapter()

export const getCurrentSession = () => db.getCurrentSession()
export const onAuthStateChange = (callback: (session: Session | null) => void) =>
  db.onAuthStateChange(callback)
export const signInWithPassword = (credentials: { email: string; password: string }) =>
  db.signInWithPassword(credentials)
export const signUp = (credentials: { email: string; password: string }) => db.signUp(credentials)
export const signOut = () => db.signOut()
export const saveResult = (result: Partial<UserResult>) => db.saveResult(result)
export const listUserResults = (userId: string) => db.listUserResults(userId)
export const getBestLessonWpm = (userId: string, lessonId: string) =>
  db.getBestLessonWpm(userId, lessonId)
export const listLeaderboard = () => db.listLeaderboard()
export const listUserAchievements = (userId: string) => db.listUserAchievements(userId)
export const unlockAchievement = (userId: string, achievementId: string) =>
  db.unlockAchievement(userId, achievementId)
export const queryCommunityLessons = (filters: { status?: string; id?: string } = {}) =>
  db.queryCommunityLessons(filters)
export const submitLesson = (userId: string, lesson: SubmitLessonInput) =>
  db.submitLesson(userId, lesson)
export const listMySubmissions = (userId: string) => db.listMySubmissions(userId)
export const listPendingSubmissions = () => db.listPendingSubmissions()
export const reviewLesson = (id: string, options: { approved: boolean; rejectReason?: string }) =>
  db.reviewLesson(id, options)
export const createCollection = (userId: string, name: string) => db.createCollection(userId, name)
export const listCollections = (userId: string) => db.listCollections(userId)
export const addToCollection = (collectionId: string, lessonRef: string) =>
  db.addToCollection(collectionId, lessonRef)
export const removeFromCollection = (collectionId: string, lessonRef: string) =>
  db.removeFromCollection(collectionId, lessonRef)
export const deleteCollection = (collectionId: string) => db.deleteCollection(collectionId)
export const getCollectionStatus = (userId: string, lessonRef: string) =>
  db.getCollectionStatus(userId, lessonRef)
export const listPaths = () => db.listPaths()
export const getPathById = (pathId: string) => db.getPathById(pathId)

export async function listLessonMetas() {
  return lessonMetas
}
export async function findLessonById(id: string) {
  return (await getBuiltinLessonById(id)) ?? null
}
