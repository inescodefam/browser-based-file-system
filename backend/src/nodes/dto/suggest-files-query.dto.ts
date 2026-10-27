import { SearchTerm } from './decorators/node-fields.decorators';

export class SuggestFilesQueryDto {
  @SearchTerm('Beginning of the file name (case-sensitive).', 'rep')
  prefix!: string;
}
