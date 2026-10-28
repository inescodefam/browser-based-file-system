import { request } from './http'
import type { FileSystemItem } from './types'

export const fileSystemItemsApi = {
  list: (parentId?: string, signal?: AbortSignal) =>
    request<FileSystemItem[]>('/items', { method: 'GET', query: { parentId }, signal }),

  ancestors: (folderId: string, signal?: AbortSignal) =>
    request<FileSystemItem[]>(`/items/${folderId}/ancestors`, { method: 'GET', signal }),

  createFolder: (name: string, parentId?: string) =>
    request<FileSystemItem>('/folders', { method: 'POST', body: { name, parentId } }),

  createFile: (name: string, parentId: string) =>
    request<FileSystemItem>('/files', { method: 'POST', body: { name, parentId } }),

  remove: (id: string) => request<void>(`/items/${id}`, { method: 'DELETE' }),

  searchByName: (name: string, parentId?: string, signal?: AbortSignal) =>
    request<FileSystemItem[]>('/files/search', {
      method: 'GET',
      query: { name, parentId },
      signal,
    }),

  suggest: (prefix: string, parentId?: string, signal?: AbortSignal) =>
    request<FileSystemItem[]>('/files/suggestions', {
      method: 'GET',
      query: { prefix, parentId },
      signal,
    }),
}
