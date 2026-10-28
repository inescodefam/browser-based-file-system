import { queryOptions } from '@tanstack/react-query'
import { fileSystemItemsApi } from '../../../api/fileSystemItems'
import { queryKeys } from '../../../api/queryKeys'

export const childrenQueryOptions = (parentId: string | undefined) =>
  queryOptions({
    queryKey: queryKeys.children(parentId),
    queryFn: ({ signal }) => fileSystemItemsApi.list(parentId, signal),
  })
