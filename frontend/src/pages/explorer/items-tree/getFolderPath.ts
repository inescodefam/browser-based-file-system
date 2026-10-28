import type { FileSystemItem } from '../../../api/types'
import type { FolderRef } from '../FolderBreadcrumbs'

export const getFolderPath = (
  folderId: string | null,
  itemsById: Map<string, FileSystemItem>,
): FolderRef[] => {
  const path: FolderRef[] = []
  let current = folderId === null ? undefined : itemsById.get(folderId)

  while (current) {
    path.unshift({ id: current.id, name: current.name })
    current = current.parentId === null ? undefined : itemsById.get(current.parentId)
  }
  return path
}
