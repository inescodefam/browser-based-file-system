import { Alert, Loader, Stack, Text, useTree } from '@mantine/core'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { childrenQueryOptions } from './childrenQueryOptions'
import type { FileSystemItem } from '../../../api/types'
import { buildTreeData, collectFolderIds, folderKey } from './utils'
import { ReturnToAllFilesLink } from '../ReturnToAllFilesLink'
import { FileSystemTree } from './FileSystemTree'
import { useChildrenQueries } from './useChildrenQueries'

export const FolderContents = ({
  folderId,
  onOpenFolder,
  onDelete,
  isDeleting,
}: {
  folderId?: string
  isDeleting: boolean

  onOpenFolder: (folder: FileSystemItem) => void
  onDelete: (item: FileSystemItem) => void
}) => {
  const queryClient = useQueryClient()
  const [visitedFolderIds, setVisitedFolderIds] = useState<string[]>([])

  const tree = useTree({
    onNodeExpand: (id) => setVisitedFolderIds((ids) => (ids.includes(id) ? ids : [...ids, id])),
    onLoadChildren: async (id) => {
      await queryClient.fetchQuery(childrenQueryOptions(id))
    },
  })

  const { childrenByFolder, isListingPending, listingError } = useChildrenQueries([
    folderId,
    ...visitedFolderIds,
  ])
  const treeData = useMemo(
    () => buildTreeData(childrenByFolder, folderId),
    [childrenByFolder, folderId],
  )
  const listing = childrenByFolder[folderKey(folderId)]

  const handleDelete = (item: FileSystemItem) => {
    const removed = new Set(collectFolderIds(item.id, childrenByFolder))
    setVisitedFolderIds((ids) => ids.filter((id) => !removed.has(id)))
    onDelete(item)
  }

  return (
    <>
      {isListingPending && <Loader size="sm" />}
      {listingError && (
        <Alert color="red" title="Could not load your files">
          {folderId ? (
            <Stack gap="xs">
              <span>{listingError.message}</span>
              <ReturnToAllFilesLink />
            </Stack>
          ) : (
            listingError.message
          )}
        </Alert>
      )}
      {listing?.length === 0 && <Text c="dimmed">No items yet.</Text>}
      {listing && listing.length > 0 && (
        <FileSystemTree
          data={treeData}
          tree={tree}
          onDelete={handleDelete}
          isDeleting={isDeleting}
          onOpenFolder={onOpenFolder}
        />
      )}
    </>
  )
}
