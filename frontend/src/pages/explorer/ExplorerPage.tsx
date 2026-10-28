import { Alert, Button, Group, Loader, Stack, Text, useTree } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { childrenQueryOptions } from '../../api/childrenQueryOptions'
import type { FileSystemItem } from '../../api/types'
import { buildTreeData } from './items-tree/buildTreeData'
import { folderKey } from './items-tree/childrenByFolder'
import { collectFolderIds } from './items-tree/collectFolderIds'
import { CreateFileSystemItemModal } from './create-modal/CreateFileSystemItemModal'
import { DeleteFileSystemItemModal } from './delete-modal/DeleteFileSystemItemModal'
import { FileSystemTree } from './items-tree/FileSystemTree'
import { FolderBreadcrumbs, type FolderRef } from './FolderBreadcrumbs'
import { SearchBox } from './search/SearchBox'
import { SearchResults } from './search/SearchResults'
import { applySearchToParams, parseSearchParams } from './search/fileSearch'
import { useAncestorsQuery } from './items-tree/useAncestorsQuery'
import { useChildrenQueries } from './items-tree/useChildrenQueries'
import { useSearchQuery } from './search/useSearchQuery'
import { useSuggestionsQuery } from './search/useSuggestionsQuery'

const folderPathname = (folderId: string | null) => (folderId ? `/folders/${folderId}` : '/')

const FolderContents = ({
  folderId,
  onOpenFolder,
  onDelete,
  isDeleting,
}: {
  folderId: string | null
  onOpenFolder: (folder: FileSystemItem) => void
  onDelete: (item: FileSystemItem) => void
  isDeleting: boolean
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
          {listingError.message}
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

export const ExplorerPage = () => {
  const navigate = useNavigate()
  const { folderId: folderIdParam } = useParams<{ folderId: string }>()
  const currentFolderId = folderIdParam ?? null
  const [searchParams, setSearchParams] = useSearchParams()
  const search = parseSearchParams(searchParams)
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false)
  const [itemToDelete, setItemToDelete] = useState<FileSystemItem | null>(null)

  const ancestors = useAncestorsQuery(currentFolderId)
  const path: FolderRef[] = (ancestors.data ?? []).map(({ id, name }) => ({ id, name }))
  const currentFolder = path.at(-1) ?? null
  const prefixResults = useSuggestionsQuery(
    search?.mode === 'prefix' ? search.name : '',
    search?.parentId ?? null,
  )
  const exactResults = useSearchQuery(search)
  const searchResults = search?.mode === 'exact' ? exactResults : prefixResults

  const navigateToFolder = useCallback(
    (folderId: string | null) => {
      const query = searchParams.toString()
      navigate({ pathname: folderPathname(folderId), search: query ? `?${query}` : '' })
    },
    [navigate, searchParams],
  )

  const onPrefix = useCallback(
    (term: string, parentId: string | null = null) => {
      setSearchParams(
        (current) => {
          if (term === '') return applySearchToParams(current, null)
          const existing = parseSearchParams(current)
          if (existing?.name === term && existing.parentId === parentId) return current
          if (existing?.mode === 'exact' && existing.name === term) {
            return applySearchToParams(current, { ...existing, parentId })
          }
          return applySearchToParams(current, { name: term, mode: 'prefix', parentId })
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const onExact = useCallback(
    (name: string, parentId: string | null) => {
      setSearchParams(
        (current) => applySearchToParams(current, { name, mode: 'exact', parentId }),
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const onDeleted = (item: FileSystemItem) => {
    if (item.id === currentFolderId) navigateToFolder(item.parentId)
  }

  return (
    <Stack>
      <SearchBox
        currentFolder={currentFolder}
        initialTerm={search?.name ?? ''}
        initialOnlyInFolder={search?.parentId != null}
        onPrefix={onPrefix}
        onExact={onExact}
      />

      <Group justify="space-between">
        <FolderBreadcrumbs path={path} onNavigate={(depth) => navigateToFolder(path[depth - 1]?.id ?? null)} />
        <Button onClick={openCreate}>Create</Button>
      </Group>
      <CreateFileSystemItemModal opened={createOpened} onClose={closeCreate} parent={currentFolder} />
      <DeleteFileSystemItemModal
        item={itemToDelete}
        onClose={() => setItemToDelete(null)}
        onDeleted={onDeleted}
      />

      {search ? (
        <SearchResults
          search={search}
          files={searchResults.data}
          isPending={searchResults.isPending}
          error={searchResults.error}
          onDelete={setItemToDelete}
          isDeleting={itemToDelete !== null}
        />
      ) : (
        <>
          {ancestors.isPending && currentFolderId !== null && <Loader size="sm" />}
          {ancestors.error && (
            <Alert color="red" title="Could not open this folder">
              {ancestors.error.message}
            </Alert>
          )}
          {(currentFolderId === null || ancestors.data) && (
            <FolderContents
              key={currentFolderId ?? 'root'}
              folderId={currentFolderId}
              onOpenFolder={(folder) => navigateToFolder(folder.id)}
              onDelete={setItemToDelete}
              isDeleting={itemToDelete !== null}
            />
          )}
        </>
      )}
    </Stack>
  )
}
