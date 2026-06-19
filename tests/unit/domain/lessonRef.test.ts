import { describe, expect, it } from 'vitest'
import { build, parse } from '../../../src/lib/domain/lessonRef'

describe('lessonRef.parse', () => {
  it('parses builtin ref correctly', () => {
    expect(parse('builtin:py-bfs-01')).toEqual({ type: 'builtin', id: 'py-bfs-01' })
  })

  it('parses community ref correctly', () => {
    expect(parse('community:uuid-here')).toEqual({ type: 'community', id: 'uuid-here' })
  })

  it('throws on missing colon', () => {
    expect(() => parse('builtin-py-bfs-01')).toThrow()
  })

  it('throws on empty type', () => {
    expect(() => parse(':py-bfs-01')).toThrow()
  })

  it('throws on empty id', () => {
    expect(() => parse('builtin:')).toThrow()
  })

  it('throws on unknown type', () => {
    expect(() => parse('unknown:some-id')).toThrow()
  })

  it('throws on non-string input', () => {
    expect(() => parse(null)).toThrow()
    expect(() => parse(42)).toThrow()
  })
})

describe('lessonRef.build', () => {
  it('builds builtin ref correctly', () => {
    expect(build({ type: 'builtin', id: 'py-bfs-01' })).toBe('builtin:py-bfs-01')
  })

  it('builds community ref correctly', () => {
    expect(build({ type: 'community', id: 'uuid-here' })).toBe('community:uuid-here')
  })

  it('throws on missing type', () => {
    expect(() => build({ type: '', id: 'py-bfs-01' })).toThrow()
  })

  it('throws on missing id', () => {
    expect(() => build({ type: 'builtin', id: '' })).toThrow()
  })

  it('throws on unknown type', () => {
    expect(() => build({ type: 'unknown', id: 'some-id' })).toThrow()
  })
})

describe('lessonRef round-trip', () => {
  it('parse → build is consistent for builtin', () => {
    const ref = 'builtin:py-bfs-01'
    expect(build(parse(ref))).toBe(ref)
  })

  it('parse → build is consistent for community', () => {
    const ref = 'community:550e8400-e29b-41d4-a716-446655440000'
    expect(build(parse(ref))).toBe(ref)
  })

  it('build → parse is consistent', () => {
    const obj = { type: 'builtin', id: 'py-bfs-01' }
    expect(parse(build(obj))).toEqual(obj)
  })
})
