import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileSystemNode } from '../domain/node';
import { CreateFolderDto } from '../dto/create-folder.dto';
import { NodeResponseDto } from '../dto/node-response.dto';
import { NodesService } from '../nodes.service';

@ApiTags('folders')
@Controller('folders')
export class FoldersController {
  constructor(private readonly nodesService: NodesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a folder (top level, or inside another folder)' })
  @ApiCreatedResponse({ type: NodeResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid name or parentId, or parent is a file' })
  @ApiNotFoundResponse({ description: 'Parent folder does not exist' })
  @ApiConflictResponse({ description: 'A node with this name already exists in the folder' })
  create(@Body() dto: CreateFolderDto): Promise<FileSystemNode> {
    return this.nodesService.createFolder(dto);
  }
}
