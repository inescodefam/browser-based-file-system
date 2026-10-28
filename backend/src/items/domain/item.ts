export enum ItemType {
  FILE = 'file',
  FOLDER = 'folder',
}

export interface FileSystemItem {
  id: string;
  name: string;
  type: ItemType;
  parentId: string | null;
  createdAt: Date;
}

export const compareByName = (a: { name: string }, b: { name: string }): number =>
  a.name < b.name ? -1 : a.name > b.name ? 1 : 0;