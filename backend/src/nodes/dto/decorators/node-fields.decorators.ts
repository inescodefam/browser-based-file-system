import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { NameMaxLength } from './name-max-length.constraint';

const NODE_NAME_PATTERN = /^(?!\.{1,2}$)[^/\\]+$/;
const FILE_NAME_PATTERN = /^.+\.[A-Za-z0-9]{1,10}$/;

export function NodeName() {
  return applyDecorators(
    ApiProperty({ example: 'reports', description: 'Case sensitive, unique within its folder.' }),
    Transform(({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim() : value,
    ),
    IsString(),
    IsNotEmpty(),
    Matches(NODE_NAME_PATTERN, {
      message: 'Name must not contain "/" or "\\" and must not be "." or ".."',
    }),
    NameMaxLength(),
  );
}

export function FileName() {
  return applyDecorators(
    NodeName(),
    Matches(FILE_NAME_PATTERN, {
      message: 'File name must have an extension, e.g. "report.pdf"',
    }),
  );
}

export function ParentId(
  description = 'Id of the parent folder. Omit (or null) to create at the top level.',
) {
  return applyDecorators(
    ApiPropertyOptional({ format: 'uuid', nullable: true, description }),
    IsOptional(),
    IsUUID(),
  );
}

export function RequiredParentId(
  description = 'Id of the folder that will contain this file.',
) {
  return applyDecorators(
    ApiProperty({ format: 'uuid', description }),
    IsUUID(),
  );
}

export function SearchTerm(description: string, example: string) {
  return applyDecorators(
    ApiProperty({ description, example }),
    IsString(),
    IsNotEmpty(),
    NameMaxLength(),
  );
}
