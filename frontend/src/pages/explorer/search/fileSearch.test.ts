import { describe, expect, it } from 'vitest'
import { SEARCH_FOLDER_PARAM, SEARCH_MATCH_PARAM, SEARCH_QUERY_PARAM } from './constants'
import { applySearchToParams, parseSearchUrl } from './fileSearch'

describe('parseSearchUrl', () => {
  it('reads a prefix search from q', () => {
    expect(parseSearchUrl(`?${SEARCH_QUERY_PARAM}=rep`)).toEqual({ name: 'rep', mode: 'prefix' })
  })

  it('reads an exact search from q and match', () => {
    expect(parseSearchUrl(`?${SEARCH_QUERY_PARAM}=notes.txt&${SEARCH_MATCH_PARAM}=exact`)).toEqual({
      name: 'notes.txt',
      mode: 'exact',
    })
  })

  it('reads a folder-scoped search', () => {
    expect(
      parseSearchUrl(`?${SEARCH_QUERY_PARAM}=report.pdf&${SEARCH_MATCH_PARAM}=exact&${SEARCH_FOLDER_PARAM}=id-1`),
    ).toEqual({
      name: 'report.pdf',
      mode: 'exact',
      parentId: 'id-1',
    })
  })

  it('returns nothing when q is missing or blank', () => {
    expect(parseSearchUrl('')).toBeUndefined()
    expect(parseSearchUrl(`?${SEARCH_QUERY_PARAM}=`)).toBeUndefined()
    expect(parseSearchUrl(`?${SEARCH_QUERY_PARAM}=%20`)).toBeUndefined()
  })
})

describe('applySearchToParams', () => {
  it('writes a prefix search as q', () => {
    const params = applySearchToParams(new URLSearchParams(), {
      name: 'rep',
      mode: 'prefix',
    })

    expect(params.toString()).toBe(`${SEARCH_QUERY_PARAM}=rep`)
  })

  it('writes an exact search as q and match', () => {
    const params = applySearchToParams(new URLSearchParams(), {
      name: 'notes.txt',
      mode: 'exact',
    })

    expect(params.toString()).toBe(`${SEARCH_QUERY_PARAM}=notes.txt&${SEARCH_MATCH_PARAM}=exact`)
  })

  it('writes a folder-scoped search as in', () => {
    const params = applySearchToParams(new URLSearchParams(), {
      name: 'report.pdf',
      mode: 'exact',
      parentId: 'id-1',
    })

    expect(params.toString()).toBe(
      `${SEARCH_QUERY_PARAM}=report.pdf&${SEARCH_MATCH_PARAM}=exact&${SEARCH_FOLDER_PARAM}=id-1`,
    )
  })

  it('clears the search params when there is no search', () => {
    const params = applySearchToParams(
      new URLSearchParams(
        `${SEARCH_QUERY_PARAM}=rep&${SEARCH_MATCH_PARAM}=exact&${SEARCH_FOLDER_PARAM}=id-1`,
      ),
    )

    expect(params.toString()).toBe('')
  })

  it('keeps unrelated params', () => {
    const params = applySearchToParams(new URLSearchParams('folder=id-1'), {
      name: 'rep',
      mode: 'prefix',
    })

    expect(params.get('folder')).toBe('id-1')
    expect(params.get(SEARCH_QUERY_PARAM)).toBe('rep')
  })
})
