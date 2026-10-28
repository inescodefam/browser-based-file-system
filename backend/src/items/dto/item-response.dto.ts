import { ApiProperty } from '@nestjs/swagger';
import { FileSystemItem, ItemType } from '../domain/item';

export class ItemResponseDto implements FileSystemItem {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'report.pdf' })
  name!: string;

  @ApiProperty({ enum: ItemType })
  type!: ItemType;

  @ApiProperty({ format: 'uuid', nullable: true, description: 'null = top level' })
  parentId!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
