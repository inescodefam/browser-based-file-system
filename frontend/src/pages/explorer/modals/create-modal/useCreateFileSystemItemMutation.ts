import { useMutation } from '@tanstack/react-query'
import { fileSystemItemsApi } from '../../../../api/fileSystemItems'
import type { FileSystemItemType } from '../../../../api/types'
import { useInvalidateExplorerCache } from '../useInvalidateExplorerCache'

export const useCreateFileSystemItemMutation = (parentId?: string) => {
  const invalidateItems = useInvalidateExplorerCache()
  return useMutation({
    mutationFn: async ({ name, type }: { name: string; type: FileSystemItemType }) => {
      if (type === 'folder') return fileSystemItemsApi.createFolder(name, parentId)
      if (parentId === undefined) throw new Error('Files must be created in a folder')
      return fileSystemItemsApi.createFile(name, parentId)
    },
    onSuccess: invalidateItems,
  })
}
