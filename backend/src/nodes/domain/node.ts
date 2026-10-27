export enum NodeType {
  FILE = 'file',
  FOLDER = 'folder',
}

export interface FileSystemNode {
  id: string;
  name: string;
  type: NodeType;
  parentId: string | null;
  createdAt: Date;
}