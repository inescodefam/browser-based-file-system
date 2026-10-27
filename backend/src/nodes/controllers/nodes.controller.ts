import { Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileSystemNode } from '../domain/node';
import { ListNodesQueryDto } from '../dto/list-nodes-query.dto';
import { NodeResponseDto } from '../dto/node-response.dto';
import { NodesService } from '../nodes.service';

@ApiTags('nodes')
@Controller('nodes')
export class NodesController {
  constructor(private readonly nodesService: NodesService) {}

  @Get()
  @ApiOperation({
    summary: 'List the direct children of a folder',
    description: 'Folders come first, then files, both sorted by name. Omit parentId for the top level.',
  })
  @ApiOkResponse({ type: [NodeResponseDto] })
  @ApiBadRequestResponse({ description: 'Invalid parentId, or parentId is a file' })
  @ApiNotFoundResponse({ description: 'Folder does not exist' })
  listChildren(@Query() query: ListNodesQueryDto): Promise<FileSystemNode[]> {
    return this.nodesService.listChildren(query.parentId ?? null);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a file or a folder',
    description: 'Deleting a folder also deletes everything inside it.',
  })
  @ApiNoContentResponse({ description: 'Deleted' })
  @ApiBadRequestResponse({ description: 'id is not a valid UUID' })
  @ApiNotFoundResponse({ description: 'Node does not exist' })
  delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.nodesService.delete(id);
  }
}
