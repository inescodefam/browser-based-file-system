import { Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileSystemItem } from '../domain/item';
import { ListItemsQueryDto } from '../dto/list-items-query.dto';
import { ItemResponseDto } from '../dto/item-response.dto';
import { ItemsService } from '../items.service';

@ApiTags('items')
@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  @ApiOperation({
    summary: 'List the direct children of a folder',
    description: 'Folders come first, then files, both sorted by name. Omit parentId for the top level.',
  })
  @ApiOkResponse({ type: [ItemResponseDto] })
  @ApiBadRequestResponse({ description: 'Invalid parentId, or parentId is a file' })
  @ApiNotFoundResponse({ description: 'Folder does not exist' })
  listChildren(@Query() query: ListItemsQueryDto): Promise<FileSystemItem[]> {
    return this.itemsService.listChildren(query.parentId ?? null);
  }

  @Get(':id/ancestors')
  @ApiOperation({
    summary: 'List the folders from the top level down to this folder',
    description: 'Includes the folder itself. Used for breadcrumbs.',
  })
  @ApiOkResponse({ type: [ItemResponseDto] })
  @ApiBadRequestResponse({ description: 'id is not a valid UUID, or the id belongs to a file' })
  @ApiNotFoundResponse({ description: 'Folder does not exist' })
  getAncestors(@Param('id', ParseUUIDPipe) id: string): Promise<FileSystemItem[]> {
    return this.itemsService.getAncestors(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a file or a folder',
    description: 'Deleting a folder also deletes everything inside it.',
  })
  @ApiNoContentResponse({ description: 'Deleted' })
  @ApiBadRequestResponse({ description: 'id is not a valid UUID' })
  @ApiNotFoundResponse({ description: 'Item does not exist' })
  delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.itemsService.delete(id);
  }
}
