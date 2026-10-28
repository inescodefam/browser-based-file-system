import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvVars } from '../config/env.validation';
import { compareByName, FileSystemItem, ItemType } from './domain/item';
import {
  ItemNotFoundError,
  ParentIsNotFolderError,
  ParentNotFoundError,
} from './domain/item.errors';
import { ITEM_REPOSITORY, type ItemRepository } from './domain/item.repository';
import { CreateFileDto } from './dto/create-file.dto';
import { CreateFolderDto } from './dto/create-folder.dto';

@Injectable()
export class ItemsService {
  constructor(
    @Inject(ITEM_REPOSITORY) private readonly repository: ItemRepository,
    @Inject(ConfigService) private readonly config: ConfigService<EnvVars, true>,
  ) {}

  createFolder(dto: CreateFolderDto): Promise<FileSystemItem> {
    return this.create(dto, ItemType.FOLDER);
  }

  createFile(dto: CreateFileDto): Promise<FileSystemItem> {
    return this.create(dto, ItemType.FILE);
  }

  async listChildren(parentId: string | null): Promise<FileSystemItem[]> {
    await this.assertParentIsFolder(parentId);
    const children = await this.repository.findChildren(parentId);
    return children.sort(
      (a, b) =>
        Number(b.type === ItemType.FOLDER) - Number(a.type === ItemType.FOLDER) ||
        compareByName(a, b),
    );
  }

  async findFilesByName(name: string, folderId: string | null): Promise<FileSystemItem[]> {
    await this.assertParentIsFolder(folderId);
    return this.repository.findFilesByExactName(name, folderId);
  }

  async suggestFiles(prefix: string, folderId: string | null = null): Promise<FileSystemItem[]> {
    await this.assertParentIsFolder(folderId);
    return this.repository.findFilesByPrefix(
      prefix,
      this.config.get('SEARCH_LIMIT', { infer: true }),
      folderId,
    );
  }

  async getAncestors(id: string): Promise<FileSystemItem[]> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new ItemNotFoundError(id);
    }
    if (item.type !== ItemType.FOLDER) {
      throw new ParentIsNotFolderError(item.id, item.name);
    }
    return this.repository.findAncestors(id);
  }

  async delete(id: string): Promise<void> {
    const wasDeleted = await this.repository.delete(id);
    if (!wasDeleted) {
      throw new ItemNotFoundError(id);
    }
  }

  private async create(
    dto: CreateFolderDto | CreateFileDto,
    type: ItemType,
  ): Promise<FileSystemItem> {
    const parentId = dto.parentId ?? null;
    await this.assertParentIsFolder(parentId);

    return this.repository.create({ name: dto.name, type, parentId });
  }

  private async assertParentIsFolder(parentId: string | null): Promise<void> {
    if (parentId === null) return;

    const parent = await this.repository.findById(parentId);
    if (!parent) {
      throw new ParentNotFoundError(parentId);
    }
    if (parent.type !== ItemType.FOLDER) {
      throw new ParentIsNotFolderError(parent.id, parent.name);
    }
  }
}
