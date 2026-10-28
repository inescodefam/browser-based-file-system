import { Alert, Button, Group, Loader, Stack } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useCallback, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type { FileSystemItem } from '../../api/types'
import { FolderContents } from './items-tree/FolderContents'
import { CreateFileSystemItemModal } from './modals/create-modal/CreateFileSystemItemModal'
import { DeleteFileSystemItemModal } from './modals/delete-modal/DeleteFileSystemItemModal'
import { FolderBreadcrumbs } from './FolderBreadcrumbs'
import { SearchBox } from './search/SearchBox'
import { SearchResults } from './search/SearchResults'
import { applySearchToParams, parseSearchParams } from './search/fileSearch'
import { useAncestorsQuery } from './items-tree/useAncestorsQuery'
import { useSearchQuery } from './search/useSearchQuery'
import { useSuggestionsQuery } from './search/useSuggestionsQuery'

const folderPathname = (folderId?: string) => (folderId ? `/folders/${folderId}` : '/')

export const ExplorerPage = () => {
  const navigate = useNavigate()
  const { folderId: folderIdParam } = useParams<{ folderId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const search = parseSearchParams(searchParams)
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false)
  const [itemToDelete, setItemToDelete] = useState<FileSystemItem>()

  const ancestors = useAncestorsQuery(folderIdParam)
  const path = ancestors.data ?? []
  const currentFolder = path.at(-1)
  const prefixResults = useSuggestionsQuery(
    search?.mode === 'prefix' ? search.name : '',
    search?.parentId,
  )
  const exactResults = useSearchQuery(search)
  const searchResults = search?.mode === 'exact' ? exactResults : prefixResults

  const searchParamsString = searchParams.toString()
  const navigateToFolder = useCallback(
    (folderId?: string) => {
      navigate({ pathname: folderPathname(folderId), search: searchParamsString.length > 0 ? `?${searchParamsString}` : '' })
    },
    [navigate, searchParamsString],
  )

  const onPrefix = useCallback(
    (term: string, parentId?: string) => {
      setSearchParams(
        (current) => { 
          if (term === '') return applySearchToParams(current)
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
    (name: string, parentId?: string) => {
      setSearchParams(
        (current) => applySearchToParams(current, { name, mode: 'exact', parentId }),
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const onDeleted = useCallback((item: FileSystemItem) => {
    if (item.id === folderIdParam) navigateToFolder(item.parentId ?? undefined)
  }, [folderIdParam, navigateToFolder])

  return (
    <Stack>
      <SearchBox
        currentFolder={currentFolder}
        initialTerm={search?.name ?? ''}
        initialOnlyInFolder={search?.parentId !== undefined}
        onPrefix={onPrefix}
        onExact={onExact}
      />

      <Group justify="space-between">
        <FolderBreadcrumbs path={path} onNavigate={(depth) => navigateToFolder(path[depth - 1]?.id)} />
        <Button onClick={openCreate}>Create</Button>
      </Group>
      <CreateFileSystemItemModal opened={createOpened} onClose={closeCreate} parent={currentFolder} />
      <DeleteFileSystemItemModal
        item={itemToDelete}
        onClose={() => setItemToDelete(undefined)}
        onDeleted={onDeleted}
      />

      {search ? (
        <SearchResults
          search={search}
          files={searchResults.data}
          isPending={searchResults.isPending}
          error={searchResults.error}
          onDelete={setItemToDelete}
          isDeleting={itemToDelete !== undefined}
        />
      ) : (
        <>
          {ancestors.isPending && folderIdParam && <Loader size="sm" />}
          {ancestors.error && (
            <Alert color="red" title="Could not open this folder">
              {ancestors.error.message}
            </Alert>
          )}
          {(folderIdParam === undefined || ancestors.data) && (
            <FolderContents
              key={folderIdParam ?? 'root'}
              folderId={folderIdParam}
              onOpenFolder={(folder) => navigateToFolder(folder.id)}
              onDelete={setItemToDelete}
              isDeleting={itemToDelete !== undefined}
            />
          )}
        </>
      )}
    </Stack>
  )
}
