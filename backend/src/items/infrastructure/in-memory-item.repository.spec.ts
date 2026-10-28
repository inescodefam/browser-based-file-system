import { InMemoryItemRepository } from './in-memory-item.repository';
import { describeItemRepositoryContract } from './item-repository.contract-spec';

describeItemRepositoryContract('InMemoryItemRepository', async () => ({
  repo: new InMemoryItemRepository(),
}));
