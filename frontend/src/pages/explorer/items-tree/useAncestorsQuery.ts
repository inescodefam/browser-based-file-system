import { useQuery } from '@tanstack/react-query'
import { fileSystemItemsApi } from '../../../api/fileSystemItems'
import { queryKeys } from '../../../api/queryKeys'

export const useAncestorsQuery = (folderId: string | null) =>
  useQuery({
    queryKey: queryKeys.ancestors(folderId ?? ''),
    queryFn: ({ signal }) => fileSystemItemsApi.ancestors(folderId!, signal),
    enabled: folderId !== null,
  })
