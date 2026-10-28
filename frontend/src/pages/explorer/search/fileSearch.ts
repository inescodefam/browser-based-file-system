export const SEARCH_DEBOUNCE_MS = 500

export type SearchMode = 'prefix' | 'exact'

export interface FileSearch {
  name: string
  mode: SearchMode
  parentId: string | null
}

export const parseSearchParams = (params: URLSearchParams): FileSearch | null => {
  const name = params.get('q')?.trim() ?? ''
  if (name === '') return null

  return {
    name,
    mode: params.get('match') === 'exact' ? 'exact' : 'prefix',
    parentId: params.get('in') || null,
  }
}

export const parseSearchUrl = (search: string): FileSearch | null =>
  parseSearchParams(new URLSearchParams(search.startsWith('?') ? search.slice(1) : search))

export const applySearchToParams = (
  current: URLSearchParams,
  search: FileSearch | null,
): URLSearchParams => {
  const params = new URLSearchParams(current)

  if (!search || search.name === '') {
    params.delete('q')
    params.delete('match')
    params.delete('in')
  } else {
    params.set('q', search.name)
    if (search.mode === 'exact') params.set('match', 'exact')
    else params.delete('match')

    if (search.parentId) params.set('in', search.parentId)
    else params.delete('in')
  }

  return params
}
