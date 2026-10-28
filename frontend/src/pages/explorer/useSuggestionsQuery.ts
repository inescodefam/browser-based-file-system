import { useQuery } from '@tanstack/react-query'
import { fileSystemItemsApi } from '../../api/fileSystemItems'
import { queryKeys } from '../../api/queryKeys'

export const useSuggestionsQuery = (prefix: string) =>
  useQuery({
    queryKey: queryKeys.suggestions(prefix),
    queryFn: ({ signal }) => fileSystemItemsApi.suggest(prefix, signal),
    enabled: prefix !== '',
  })
