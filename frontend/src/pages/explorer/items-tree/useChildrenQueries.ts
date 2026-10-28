import { useQueries, type UseQueryResult } from '@tanstack/react-query'
import { childrenQueryOptions } from '../../../api/childrenQueryOptions'
import type { FileSystemItem } from '../../../api/types'
import { folderKey, type ChildrenByFolder } from './childrenByFolder'

type FolderChildren = { folderId: string | null; items: FileSystemItem[] }

const combineResults = (results: UseQueryResult<FolderChildren>[]) => ({
  childrenByFolder: Object.fromEntries(
    results.flatMap((result) =>
      result.data ? [[folderKey(result.data.folderId), result.data.items]] : [],
    ),
  ) as ChildrenByFolder,
  isListingPending: results[0]?.isPending ?? false,
  listingError: results[0]?.error ?? null,
})

export const useChildrenQueries = (folderIds: (string | null)[]) =>
  useQueries({
    queries: folderIds.map((folderId) => ({
      ...childrenQueryOptions(folderId),
      select: (items: FileSystemItem[]): FolderChildren => ({ folderId, items }),
    })),
    combine: combineResults,
  })
