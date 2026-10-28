import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { NameMaxLength } from './name-max-length.constraint';

const FOLDER_NAME_PATTERN = /^[A-Za-z0-9 -]+$/;
const FILE_NAME_PATTERN = /^[A-Za-z0-9 -]+\.[A-Za-z0-9]{1,10}$/;

export const NAME_CHARS_MESSAGE =
  'Name can only contain letters, numbers, spaces and hyphens';
export const FILE_EXTENSION_MESSAGE = 'File name must have an extension, e.g. "report.pdf"';

const fileNameMessage = ({ value }: { value: unknown }): string => {
  if (typeof value !== 'string') return FILE_EXTENSION_MESSAGE;
  const lastDot = value.lastIndexOf('.');
  const base = lastDot === -1 ? value : value.slice(0, lastDot);
  if (base === '' || !FOLDER_NAME_PATTERN.test(base)) return NAME_CHARS_MESSAGE;
  return FILE_EXTENSION_MESSAGE;
};

function TrimmedName() {
  return applyDecorators(
    Transform(({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim() : value,
    ),
    IsString(),
    IsNotEmpty(),
    NameMaxLength(),
  );
}

export function FolderName() {
  return applyDecorators(
    ApiProperty({
      example: 'reports',
      description: 'Letters, numbers, spaces and hyphens. Case sensitive, unique within its folder.',
    }),
    TrimmedName(),
    Matches(FOLDER_NAME_PATTERN, { message: NAME_CHARS_MESSAGE }),
  );
}

export function FileName() {
  return applyDecorators(
    ApiProperty({
      example: 'report.pdf',
      description:
        'Letters, numbers, spaces and hyphens, plus a file extension. Case sensitive, unique within its folder.',
    }),
    TrimmedName(),
    Matches(FILE_NAME_PATTERN, { message: fileNameMessage }),
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
