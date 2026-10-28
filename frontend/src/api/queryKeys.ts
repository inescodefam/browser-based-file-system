export const queryKeys = {
  all: ['file-system-items'] as const,
  children: (parentId: string | null) => ['file-system-items', 'children', parentId] as const,
}
