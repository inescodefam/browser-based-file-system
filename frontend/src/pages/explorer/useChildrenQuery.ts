import { useQuery } from '@tanstack/react-query'
import { fileSystemItemsApi } from '../../api/fileSystemItems'
import { queryKeys } from '../../api/queryKeys'

export const useChildrenQuery = (parentId: string | null) =>
  useQuery({
    queryKey: queryKeys.children(parentId),
    queryFn: ({ signal }) => fileSystemItemsApi.list(parentId, signal),
  })
