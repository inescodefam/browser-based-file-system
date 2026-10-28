import { request } from './http'
import type { FileSystemItem } from './types'

export const fileSystemItemsApi = {
  list: (parentId?: string | null, signal?: AbortSignal) =>
    request<FileSystemItem[]>('/nodes', { method: 'GET', query: { parentId: parentId ?? undefined }, signal }),

  ancestors: (folderId: string, signal?: AbortSignal) =>
    request<FileSystemItem[]>(`/nodes/${folderId}/ancestors`, { method: 'GET', signal }),

  createFolder: (name: string, parentId?: string | null) =>
    request<FileSystemItem>('/folders', { method: 'POST', body: { name, parentId } }),

  createFile: (name: string, parentId: string) =>
    request<FileSystemItem>('/files', { method: 'POST', body: { name, parentId } }),

  remove: (id: string) => request<void>(`/nodes/${id}`, { method: 'DELETE' }),

  searchByName: (name: string, parentId?: string | null, signal?: AbortSignal) =>
    request<FileSystemItem[]>('/files/search', {
      method: 'GET',
      query: { name, parentId: parentId ?? undefined },
      signal,
    }),

  suggest: (prefix: string, parentId?: string | null, signal?: AbortSignal) =>
    request<FileSystemItem[]>('/files/suggestions', {
      method: 'GET',
      query: { prefix, parentId: parentId ?? undefined },
      signal,
    }),
}
