import { Alert, Button, Group, Loader, Stack, Text, useTree } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { childrenQueryOptions } from '../../api/childrenQueryOptions'
import type { FileSystemItem } from '../../api/types'
import { buildTreeData } from './items-tree/buildTreeData'
import { folderKey } from './items-tree/childrenByFolder'
import { collectFolderIds } from './items-tree/collectFolderIds'
import { CreateFileSystemItemModal } from './create-modal/CreateFileSystemItemModal'
import { FileSystemTree } from './items-tree/FileSystemTree'
import { FolderBreadcrumbs } from './FolderBreadcrumbs'
import { getFolderPath } from './items-tree/getFolderPath'
import { SearchBox } from './search/SearchBox'
import { SearchResults } from './search/SearchResults'
import { useChildrenQueries } from './items-tree/useChildrenQueries'
import { useDeleteFileSystemItemMutation } from './useDeleteFileSystemItemMutation'
import type { FileSearch } from './search/useSearchQuery'

export const ExplorerPage = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState<FileSearch | null>(null)
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false)

  const [visitedFolderIds, setVisitedFolderIds] = useState<string[]>([])

  const tree = useTree({
    onNodeExpand: (folderId) =>
      setVisitedFolderIds((ids) => (ids.includes(folderId) ? ids : [...ids, folderId])),
    onLoadChildren: async (folderId) => {
      await queryClient.fetchQuery(childrenQueryOptions(folderId))
    },
  })

  const { childrenByFolder, isTopLevelPending, topLevelError } = useChildrenQueries([
    null,
    ...visitedFolderIds,
  ])
  const treeData = useMemo(() => buildTreeData(childrenByFolder), [childrenByFolder])
  const deleteItem = useDeleteFileSystemItemMutation()

  const itemsById = new Map(
    Object.values(childrenByFolder)
      .flat()
      .map((item) => [item.id, item]),
  )
  const topLevelItems = childrenByFolder[folderKey(null)]
  const path = getFolderPath(tree.selectedState[0] ?? null, itemsById)
  const currentFolder = path.at(-1) ?? null

  const navigateTo = (depth: number) => {
    if (depth === 0) tree.clearSelected()
    else tree.select(path[depth - 1].id)
  }

  const forgetDeletedFolders = (deleted: FileSystemItem) => {
    const removed = new Set(collectFolderIds(deleted.id, childrenByFolder))
    setVisitedFolderIds((ids) => ids.filter((id) => !removed.has(id)))
  }

  const deleteWithConfirmation = (item: FileSystemItem) => {
    const question =
      item.type === 'folder'
        ? `Delete folder "${item.name}" and everything inside it?`
        : `Delete file "${item.name}"?`
    if (window.confirm(question)) {
      deleteItem.mutate(item.id, { onSuccess: () => forgetDeletedFolders(item) })
    }
  }

  return (
    <Stack>
      <SearchBox currentFolder={currentFolder} onSearch={setSearch} />
      {search && <SearchResults search={search} onClear={() => setSearch(null)} />}

      <Group justify="space-between">
        <FolderBreadcrumbs path={path} onNavigate={navigateTo} />
        <Button onClick={openCreate}>Create</Button>
      </Group>
      <CreateFileSystemItemModal opened={createOpened} onClose={closeCreate} parent={currentFolder} />

      {deleteItem.error && <Alert color="red">{deleteItem.error.message}</Alert>}

      {isTopLevelPending && <Loader size="sm" />}
      {topLevelError && (
        <Alert color="red" title="Could not load your files">
          {topLevelError.message}
        </Alert>
      )}
      {topLevelItems?.length === 0 && <Text c="dimmed">No items yet.</Text>}
      {topLevelItems && topLevelItems.length > 0 && (
        <FileSystemTree
          data={treeData}
          tree={tree}
          onDelete={deleteWithConfirmation}
          isDeleting={deleteItem.isPending}
        />
      )}
    </Stack>
  )
}
