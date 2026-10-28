import { request } from './http'
import type { FileSystemNode } from './types'

export const nodesApi = {
  list: (parentId?: string | null, signal?: AbortSignal) =>
    request<FileSystemNode[]>('/nodes', { query: { parentId: parentId ?? undefined }, signal }),

  createFolder: (name: string, parentId?: string | null) =>
    request<FileSystemNode>('/folders', { method: 'POST', body: { name, parentId } }),

  createFile: (name: string, parentId?: string | null) =>
    request<FileSystemNode>('/files', { method: 'POST', body: { name, parentId } }),

  remove: (id: string) => request<void>(`/nodes/${id}`, { method: 'DELETE' }),

  searchByName: (name: string, parentId?: string | null, signal?: AbortSignal) =>
    request<FileSystemNode[]>('/files/search', {
      query: { name, parentId: parentId ?? undefined },
      signal,
    }),

  suggest: (prefix: string, signal?: AbortSignal) =>
    request<FileSystemNode[]>('/files/suggestions', { query: { prefix }, signal }),
}
