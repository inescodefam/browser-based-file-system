export const queryKeys = {
  all: ['file-system-items'] as const,
  children: (parentId: string | undefined) => [...queryKeys.all, 'children', parentId] as const,
  suggestions: (prefix: string, parentId: string | undefined = undefined) =>
    [...queryKeys.all, 'suggestions', prefix, parentId] as const,
  search: (name: string = '', parentId: string | undefined = undefined) =>
    [...queryKeys.all, 'search', name, parentId] as const,
  ancestors: (folderId: string) => [...queryKeys.all, 'ancestors', folderId] as const,
}
