import { useMutation } from '@tanstack/react-query'
import { fileSystemItemsApi } from '../../api/fileSystemItems'
import { useInvalidateFileSystemItems } from './useInvalidateFileSystemItems'

export const useDeleteFileSystemItem = () => {
  const invalidateItems = useInvalidateFileSystemItems()
  return useMutation({
    mutationFn: (id: string) => fileSystemItemsApi.remove(id),
    onSuccess: invalidateItems,
  })
}
