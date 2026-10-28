import { useQueries, type UseQueryResult } from '@tanstack/react-query'
import { childrenQueryOptions } from './childrenQueryOptions'
import type { FileSystemItem } from '../../../api/types'
import { folderKey, type ChildrenByFolder } from './utils'

type FolderChildren = { folderId?: string; items: FileSystemItem[] }

const combineResults = (results: UseQueryResult<FolderChildren>[]) => ({
  childrenByFolder: Object.fromEntries(
    results.flatMap((result) =>
      result.data ? [[folderKey(result.data.folderId), result.data.items]] : [],
    ),
  ) as ChildrenByFolder,
  isListingPending: results[0]?.isPending ?? false,
  listingError: results[0]?.error,
})

export const useChildrenQueries = (folderIds: (string | undefined)[]) =>
  useQueries({
    queries: folderIds.map((folderId) => ({
      ...childrenQueryOptions(folderId),
      select: (items: FileSystemItem[]): FolderChildren => ({ folderId, items }),
    })),
    combine: combineResults,
  })
