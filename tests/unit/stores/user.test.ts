import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useUserStore } from '@/stores/user'

describe('user store', () => {
  beforeEach(() => setActivePinia(createPinia()))
  it('sets and clears session', () => {
    const s = useUserStore()
    s.setSession({ user: { id: 'u', email: 'e' } })
    expect(s.user.email).toBe('e')
    expect(s.isLoggedIn).toBe(true)
    s.clearSession()
    expect(s.user).toBeNull()
  })
  it('derives admin from metadata', () => {
    const s = useUserStore()
    s.setSession({ user: { id: 'u', email: 'e', user_metadata: { role: 'admin' } } })
    expect(s.isAdmin).toBe(true)
  })
})
