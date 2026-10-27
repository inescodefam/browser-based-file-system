import { randomUUID } from 'node:crypto';
import { NodeType } from '../domain/node';
import { NodeAlreadyExistsError, ParentNotFoundError } from '../domain/node.errors';
import { NodeRepository } from '../domain/node.repository';

export interface RepositoryUnderTest {
  repo: NodeRepository;
  /** Release resources (e.g. close the database pool) */
  cleanup?: () => Promise<void>;
}

export function describeNodeRepositoryContract(
  implementationName: string,
  setup: () => Promise<RepositoryUnderTest>,
  options: { skip?: boolean } = {},
): void {
  describe.skipIf(options.skip)(`${implementationName} (NodeRepository contract)`, () => {
    let repo: NodeRepository;
    let cleanup: (() => Promise<void>) | undefined;

    const folder = (name: string, parentId: string | null = null) =>
      repo.create({ name, type: NodeType.FOLDER, parentId });
    const file = (name: string, parentId: string | null = null) =>
      repo.create({ name, type: NodeType.FILE, parentId });
    const namesOf = (nodes: { name: string }[]) => nodes.map((n) => n.name).sort();

    beforeEach(async () => {
      ({ repo, cleanup } = await setup());
    });

    afterEach(async () => {
      await cleanup?.();
    });

    it('creates a node and finds it by id', async () => {
      const created = await folder('docs');

      expect(created).toMatchObject({ name: 'docs', type: NodeType.FOLDER, parentId: null });
      await expect(repo.findById(created.id)).resolves.toEqual(created);
    });

    it('returns null for an unknown id', async () => {
      await expect(repo.findById(randomUUID())).resolves.toBeNull();
    });

    it('lists only the direct children of a folder', async () => {
      const docs = await folder('docs');
      const sub = await folder('sub', docs.id);
      await file('a.txt', docs.id);
      await file('deep.txt', sub.id);
      await file('root.txt');

      expect(namesOf(await repo.findChildren(docs.id))).toEqual(['a.txt', 'sub']);
      expect(namesOf(await repo.findChildren(null))).toEqual(['docs', 'root.txt']);
    });

    it('rejects a duplicate name in the same folder', async () => {
      await folder('docs');

      await expect(file('docs')).rejects.toBeInstanceOf(NodeAlreadyExistsError);
    });

    it('rejects a duplicate name inside a subfolder too', async () => {
      const docs = await folder('docs');
      await file('a.txt', docs.id);

      await expect(file('a.txt', docs.id)).rejects.toBeInstanceOf(NodeAlreadyExistsError);
    });

    it('allows the same name in different folders', async () => {
      const a = await folder('a');
      const b = await folder('b');

      await expect(file('x.txt', a.id)).resolves.toBeDefined();
      await expect(file('x.txt', b.id)).resolves.toBeDefined();
    });

    it('treats names as case-sensitive', async () => {
      await folder('Docs');

      await expect(folder('docs')).resolves.toBeDefined();
    });

    it('rejects a missing parent', async () => {
      await expect(file('a.txt', randomUUID())).rejects.toBeInstanceOf(ParentNotFoundError);
    });

    it('lets only one of two concurrent creates with the same name succeed', async () => {
      const results = await Promise.allSettled([folder('race'), folder('race')]);

      const rejected = results.filter((r) => r.status === 'rejected');
      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect(rejected[0].reason).toBeInstanceOf(NodeAlreadyExistsError);
    });

    it('deletes a folder together with its whole subtree', async () => {
      const docs = await folder('docs');
      const sub = await folder('sub', docs.id);
      const deep = await file('deep.txt', sub.id);

      await expect(repo.delete(docs.id)).resolves.toBe(true);

      await expect(repo.findById(docs.id)).resolves.toBeNull();
      await expect(repo.findById(sub.id)).resolves.toBeNull();
      await expect(repo.findById(deep.id)).resolves.toBeNull();
      await expect(repo.findChildren(null)).resolves.toEqual([]);
    });

    it('frees the name after delete', async () => {
      const docs = await folder('docs');
      await repo.delete(docs.id);

      await expect(folder('docs')).resolves.toBeDefined();
    });

    it('returns false when deleting an unknown id', async () => {
      await expect(repo.delete(randomUUID())).resolves.toBe(false);
    });
  });
}
