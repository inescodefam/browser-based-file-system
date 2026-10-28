import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvVars } from '../config/env.validation';
import { compareByName, FileSystemNode, NodeType } from './domain/node';
import {
  NodeNotFoundError,
  ParentIsNotFolderError,
  ParentNotFoundError,
} from './domain/node.errors';
import { NODE_REPOSITORY, type NodeRepository } from './domain/node.repository';
import { CreateFileDto } from './dto/create-file.dto';
import { CreateFolderDto } from './dto/create-folder.dto';

@Injectable()
export class NodesService {
  constructor(
    @Inject(NODE_REPOSITORY) private readonly repository: NodeRepository,
    @Inject(ConfigService) private readonly config: ConfigService<EnvVars, true>,
  ) {}

  createFolder(dto: CreateFolderDto): Promise<FileSystemNode> {
    return this.create(dto, NodeType.FOLDER);
  }

  createFile(dto: CreateFileDto): Promise<FileSystemNode> {
    return this.create(dto, NodeType.FILE);
  }

  async listChildren(parentId: string | null): Promise<FileSystemNode[]> {
    await this.assertParentIsFolder(parentId);
    const children = await this.repository.findChildren(parentId);
    return children.sort(
      (a, b) =>
        Number(b.type === NodeType.FOLDER) - Number(a.type === NodeType.FOLDER) ||
        compareByName(a, b),
    );
  }

  async findFilesByName(name: string, folderId: string | null): Promise<FileSystemNode[]> {
    await this.assertParentIsFolder(folderId);
    return this.repository.findFilesByExactName(name, folderId);
  }

  async suggestFiles(prefix: string, folderId: string | null = null): Promise<FileSystemNode[]> {
    await this.assertParentIsFolder(folderId);
    return this.repository.findFilesByPrefix(
      prefix,
      this.config.get('SEARCH_LIMIT', { infer: true }),
      folderId,
    );
  }

  async getAncestors(id: string): Promise<FileSystemNode[]> {
    const node = await this.repository.findById(id);
    if (!node) {
      throw new NodeNotFoundError(id);
    }
    if (node.type !== NodeType.FOLDER) {
      throw new ParentIsNotFolderError(node.id, node.name);
    }
    return this.repository.findAncestors(id);
  }

  async delete(id: string): Promise<void> {
    const wasDeleted = await this.repository.delete(id);
    if (!wasDeleted) {
      throw new NodeNotFoundError(id);
    }
  }

  private async create(
    dto: CreateFolderDto | CreateFileDto,
    type: NodeType,
  ): Promise<FileSystemNode> {
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
    if (parent.type !== NodeType.FOLDER) {
      throw new ParentIsNotFolderError(parent.id, parent.name);
    }
  }
}
