export const queryKeys = {
  all: ['file-system-items'] as const,
  children: (parentId: string | null) => ['file-system-items', 'children', parentId] as const,
  suggestions: (prefix: string) => ['file-system-items', 'suggestions', prefix] as const,
  search: (name: string, parentId: string | null) =>
    ['file-system-items', 'search', name, parentId] as const,
}
