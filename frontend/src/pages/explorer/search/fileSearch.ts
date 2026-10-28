import { SEARCH_FOLDER_PARAM, SEARCH_MATCH_PARAM, SEARCH_QUERY_PARAM } from './constants'

export const SEARCH_DEBOUNCE_MS = 500

export type SearchMode = 'prefix' | 'exact'

export type FileSearch = {
  name: string
  mode: SearchMode
  parentId?: string
}

export const parseSearchParams = (params: URLSearchParams): FileSearch | undefined => {
  const name = params.get(SEARCH_QUERY_PARAM)?.trim() ?? ''
  if (name === '') return undefined

  return {
    name,
    mode: params.get(SEARCH_MATCH_PARAM) === 'exact' ? 'exact' : 'prefix',
    parentId: params.get(SEARCH_FOLDER_PARAM) || undefined,
  }
}

export const parseSearchUrl = (search: string): FileSearch | undefined =>
  parseSearchParams(new URLSearchParams(search.startsWith('?') ? search.slice(1) : search))

export const applySearchToParams = (
  current: URLSearchParams,
  search?: FileSearch,
): URLSearchParams => {
  const params = new URLSearchParams(current)

  if (!search || search.name === '') {
    params.delete(SEARCH_QUERY_PARAM)
    params.delete(SEARCH_MATCH_PARAM)
    params.delete(SEARCH_FOLDER_PARAM)
  } else {
    params.set(SEARCH_QUERY_PARAM, search.name)
    if (search.mode === 'exact') params.set(SEARCH_MATCH_PARAM, 'exact')
    else params.delete(SEARCH_MATCH_PARAM)

    if (search.parentId) params.set(SEARCH_FOLDER_PARAM, search.parentId)
    else params.delete(SEARCH_FOLDER_PARAM)
  }

  return params
}
