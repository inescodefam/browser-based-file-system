import { useQuery } from '@tanstack/react-query'
import { fileSystemItemsApi } from '../../../api/fileSystemItems'
import { queryKeys } from '../../../api/queryKeys'
import type { FileSearch } from './fileSearch'

export const useSearchQuery = (search: FileSearch | null) =>
  useQuery({
    queryKey: queryKeys.search(search?.name ?? '', search?.parentId ?? null),
    queryFn: ({ signal }) =>
      fileSystemItemsApi.searchByName(search!.name, search!.parentId, signal),
    enabled: search !== null && search.mode === 'exact' && search.name !== '',
  })
