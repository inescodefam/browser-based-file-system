import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { compareByName, FileSystemItem, ItemType } from '../domain/item';
import { ItemAlreadyExistsError, ParentNotFoundError } from '../domain/item.errors';
import { CreateItemInput, ItemRepository } from '../domain/item.repository';

type ParentKey = string | null;

@Injectable()
export class InMemoryItemRepository implements ItemRepository {
  private readonly itemsById = new Map<string, FileSystemItem>();
  private readonly childrenByParent = new Map<ParentKey, Map<string, FileSystemItem>>();

  async create({ name, type, parentId }: CreateItemInput): Promise<FileSystemItem> {
    if (parentId !== null && !this.itemsById.has(parentId)) {
      throw new ParentNotFoundError(parentId);
    }
    const siblings = this.childrenByParent.get(parentId) ?? new Map<string, FileSystemItem>();
    if (siblings.has(name)) {
      throw new ItemAlreadyExistsError(name, parentId);
    }

    const item: FileSystemItem = { id: randomUUID(), name, type, parentId, createdAt: new Date() };
    siblings.set(name, item);
    this.childrenByParent.set(parentId, siblings);
    this.itemsById.set(item.id, item);
    return item;
  }

  async findById(id: string): Promise<FileSystemItem | null> {
    return this.itemsById.get(id) ?? null;
  }

  async findChildren(parentId: string | null): Promise<FileSystemItem[]> {
    return [...(this.childrenByParent.get(parentId)?.values() ?? [])];
  }

  async delete(id: string): Promise<boolean> {
    const root = this.itemsById.get(id);
    if (!root) return false;

    const subtree = this.collectSubtree(root);
    for (const item of subtree) {
      this.itemsById.delete(item.id);
      this.childrenByParent.delete(item.id);
    }
    this.childrenByParent.get(root.parentId)?.delete(root.name);
    return true;
  }

   async findFilesByExactName(name: string, folderId: string | null): Promise<FileSystemItem[]> {
    let candidates: Iterable<FileSystemItem> = this.itemsById.values();
    if (folderId !== null) {
      const folder = this.itemsById.get(folderId);
      candidates = folder ? this.collectSubtree(folder) : [];
    }
    return [...candidates].filter((item) => item.type === ItemType.FILE && item.name === name);
  } 

  async findFilesByPrefix(
    prefix: string,
    limit: number,
    folderId: string | null,
  ): Promise<FileSystemItem[]> {
    let candidates: Iterable<FileSystemItem> = this.itemsById.values();
    if (folderId !== null) {
      const folder = this.itemsById.get(folderId);
      candidates = folder ? this.collectSubtree(folder) : [];
    }
    return [...candidates]
      .filter((item) => item.type === ItemType.FILE && item.name.startsWith(prefix))
      .sort(compareByName)
      .slice(0, limit);
  }

  async findAncestors(id: string): Promise<FileSystemItem[]> {
    const chain: FileSystemItem[] = [];
    let current = this.itemsById.get(id) ?? null;
    while (current) {
      chain.unshift(current);
      current = current.parentId === null ? null : (this.itemsById.get(current.parentId) ?? null);
    }
    return chain;
  }

  private collectSubtree(root: FileSystemItem): FileSystemItem[] {
    const subtree = [root];
    for (const current of subtree) {
      const children = this.childrenByParent.get(current.id);
      if (children) subtree.push(...children.values());
    }
    return subtree;
  }
}
