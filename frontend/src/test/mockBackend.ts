import type { Mocked } from 'vitest'
import { ApiError } from '../api/http'
import type { fileSystemItemsApi } from '../api/fileSystemItems'
import type { FileSystemItem, FileSystemItemType } from '../api/types'

const SUGGESTION_LIMIT = 10

export const installMockBackend = (api: Mocked<typeof fileSystemItemsApi>) => {
  let nextId = 1
  const backend = {
    items: [] as FileSystemItem[],
    add: (name: string, type: FileSystemItemType, parentId?: string) => {
      const item: FileSystemItem = {
        id: `id-${nextId++}`,
        name,
        type,
        parentId: parentId ?? null,
        createdAt: '2026-10-28T10:00:00.000Z',
      }
      backend.items.push(item)
      return item
    },
  }

  const isInside = (item: FileSystemItem, folderId: string): boolean => {
    if (item.parentId === null) return false
    if (item.parentId === folderId) return true
    const parent = backend.items.find((candidate) => candidate.id === item.parentId)
    return parent ? isInside(parent, folderId) : false
  }

  api.list.mockImplementation(async (parentId) =>
    backend.items.filter((item) => (item.parentId ?? undefined) === parentId),
  )
  api.ancestors.mockImplementation(async (folderId) => {
    const folder = backend.items.find((item) => item.id === folderId)
    if (!folder) throw new ApiError(404, `Folder "${folderId}" does not exist`)
    if (folder.type !== 'folder') throw new ApiError(400, `"${folder.name}" is not a folder`)
    const chain: FileSystemItem[] = []
    let current: FileSystemItem | undefined = folder
    while (current) {
      chain.unshift(current)
      const parentId: string | undefined = current.parentId ?? undefined
      current = parentId ? backend.items.find((item) => item.id === parentId) : undefined
    }
    return chain
  })
  api.createFolder.mockImplementation(async (name, parentId) =>
    backend.add(name, 'folder', parentId),
  )
  api.createFile.mockImplementation(async (name, parentId) =>
    backend.add(name, 'file', parentId),
  )
  api.remove.mockImplementation(async (id) => {
    backend.items = backend.items.filter((item) => item.id !== id && item.parentId !== id)
  })
  api.searchByName.mockImplementation(async (name, parentId) =>
    backend.items.filter(
      (item) =>
        item.type === 'file' && item.name === name && (!parentId || isInside(item, parentId)),
    ),
  )
  api.suggest.mockImplementation(async (prefix, parentId) =>
    backend.items
      .filter(
        (item) =>
          item.type === 'file' &&
          item.name.toLowerCase().startsWith(prefix.toLowerCase()) &&
          (!parentId || isInside(item, parentId)),
      )
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
      .slice(0, SUGGESTION_LIMIT),
  )

  return backend
}
