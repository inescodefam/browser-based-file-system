import type { TreeNodeData } from '@mantine/core'
import type { FileSystemItem } from '../../../api/types'
import type { FolderRef } from '../FolderBreadcrumbs'

export type ChildrenByFolder = Record<string, FileSystemItem[]>

const TOP_LEVEL_KEY = 'top-level'

export const folderKey = (folderId: string | undefined): string => folderId ?? TOP_LEVEL_KEY

export const collectFolderIds = (
  folderId: string,
  childrenByFolder: ChildrenByFolder,
): string[] => [
  folderId,
  ...(childrenByFolder[folderId] ?? [])
    .filter((item) => item.type === 'folder')
    .flatMap((folder) => collectFolderIds(folder.id, childrenByFolder)),
]

export const buildTreeData = (
  childrenByFolder: ChildrenByFolder,
  rootId?: string,
): TreeNodeData[] => {
  const toNodes = (folderId?: string): TreeNodeData[] =>
    (childrenByFolder[folderKey(folderId)] ?? []).map((item): TreeNodeData => {
      if (item.type === 'file') {
        return { value: item.id, label: item.name, nodeProps: { item } }
      }

      const loadedChildren = childrenByFolder[item.id]
      const notLoaded = loadedChildren === undefined

      return {
        value: item.id,
        label: item.name,
        nodeProps: { item, isEmpty: loadedChildren?.length === 0 },
        hasChildren: notLoaded || loadedChildren.length > 0,
        children: notLoaded ? undefined : toNodes(item.id),
      }
    })

  return toNodes(rootId)
}

export const filesToTreeData = (files: FileSystemItem[]): TreeNodeData[] =>
  files.map((item) => ({ value: item.id, label: item.name, nodeProps: { item } }))

export const getFolderPath = (
  folderId: string | undefined,
  itemsById: Map<string, FileSystemItem>,
): FolderRef[] => {
  const path: FolderRef[] = []
  let current = folderId === undefined ? undefined : itemsById.get(folderId)

  while (current) {
    path.unshift({ id: current.id, name: current.name })
    current = current.parentId === null ? undefined : itemsById.get(current.parentId)
  }
  return path
}
