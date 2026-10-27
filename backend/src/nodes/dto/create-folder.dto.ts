import { NodeName, ParentId } from './decorators/node-fields.decorators';

export class CreateFolderDto {
  @NodeName()
  name!: string;

  @ParentId()
  parentId?: string | null;
}
