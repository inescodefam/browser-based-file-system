import { useMutation } from '@tanstack/react-query'
import { fileSystemItemsApi } from '../../../../api/fileSystemItems'
import { useInvalidateExplorerCache } from '../useInvalidateExplorerCache'

export const useDeleteFileSystemItemMutation = () => {
  const invalidateItems = useInvalidateExplorerCache()
  return useMutation({
    mutationFn: async (id: string) => fileSystemItemsApi.remove(id),
    onSuccess: invalidateItems,
  })
}
