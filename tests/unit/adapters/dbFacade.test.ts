import { beforeEach, describe, expect, it, vi } from 'vitest'

async function importMockFacade() {
  vi.resetModules()
  vi.doMock('@/lib/adapters/supabase', () => ({ isSupabaseConfigured: false, supabase: null }))
  return import('@/lib/adapters/db')
}

describe('db facade compatibility exports', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('delegates legacy named exports to the selected adapter', async () => {
    const facade = await importMockFacade()
    expect(facade.isUsingMockData()).toBe(true)
    expect(typeof facade.db.reset).toBe('function')
    facade.db.reset()

    const sub = facade.onAuthStateChange(() => {})
    sub.data.subscription.unsubscribe()

    await facade.signUp({ email: 'new@example.com', password: 'pw' })
    expect((await facade.getCurrentSession()).data.session?.user.email).toBe('new@example.com')
    await facade.signOut()
    await facade.signInWithPassword({ email: 'user@example.com', password: 'pw' })

    await facade.saveResult({
      user_id: 'u',
      lesson_id: 'l',
      wpm: 70,
      accuracy: 95,
      duration: 60,
      errors: 1,
    })
    expect((await facade.listUserResults('u')).data).toHaveLength(1)
    expect((await facade.getBestLessonWpm('u', 'l')).data).toBe(70)
    expect((await facade.listLeaderboard()).data[0].best_wpm).toBe(70)

    await facade.unlockAchievement('u', 'first')
    expect(await facade.listUserAchievements('u')).toEqual(['first'])
    expect((await facade.listBuiltinLessonMetas()).data).toEqual([])
    expect((await facade.getBuiltinLesson('missing')).data).toBeNull()

    const submitted = (
      await facade.submitLesson('u', { title: 'Community', language: 'python', code: 'x' })
    ).data!
    expect((await facade.listMySubmissions('u')).data).toHaveLength(1)
    expect((await facade.listPendingSubmissions()).data).toHaveLength(1)
    await facade.reviewLesson(submitted.id, { approved: false, rejectReason: 'no' })
    expect((await facade.queryCommunityLessons({ status: 'rejected' })).data[0].reject_reason).toBe(
      'no',
    )

    const collection = (await facade.createCollection('u', 'Favorites')).data!
    await facade.addToCollection(collection.id, 'builtin:l')
    expect((await facade.listCollections('u')).data[0].item_count).toBe(1)
    expect((await facade.getCollectionStatus('u', 'builtin:l')).data).toEqual([collection.id])
    await facade.removeFromCollection(collection.id, 'builtin:l')
    expect((await facade.getCollectionStatus('u', 'builtin:l')).data).toEqual([])
    await facade.deleteCollection(collection.id)
    expect((await facade.listCollections('u')).data).toEqual([])

    expect((await facade.listPaths()).data).toEqual([])
    expect((await facade.getPathById('missing')).data).toBeNull()
    expect((await facade.listLessonMetas()).length).toBeGreaterThan(0)
    expect(await facade.findLessonById('missing')).toBeNull()
  })
})
