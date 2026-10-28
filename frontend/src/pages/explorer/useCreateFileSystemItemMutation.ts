import { useMutation } from '@tanstack/react-query'
import { fileSystemItemsApi } from '../../api/fileSystemItems'
import type { FileSystemItemType } from '../../api/types'
import { useInvalidateFileSystemItemsCallback } from './useInvalidateFileSystemItemsCallback'

export const useCreateFileSystemItemMutation = (parentId: string | null) => {
  const invalidateItems = useInvalidateFileSystemItemsCallback()
  return useMutation({
    mutationFn: ({ name, type }: { name: string; type: FileSystemItemType }) =>
      type === 'folder'
        ? fileSystemItemsApi.createFolder(name, parentId)
        : fileSystemItemsApi.createFile(name, parentId),
    onSuccess: invalidateItems,
  })
}
