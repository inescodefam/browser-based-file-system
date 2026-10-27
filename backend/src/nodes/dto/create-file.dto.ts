import { FileName, ParentId } from './decorators/node-fields.decorators';

export class CreateFileDto {
  @FileName()
  name!: string;

  @ParentId()
  parentId?: string | null;
}
