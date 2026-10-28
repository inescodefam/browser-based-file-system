import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileSystemItem } from '../domain/item';
import { CreateFolderDto } from '../dto/create-folder.dto';
import { ItemResponseDto } from '../dto/item-response.dto';
import { ItemsService } from '../services/items.service';

@ApiTags('folders')
@Controller('folders')
export class FoldersController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a folder (top level, or inside another folder)' })
  @ApiCreatedResponse({ type: ItemResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid name or parentId, or parent is a file' })
  @ApiNotFoundResponse({ description: 'Parent folder does not exist' })
  @ApiConflictResponse({ description: 'An item with this name already exists in the folder' })
  create(@Body() dto: CreateFolderDto): Promise<FileSystemItem> {
    return this.itemsService.createFolder(dto);
  }
}
