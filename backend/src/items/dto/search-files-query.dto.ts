import { ParentId, SearchTerm } from './decorators/item-fields.decorators';

export class SearchFilesQueryDto {
  @SearchTerm('Exact file name (case-sensitive).', 'report.pdf')
  name!: string;

  @ParentId('Only search inside this folder and its subfolders. Omit to search everywhere.')
  parentId?: string;
}
