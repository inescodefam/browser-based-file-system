export const queryKeys = {
  all: ['nodes'] as const,
  children: (parentId: string | null) => ['nodes', 'children', parentId] as const,
}
