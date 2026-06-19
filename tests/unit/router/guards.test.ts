import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import router from '@/router'
import { useUserStore } from '@/stores/user'

async function navigate(path: string) {
  await router.push(path)
  await router.isReady()
  return router.currentRoute.value
}

describe('router guards/routes', () => {
  beforeEach(() => setActivePinia(createPinia()))
  it('has requiresAuth routes', () =>
    expect(router.getRoutes().some((r) => r.meta.requiresAuth)).toBe(true))
  it('has requiresAdmin route', () =>
    expect(router.getRoutes().some((r) => r.meta.requiresAdmin)).toBe(true))
  it('has routes without meta', () =>
    expect(router.getRoutes().some((r) => !r.meta.requiresAuth && !r.meta.requiresAdmin)).toBe(
      true,
    ))
  it('has catch-all 404', () =>
    expect(router.getRoutes().some((r) => r.name === 'not-found')).toBe(true))
  it('redirects requiresAuth routes to login when anonymous', async () => {
    const route = await navigate('/profile')
    expect(route.name).toBe('login')
  })
  it('redirects non-admin users away from admin route', async () => {
    const s = useUserStore()
    s.setSession({ user: { id: 'u', email: 'e' } })
    const route = await navigate('/admin/review')
    expect(route.name).toBe('home')
  })
  it('allows admin users through admin route', async () => {
    const s = useUserStore()
    s.setSession({ user: { id: 'u', email: 'e', role: 'admin' } })
    expect(s.isAdmin).toBe(true)
    const route = await navigate('/admin/review')
    expect(route.name).toBe('admin-review')
  })
})
