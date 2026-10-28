export type NodeType = 'file' | 'folder'

export interface FileSystemNode {
  id: string
  name: string
  type: NodeType
  parentId: string | null 
  createdAt: string 
}
