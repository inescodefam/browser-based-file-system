import type { TreeNodeData } from '@mantine/core'
import { folderKey, type ChildrenByFolder } from './childrenByFolder'

export const buildTreeData = (
  childrenByFolder: ChildrenByFolder,
  rootId: string | null = null,
): TreeNodeData[] => {
  const toNodes = (folderId: string | null): TreeNodeData[] =>
    (childrenByFolder[folderKey(folderId)] ?? []).map((item): TreeNodeData => {
      if (item.type === 'file') {
        return { value: item.id, label: item.name, nodeProps: { item } }
      }

      const loadedChildren = childrenByFolder[item.id]
      return {
        value: item.id,
        label: item.name,
        nodeProps: { item, isEmpty: loadedChildren?.length === 0 },
        hasChildren: loadedChildren === undefined || loadedChildren.length > 0,
        children: loadedChildren === undefined ? undefined : toNodes(item.id),
      }
    })

  return toNodes(rootId)
}
