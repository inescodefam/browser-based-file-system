import { ItemName, ParentId } from './decorators/item-fields.decorators';

export class CreateFolderDto {
  @ItemName()
  name!: string;

  @ParentId()
  parentId?: string | null;
}
