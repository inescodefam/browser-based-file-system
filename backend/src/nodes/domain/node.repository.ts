import { FileSystemNode, NodeType } from './node';

export interface CreateNodeInput {
  name: string;
  type: NodeType;
  parentId: string | null;
}

export interface NodeRepository {

  create(input: CreateNodeInput): Promise<FileSystemNode>;

  findById(id: string): Promise<FileSystemNode | null>;

  findChildren(parentId: string | null): Promise<FileSystemNode[]>;

  delete(id: string): Promise<boolean>;

  findFilesByExactName(name: string, folderId: string | null): Promise<FileSystemNode[]>;

  findFilesByPrefix(prefix: string, limit: number): Promise<FileSystemNode[]>;
}

export const NODE_REPOSITORY = Symbol('NODE_REPOSITORY');