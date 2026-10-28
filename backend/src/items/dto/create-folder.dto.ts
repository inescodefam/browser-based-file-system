import { FolderName, ParentId } from './decorators/item-fields.decorators';

export class CreateFolderDto {
  @FolderName()
  name!: string;

  @ParentId()
  parentId?: string | null;
}
