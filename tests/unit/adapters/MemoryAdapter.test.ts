import { describe, expect, it } from 'vitest'
import { MemoryAdapter } from '@/lib/adapters/MemoryAdapter'

describe('MemoryAdapter', () => {
  it('auth signs in, signs up, emits subscription shape, and signs out', async () => {
    const db = new MemoryAdapter()
    const sub = db.onAuthStateChange(() => {})
    expect(typeof sub.data.subscription.unsubscribe).toBe('function')
    await db.signUp({ email: 'new@b.com', password: 'x' })
    expect((await db.getCurrentSession()).data.session?.user.email).toBe('new@b.com')
    await db.signInWithPassword({ email: 'a@b.com', password: 'x' })
    expect((await db.getCurrentSession()).data.session?.user.email).toBe('a@b.com')
    await db.signOut()
    expect((await db.getCurrentSession()).data.session).toBeNull()
  })
  it('saves/list results and best wpm', async () => {
    const db = new MemoryAdapter()
    await db.saveResult({
      user_id: 'u',
      lesson_id: 'l',
      wpm: 50,
      accuracy: 90,
      duration: 1,
      errors: 0,
    })
    await db.saveResult({
      user_id: 'u',
      lesson_id: 'l',
      wpm: 80,
      accuracy: 90,
      duration: 1,
      errors: 0,
    })
    expect((await db.listUserResults('u')).data).toHaveLength(2)
    expect((await db.getBestLessonWpm('u', 'l')).data).toBe(80)
  })
  it('builds leaderboard', async () => {
    const db = new MemoryAdapter()
    await db.saveResult({
      user_id: 'u',
      lesson_id: 'l',
      wpm: 80,
      accuracy: 90,
      duration: 1,
      errors: 0,
    })
    expect((await db.listLeaderboard()).data[0].best_wpm).toBe(80)
  })
  it('handles achievements idempotently', async () => {
    const db = new MemoryAdapter()
    await db.unlockAchievement('u', 'a')
    await db.unlockAchievement('u', 'a')
    expect(await db.listUserAchievements('u')).toEqual(['a'])
  })
  it('handles community review filters and rejection', async () => {
    const db = new MemoryAdapter()
    const { data } = await db.submitLesson('u', { title: 'T', language: 'python', code: 'x' })
    expect((await db.listMySubmissions('u')).data[0].id).toBe(data!.id)
    expect((await db.listPendingSubmissions()).data).toHaveLength(1)
    await db.reviewLesson(data!.id, { approved: true })
    expect((await db.queryCommunityLessons({ status: 'approved' })).data).toHaveLength(1)
    expect((await db.queryCommunityLessons({ id: data!.id })).data[0].status).toBe('approved')
    await db.reviewLesson(data!.id, { approved: false, rejectReason: 'duplicate' })
    expect((await db.queryCommunityLessons({ status: 'rejected' })).data[0].reject_reason).toBe(
      'duplicate',
    )
  })
  it('handles collections including counts, duplicates, remove, and delete', async () => {
    const db = new MemoryAdapter()
    const c = (await db.createCollection('u', 'C')).data!
    await db.addToCollection(c.id, 'builtin:l')
    await db.addToCollection(c.id, 'builtin:l')
    expect((await db.listCollections('u')).data[0].item_count).toBe(1)
    expect((await db.getCollectionStatus('u', 'builtin:l')).data).toEqual([c.id])
    await db.removeFromCollection(c.id, 'builtin:l')
    expect((await db.getCollectionStatus('u', 'builtin:l')).data).toEqual([])
    await db.addToCollection(c.id, 'builtin:l')
    await db.deleteCollection(c.id)
    expect((await db.listCollections('u')).data).toEqual([])
    expect((await db.getCollectionStatus('u', 'builtin:l')).data).toEqual([])
  })
  it('handles paths and reset', async () => {
    const db = new MemoryAdapter({ paths: [{ id: 'p', name: 'P', items: [] }] })
    expect((await db.getPathById('p')).data?.name).toBe('P')
    db.reset()
    expect((await db.listPaths()).data).toEqual([])
  })
})
