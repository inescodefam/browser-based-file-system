import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileSystemNode } from '../domain/node';
import { CreateFileDto } from '../dto/create-file.dto';
import { NodeResponseDto } from '../dto/node-response.dto';
import { SearchFilesQueryDto } from '../dto/search-files-query.dto';
import { SuggestFilesQueryDto } from '../dto/suggest-files-query.dto';
import { NodesService } from '../nodes.service';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly nodesService: NodesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a file inside a folder',
    description:
      'A file is just a name and must live in a folder. The name must have an extension, e.g. report.pdf.',
  })
  @ApiCreatedResponse({ type: NodeResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid name or parentId, or parent is a file' })
  @ApiNotFoundResponse({ description: 'Parent folder does not exist' })
  @ApiConflictResponse({ description: 'A node with this name already exists in the folder' })
  create(@Body() dto: CreateFileDto): Promise<FileSystemNode> {
    return this.nodesService.createFile(dto);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Find files by exact name',
    description:
      'Case-sensitive, whole name. Searches everywhere, or inside one folder and all its subfolders when parentId is given.',
  })
  @ApiOkResponse({ type: [NodeResponseDto] })
  @ApiBadRequestResponse({ description: 'Missing or too long name, invalid parentId, or parentId is a file' })
  @ApiNotFoundResponse({ description: 'Folder does not exist' })
  search(@Query() query: SearchFilesQueryDto): Promise<FileSystemNode[]> {
    return this.nodesService.findFilesByName(query.name, query.parentId ?? null);
  }

  @Get('suggestions')
  @ApiOperation({
    summary: 'Autocomplete: files whose name starts with a prefix',
    description:
      'Case-sensitive, ordered by name, at most SEARCH_LIMIT results (configured in .env). When parentId is given, only files inside that folder and its subfolders are suggested.',
  })
  @ApiOkResponse({ type: [NodeResponseDto] })
  @ApiBadRequestResponse({ description: 'Missing or too long prefix, invalid parentId, or parentId is a file' })
  @ApiNotFoundResponse({ description: 'Folder does not exist' })
  suggestions(@Query() query: SuggestFilesQueryDto): Promise<FileSystemNode[]> {
    return this.nodesService.suggestFiles(query.prefix, query.parentId ?? null);
  }
}
