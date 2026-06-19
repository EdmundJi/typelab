import { describe, expect, it } from 'vitest'
import { getAvatar } from '@/lib/avatar'

describe('getAvatar', () => {
  it('handles empty string', () => expect(getAvatar('')).toBeTruthy())
  it('handles one character', () => expect(getAvatar('a')).toBeTruthy())
  it('is stable for same input', () =>
    expect(getAvatar('alice@example.com')).toEqual(getAvatar('alice@example.com')))
  it('varies for different input', () =>
    expect(getAvatar('a@example.com')).not.toEqual(getAvatar('b@example.com')))
})
