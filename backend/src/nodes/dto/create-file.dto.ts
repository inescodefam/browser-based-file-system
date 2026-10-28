import { FileName, RequiredParentId } from './decorators/node-fields.decorators';

export class CreateFileDto {
  @FileName()
  name!: string;

  @RequiredParentId()
  parentId!: string;
}
