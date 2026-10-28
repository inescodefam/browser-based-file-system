import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { compareByName, FileSystemNode, NodeType } from '../domain/node';
import { NodeAlreadyExistsError, ParentNotFoundError } from '../domain/node.errors';
import { CreateNodeInput, NodeRepository } from '../domain/node.repository';

type ParentKey = string | null;

@Injectable()
export class InMemoryNodeRepository implements NodeRepository {
  private readonly nodesById = new Map<string, FileSystemNode>();
  private readonly childrenByParent = new Map<ParentKey, Map<string, FileSystemNode>>();

  async create({ name, type, parentId }: CreateNodeInput): Promise<FileSystemNode> {
    if (parentId !== null && !this.nodesById.has(parentId)) {
      throw new ParentNotFoundError(parentId);
    }
    const siblings = this.childrenByParent.get(parentId) ?? new Map<string, FileSystemNode>();
    if (siblings.has(name)) {
      throw new NodeAlreadyExistsError(name, parentId);
    }

    const node: FileSystemNode = { id: randomUUID(), name, type, parentId, createdAt: new Date() };
    siblings.set(name, node);
    this.childrenByParent.set(parentId, siblings);
    this.nodesById.set(node.id, node);
    return node;
  }

  async findById(id: string): Promise<FileSystemNode | null> {
    return this.nodesById.get(id) ?? null;
  }

  async findChildren(parentId: string | null): Promise<FileSystemNode[]> {
    return [...(this.childrenByParent.get(parentId)?.values() ?? [])];
  }

  async delete(id: string): Promise<boolean> {
    const root = this.nodesById.get(id);
    if (!root) return false;

    const subtree = this.collectSubtree(root);
    for (const node of subtree) {
      this.nodesById.delete(node.id);
      this.childrenByParent.delete(node.id);
    }
    this.childrenByParent.get(root.parentId)?.delete(root.name);
    return true;
  }

   async findFilesByExactName(name: string, folderId: string | null): Promise<FileSystemNode[]> {
    let candidates: Iterable<FileSystemNode> = this.nodesById.values();
    if (folderId !== null) {
      const folder = this.nodesById.get(folderId);
      candidates = folder ? this.collectSubtree(folder) : [];
    }
    return [...candidates].filter((node) => node.type === NodeType.FILE && node.name === name);
  } 

  async findFilesByPrefix(
    prefix: string,
    limit: number,
    folderId: string | null,
  ): Promise<FileSystemNode[]> {
    let candidates: Iterable<FileSystemNode> = this.nodesById.values();
    if (folderId !== null) {
      const folder = this.nodesById.get(folderId);
      candidates = folder ? this.collectSubtree(folder) : [];
    }
    return [...candidates]
      .filter((node) => node.type === NodeType.FILE && node.name.startsWith(prefix))
      .sort(compareByName)
      .slice(0, limit);
  }

  async findAncestors(id: string): Promise<FileSystemNode[]> {
    const chain: FileSystemNode[] = [];
    let current = this.nodesById.get(id) ?? null;
    while (current) {
      chain.unshift(current);
      current = current.parentId === null ? null : (this.nodesById.get(current.parentId) ?? null);
    }
    return chain;
  }

  private collectSubtree(root: FileSystemNode): FileSystemNode[] {
    const subtree = [root];
    for (const current of subtree) {
      const children = this.childrenByParent.get(current.id);
      if (children) subtree.push(...children.values());
    }
    return subtree;
  }
}
