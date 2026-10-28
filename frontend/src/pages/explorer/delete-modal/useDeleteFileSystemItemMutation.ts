import { useMutation } from '@tanstack/react-query'
import { fileSystemItemsApi } from '../../../api/fileSystemItems'
import { useInvalidateItemsCallback } from '../useInvalidateItemsCallback'

export const useDeleteFileSystemItemMutation = () => {
  const invalidateItems = useInvalidateItemsCallback()
  return useMutation({
    mutationFn: (id: string) => fileSystemItemsApi.remove(id),
    onSuccess: invalidateItems,
  })
}
