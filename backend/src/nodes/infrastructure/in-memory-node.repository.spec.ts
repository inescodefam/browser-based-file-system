import { InMemoryNodeRepository } from './in-memory-node.repository';
import { describeNodeRepositoryContract } from './node-repository.contract-spec';

describeNodeRepositoryContract('InMemoryNodeRepository', async () => ({
  repo: new InMemoryNodeRepository(),
}));
