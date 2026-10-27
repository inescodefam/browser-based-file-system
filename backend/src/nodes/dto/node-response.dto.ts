import { ApiProperty } from '@nestjs/swagger';
import { FileSystemNode, NodeType } from '../domain/node';

export class NodeResponseDto implements FileSystemNode {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'report.pdf' })
  name!: string;

  @ApiProperty({ enum: NodeType })
  type!: NodeType;

  @ApiProperty({ format: 'uuid', nullable: true, description: 'null = top level' })
  parentId!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
