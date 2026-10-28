import { queryOptions } from '@tanstack/react-query'
import { fileSystemItemsApi } from './fileSystemItems'
import { queryKeys } from './queryKeys'

export const childrenQueryOptions = (parentId: string | null) =>
  queryOptions({
    queryKey: queryKeys.children(parentId),
    queryFn: ({ signal }) => fileSystemItemsApi.list(parentId, signal),
  })
