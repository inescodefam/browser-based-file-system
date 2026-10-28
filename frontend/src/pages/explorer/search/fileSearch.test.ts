import { describe, expect, it } from 'vitest'
import { applySearchToParams, parseSearchUrl } from './fileSearch'

describe('parseSearchUrl', () => {
  it('reads a prefix search from q', () => {
    expect(parseSearchUrl('?q=rep')).toEqual({ name: 'rep', mode: 'prefix', parentId: null })
  })

  it('reads an exact search from q and match', () => {
    expect(parseSearchUrl('?q=notes.txt&match=exact')).toEqual({
      name: 'notes.txt',
      mode: 'exact',
      parentId: null,
    })
  })

  it('reads a folder-scoped search', () => {
    expect(parseSearchUrl('?q=report.pdf&match=exact&in=id-1')).toEqual({
      name: 'report.pdf',
      mode: 'exact',
      parentId: 'id-1',
    })
  })

  it('returns nothing when q is missing or blank', () => {
    expect(parseSearchUrl('')).toBeNull()
    expect(parseSearchUrl('?q=')).toBeNull()
    expect(parseSearchUrl('?q=%20')).toBeNull()
  })
})

describe('applySearchToParams', () => {
  it('writes a prefix search as q', () => {
    const params = applySearchToParams(new URLSearchParams(), {
      name: 'rep',
      mode: 'prefix',
      parentId: null,
    })

    expect(params.toString()).toBe('q=rep')
  })

  it('writes an exact search as q and match', () => {
    const params = applySearchToParams(new URLSearchParams(), {
      name: 'notes.txt',
      mode: 'exact',
      parentId: null,
    })

    expect(params.toString()).toBe('q=notes.txt&match=exact')
  })

  it('writes a folder-scoped search as in', () => {
    const params = applySearchToParams(new URLSearchParams(), {
      name: 'report.pdf',
      mode: 'exact',
      parentId: 'id-1',
    })

    expect(params.toString()).toBe('q=report.pdf&match=exact&in=id-1')
  })

  it('clears the search params when there is no search', () => {
    const params = applySearchToParams(new URLSearchParams('q=rep&match=exact&in=id-1'), null)

    expect(params.toString()).toBe('')
  })

  it('keeps unrelated params', () => {
    const params = applySearchToParams(new URLSearchParams('folder=id-1'), {
      name: 'rep',
      mode: 'prefix',
      parentId: null,
    })

    expect(params.get('folder')).toBe('id-1')
    expect(params.get('q')).toBe('rep')
  })
})
