export type FileSystemItemType = 'file' | 'folder'

/** Same shape the backend returns (see NodeResponseDto in Swagger). */
export interface FileSystemItem {
  id: string
  name: string
  type: FileSystemItemType
  parentId: string | null // null = top level
  createdAt: string // ISO date
}
