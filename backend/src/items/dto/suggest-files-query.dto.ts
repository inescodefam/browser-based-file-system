import { ParentId, SearchTerm } from './decorators/item-fields.decorators';

export class SuggestFilesQueryDto {
  @SearchTerm('Beginning of the file name (case-sensitive).', 'rep')
  prefix!: string;

  @ParentId('Only suggest files inside this folder and its subfolders. Omit to search everywhere.')
  parentId?: string;
}
