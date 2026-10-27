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

export const compareByName = (a: { name: string }, b: { name: string }): number =>
  a.name < b.name ? -1 : a.name > b.name ? 1 : 0;