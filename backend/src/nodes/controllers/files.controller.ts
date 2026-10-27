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
import { CreateFileDto } from '../dto/create-file.dto';
import { NodeResponseDto } from '../dto/node-response.dto';
import { NodesService } from '../nodes.service';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly nodesService: NodesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a file (top level, or inside a folder)',
    description: 'A file is just a name. The name must have an extension, e.g. report.pdf.',
  })
  @ApiCreatedResponse({ type: NodeResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid name or parentId, or parent is a file' })
  @ApiNotFoundResponse({ description: 'Parent folder does not exist' })
  @ApiConflictResponse({ description: 'A node with this name already exists in the folder' })
  create(@Body() dto: CreateFileDto): Promise<FileSystemNode> {
    return this.nodesService.createFile(dto);
  }
}
