import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useThemeStore } from '@/stores/theme'

describe('theme store', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    setActivePinia(createPinia())
  })

  it('initializes from localStorage and exposes isDark', () => {
    localStorage.setItem('theme', 'light')
    const store = useThemeStore()
    expect(store.mode).toBe('light')
    expect(store.isDark).toBe(false)
  })

  it('toggles mode, persists, and applies document classes', () => {
    const store = useThemeStore()
    store.mode = 'dark'
    store.toggle()
    expect(store.mode).toBe('light')
    expect(localStorage.getItem('theme')).toBe('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    store.toggle()
    expect(store.mode).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
