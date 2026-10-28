import { FileSystemItem, ItemType } from './item';

export interface CreateItemInput {
  name: string;
  type: ItemType;
  parentId: string | null;
}

export interface ItemRepository {

  create(input: CreateItemInput): Promise<FileSystemItem>;

  findById(id: string): Promise<FileSystemItem | null>;

  findChildren(parentId: string | null): Promise<FileSystemItem[]>;

  delete(id: string): Promise<boolean>;

  findFilesByExactName(name: string, folderId: string | null): Promise<FileSystemItem[]>;

  findFilesByPrefix(prefix: string, limit: number, folderId: string | null): Promise<FileSystemItem[]>;

  findAncestors(id: string): Promise<FileSystemItem[]>;
}

export const ITEM_REPOSITORY = Symbol('ITEM_REPOSITORY');