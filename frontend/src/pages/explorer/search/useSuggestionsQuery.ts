import { useQuery } from '@tanstack/react-query'
import { fileSystemItemsApi } from '../../../api/fileSystemItems'
import { queryKeys } from '../../../api/queryKeys'

export const useSuggestionsQuery = (prefix: string, parentId: string | null = null) =>
  useQuery({
    queryKey: queryKeys.suggestions(prefix, parentId),
    queryFn: ({ signal }) => fileSystemItemsApi.suggest(prefix, parentId, signal),
    enabled: prefix !== '',
  })
