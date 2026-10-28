import { Alert, Loader, Stack, Text, useTree } from '@mantine/core'
import { useMemo } from 'react'
import type { FileSystemItem } from '../../../api/types'
import { ReturnToAllFilesLink } from '../ReturnToAllFilesLink'
import { FileSystemTree } from '../items-tree/FileSystemTree'
import { filesToTreeData } from '../items-tree/utils'
import type { FileSearch } from './fileSearch'

export const SearchResults = ({
  search,
  files,
  isPending,
  error,
  isDeleting,
  onDelete,
}: {
  search: FileSearch
  files: FileSystemItem[] | undefined
  isPending: boolean
  error: Error | null
  isDeleting: boolean

  onDelete: (item: FileSystemItem) => void
}) => {
  const tree = useTree()
  const data = useMemo(() => filesToTreeData(files ?? []), [files])

  const scope = search.parentId ? ' in the selected folder' : search.mode === 'exact' ? ' in all files' : ''
  const title =
    search.mode === 'exact'
      ? `Files named "${search.name}"${scope}`
      : `Files starting with "${search.name}"${scope}`

  return (
    <Stack gap="xs">
      <Text fw={600}>{title}</Text>
      {isPending && <Loader size="sm" />}
      {error && (
        <Alert color="red">
          <Stack gap="xs">
            <span>{error.message}</span>
            <ReturnToAllFilesLink />
          </Stack>
        </Alert>
      )}
      {files?.length === 0 && (
        <Text c="dimmed">
          {search.mode === 'exact'
            ? 'No file with exactly this name.'
            : `No files start with "${search.name}".`}
        </Text>
      )}
      {files && files.length > 0 && (
        <FileSystemTree
          data={data}
          tree={tree}
          ariaLabel="Search results"
          onDelete={onDelete}
          isDeleting={isDeleting}
        />
      )}
    </Stack>
  )
}
