import { FileName, RequiredParentId } from './decorators/item-fields.decorators';

export class CreateFileDto {
  @FileName()
  name!: string;

  @RequiredParentId()
  parentId!: string;
}
