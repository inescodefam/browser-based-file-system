import { Alert, Button, Loader, Stack } from '@mantine/core'
import { useState } from 'react'
import type { FileSystemItem } from '../../api/types'
import { CreateFileSystemItemForm } from './CreateFileSystemItemForm'
import { FileSystemItemList } from './FileSystemItemList'
import { FolderBreadcrumbs, type FolderRef } from './FolderBreadcrumbs'
import { useChildren } from './useChildren'
import { useDeleteFileSystemItem } from './useDeleteFileSystemItem'

const TOP_LEVEL_FORM_KEY = 'top-level'

export const ExplorerPage = () => {
  const [path, setPath] = useState<FolderRef[]>([])
  const currentFolderId = path.at(-1)?.id ?? null

  const children = useChildren(currentFolderId)
  const deleteItem = useDeleteFileSystemItem()

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
      <FolderBreadcrumbs path={path} onNavigate={navigateTo} />
      <CreateFileSystemItemForm key={currentFolderId ?? TOP_LEVEL_FORM_KEY} parentId={currentFolderId} />

      {deleteItem.error && <Alert color="red">{deleteItem.error.message}</Alert>}

      {children.isPending && <Loader size="sm" />}
      {children.error && (
        <Alert color="red" title="Could not load this folder">
          {children.error.message}
          {path.length > 0 && (
            <Button variant="light" size="xs" ml="sm" onClick={() => navigateTo(0)}>
              Back to all files
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
