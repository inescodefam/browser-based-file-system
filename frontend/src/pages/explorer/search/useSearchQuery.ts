import { useQuery } from '@tanstack/react-query'
import { fileSystemItemsApi } from '../../../api/fileSystemItems'
import { queryKeys } from '../../../api/queryKeys'
import type { FileSearch } from './fileSearch'

export const useSearchQuery = (search?: FileSearch) =>
  useQuery({
    queryKey: queryKeys.search(search?.name, search?.parentId),
    queryFn: ({ signal }) =>
      fileSystemItemsApi.searchByName(search!.name, search!.parentId, signal),
    enabled: search !== undefined && search.mode === 'exact' && search.name !== '',
  })
