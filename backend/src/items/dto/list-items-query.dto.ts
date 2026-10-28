import { ParentId } from './decorators/item-fields.decorators';

export class ListItemsQueryDto {
  @ParentId()
  parentId?: string;
}
