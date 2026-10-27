import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FileSystemNode, NodeType } from './domain/node';
import { NodeAlreadyExistsError, ParentNotFoundError } from './domain/node.errors';
import { NODE_REPOSITORY, type NodeRepository } from './domain/node.repository';
import { CreateFileDto } from './dto/create-file.dto';
import { CreateFolderDto } from './dto/create-folder.dto';

@Injectable()
export class NodesService {
  constructor(@Inject(NODE_REPOSITORY) private readonly repository: NodeRepository) {}

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
        (a.name < b.name ? -1 : a.name > b.name ? 1 : 0),
    );
  }

  async delete(id: string): Promise<void> {
    const wasDeleted = await this.repository.delete(id);
    if (!wasDeleted) {
      throw new NotFoundException(`Node "${id}" does not exist`);
    }
  }

  private async create(
    dto: CreateFolderDto | CreateFileDto,
    type: NodeType,
  ): Promise<FileSystemNode> {
    const parentId = dto.parentId ?? null;
    await this.assertParentIsFolder(parentId);

    try {
      return await this.repository.create({ name: dto.name, type, parentId });
    } catch (error) {
      if (error instanceof NodeAlreadyExistsError) {
        throw new ConflictException(error.message);
      }
      if (error instanceof ParentNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  private async assertParentIsFolder(parentId: string | null): Promise<void> {
    if (parentId === null) return;

    const parent = await this.repository.findById(parentId);
    if (!parent) {
      throw new NotFoundException(`Folder "${parentId}" does not exist`);
    }
    if (parent.type !== NodeType.FOLDER) {
      throw new BadRequestException(`"${parent.name}" is a file, not a folder`);
    }
  }
}
