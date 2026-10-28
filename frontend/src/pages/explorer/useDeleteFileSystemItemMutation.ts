import { useMutation } from '@tanstack/react-query'
import { fileSystemItemsApi } from '../../api/fileSystemItems'
import { useInvalidateFileSystemItemsCallback } from './useInvalidateFileSystemItemsCallback'

export const useDeleteFileSystemItemMutation = () => {
  const invalidateItems = useInvalidateFileSystemItemsCallback()
  return useMutation({
    mutationFn: (id: string) => fileSystemItemsApi.remove(id),
    onSuccess: invalidateItems,
  })
}
