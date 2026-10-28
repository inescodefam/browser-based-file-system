export type FileSystemItemType = 'file' | 'folder'


export interface FileSystemItem {
  id: string
  name: string
  type: FileSystemItemType
  parentId: string | null 
  createdAt: string 
}
