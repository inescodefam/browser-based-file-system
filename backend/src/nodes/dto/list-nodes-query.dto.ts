import { ParentId } from './decorators/node-fields.decorators';

export class ListNodesQueryDto {
  @ParentId()
  parentId?: string;
}
