import { useQuery } from '@tanstack/react-query'
import { fileSystemItemsApi } from '../../api/fileSystemItems'
import { queryKeys } from '../../api/queryKeys'

export interface FileSearch {
  name: string
  parentId: string | null
}

export const useSearchQuery = ({ name, parentId }: FileSearch) =>
  useQuery({
    queryKey: queryKeys.search(name, parentId),
    queryFn: ({ signal }) => fileSystemItemsApi.searchByName(name, parentId, signal),
  })
