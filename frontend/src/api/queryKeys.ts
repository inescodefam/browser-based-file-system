export const queryKeys = {
  all: ['file-system-items'] as const,
  children: (parentId: string | null) => ['file-system-items', 'children', parentId] as const,
  suggestions: (prefix: string, parentId: string | null) =>
    ['file-system-items', 'suggestions', prefix, parentId] as const,
  search: (name: string, parentId: string | null) =>
    ['file-system-items', 'search', name, parentId] as const,
  ancestors: (folderId: string) => ['file-system-items', 'ancestors', folderId] as const,
}
