import { Alert, Button, Group, Loader, Stack } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useState } from 'react'
import type { FileSystemItem } from '../../api/types'
import { CreateFileSystemItemModal } from './CreateFileSystemItemModal'
import { FileSystemItemList } from './FileSystemItemList'
import { FolderBreadcrumbs, type FolderRef } from './FolderBreadcrumbs'
import { SearchBox } from './SearchBox'
import { SearchResults } from './SearchResults'
import { useChildrenQuery } from './useChildrenQuery'
import { useDeleteFileSystemItemMutation } from './useDeleteFileSystemItemMutation'
import type { FileSearch } from './useSearchQuery'

export const ExplorerPage = () => {
  const [path, setPath] = useState<FolderRef[]>([])
  const [search, setSearch] = useState<FileSearch | null>(null)
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false)
  const currentFolder = path.at(-1) ?? null
  const currentFolderId = currentFolder?.id ?? null

  const children = useChildrenQuery(currentFolderId)
  const deleteItem = useDeleteFileSystemItemMutation()

  const openFolder = (folder: FileSystemItem) => {
    deleteItem.reset()
    setPath([...path, { id: folder.id, name: folder.name }])
  }

  const navigateTo = (depth: number) => {
    deleteItem.reset()
    setPath(path.slice(0, depth))
  }

  const deleteWithConfirmation = (item: FileSystemItem) => {
    const question =
      item.type === 'folder'
        ? `Delete folder "${item.name}" and everything inside it?`
        : `Delete file "${item.name}"?`
    if (window.confirm(question)) {
      deleteItem.mutate(item.id)
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

      {children.isPending && <Loader size="sm" />}
      {children.error && (
        <Alert color="red" title="Could not load this folder">
          {children.error.message}
          {path.length > 0 && (
            <Button variant="light" size="xs" ml="sm" onClick={() => navigateTo(0)}>
              Back to all items
            </Button>
          )}
        </Alert>
      )}
      {children.data && (
        <FileSystemItemList
          items={children.data}
          onOpenFolder={openFolder}
          onDelete={deleteWithConfirmation}
          isDeleting={deleteItem.isPending}
        />
      )}
    </Stack>
  )
}
