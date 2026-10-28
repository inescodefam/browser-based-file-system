import { useMutation } from '@tanstack/react-query'
import { fileSystemItemsApi } from '../../../api/fileSystemItems'
import type { FileSystemItemType } from '../../../api/types'
import { useInvalidateItemsCallback } from '../useInvalidateItemsCallback'

export const useCreateFileSystemItemMutation = (parentId: string | null) => {
  const invalidateItems = useInvalidateItemsCallback()
  return useMutation({
    mutationFn: ({ name, type }: { name: string; type: FileSystemItemType }) => {
      if (type === 'folder') return fileSystemItemsApi.createFolder(name, parentId)
      if (parentId === null) return Promise.reject(new Error('Files must be created in a folder'))
      return fileSystemItemsApi.createFile(name, parentId)
    },
    onSuccess: invalidateItems,
  })
}
