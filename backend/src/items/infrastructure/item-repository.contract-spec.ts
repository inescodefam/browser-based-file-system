import { randomUUID } from 'node:crypto';
import { ItemType } from '../domain/item';
import { ItemAlreadyExistsError, ParentNotFoundError } from '../domain/item.errors';
import { ItemRepository } from '../domain/item.repository';

export interface RepositoryUnderTest {
  repo: ItemRepository;
  /** Release resources (e.g. close the database pool) */
  cleanup?: () => Promise<void>;
}

export function describeItemRepositoryContract(
  implementationName: string,
  setup: () => Promise<RepositoryUnderTest>,
  options: { skip?: boolean } = {},
): void {
  describe.skipIf(options.skip)(`${implementationName} (ItemRepository contract)`, () => {
    let repo: ItemRepository;
    let cleanup: (() => Promise<void>) | undefined;

    const folder = (name: string, parentId: string | null = null) =>
      repo.create({ name, type: ItemType.FOLDER, parentId });
    const file = (name: string, parentId: string | null = null) =>
      repo.create({ name, type: ItemType.FILE, parentId });
    const namesOf = (items: { name: string }[]) => items.map((n) => n.name).sort();

    beforeEach(async () => {
      ({ repo, cleanup } = await setup());
    });

    afterEach(async () => {
      await cleanup?.();
    });

    it('creates an item and finds it by id', async () => {
      const created = await folder('docs');

      expect(created).toMatchObject({ name: 'docs', type: ItemType.FOLDER, parentId: null });
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

      await expect(file('docs')).rejects.toBeInstanceOf(ItemAlreadyExistsError);
    });

    it('rejects a duplicate name inside a subfolder too', async () => {
      const docs = await folder('docs');
      await file('a.txt', docs.id);

      await expect(file('a.txt', docs.id)).rejects.toBeInstanceOf(ItemAlreadyExistsError);
    });

    it('allows the same name in different folders', async () => {
      const a = await folder('a');
      const b = await folder('b');

      await expect(file('x.txt', a.id)).resolves.toBeDefined();
      await expect(file('x.txt', b.id)).resolves.toBeDefined();
    });

    it('rejects a name that only differs by case in the same folder', async () => {
      await folder('Docs');

      await expect(folder('docs')).rejects.toBeInstanceOf(ItemAlreadyExistsError);
    });

    it('rejects a missing parent', async () => {
      await expect(file('a.txt', randomUUID())).rejects.toBeInstanceOf(ParentNotFoundError);
    });

    it('lets only one of two concurrent creates with the same name succeed', async () => {
      const results = await Promise.allSettled([folder('race'), folder('race')]);

      const rejected = results.filter((r) => r.status === 'rejected');
      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect(rejected[0].reason).toBeInstanceOf(ItemAlreadyExistsError);
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

    it('returns the folders from the top level down to a folder, including itself', async () => {
      const docs = await folder('docs');
      const sub = await folder('sub', docs.id);
      await file('deep.txt', sub.id);

      const ancestors = await repo.findAncestors(sub.id);

      expect(ancestors.map((item) => item.id)).toEqual([docs.id, sub.id]);
    });

    it('returns only the folder when it is at the top level', async () => {
      const docs = await folder('docs');

      await expect(repo.findAncestors(docs.id)).resolves.toEqual([docs]);
    });

    it('returns nothing for an unknown id', async () => {
      await expect(repo.findAncestors(randomUUID())).resolves.toEqual([]);
    });

    describe('findFilesByExactName', () => {
      it('searches everywhere, at any depth', async () => {
        const docs = await folder('docs');
        const top = await file('report.pdf');
        const nested = await file('report.pdf', docs.id);
        await file('other.pdf');

        const found = await repo.findFilesByExactName('report.pdf', null);

        expect(found.map((n) => n.id).sort()).toEqual([top.id, nested.id].sort());
      });

      it('ignores a folder that has the searched name', async () => {
        await folder('archive');

        await expect(repo.findFilesByExactName('archive', null)).resolves.toEqual([]);
      });

      it('searches a folder and all its subfolders, but nothing outside', async () => {
        const docs = await folder('docs');
        const sub = await folder('sub', docs.id);
        const other = await folder('other');
        const inDocs = await file('x.txt', docs.id);
        const deep = await file('x.txt', sub.id);
        await file('x.txt', other.id);
        await file('x.txt');

        const found = await repo.findFilesByExactName('x.txt', docs.id);

        expect(found.map((n) => n.id).sort()).toEqual([inDocs.id, deep.id].sort());
      });

      it('is case-sensitive and needs the whole name', async () => {
        await file('Report.pdf');
        await file('report.pdf.bak');

        await expect(repo.findFilesByExactName('report.pdf', null)).resolves.toEqual([]);
      });

      it('returns nothing for an unknown folder', async () => {
        await file('x.txt');

        await expect(repo.findFilesByExactName('x.txt', randomUUID())).resolves.toEqual([]);
      });
    });

    describe('findFilesByPrefix', () => {
      it('returns files starting with the prefix, ordered by name, never folders', async () => {
        const docs = await folder('docs');
        await file('report-b.txt');
        await file('report-a.txt', docs.id);
        await file('other.txt');
        await folder('report-folder');

        const found = await repo.findFilesByPrefix('report', 10, null);

        expect(found.map((n) => n.name)).toEqual(['report-a.txt', 'report-b.txt']);
      });

      it('is case-insensitive', async () => {
        const created = await file('Report.txt');

        await expect(repo.findFilesByPrefix('report', 10, null)).resolves.toEqual([created]);
      });

      it('returns at most `limit` results (the first ones by name)', async () => {
        for (const name of ['f3.txt', 'f1.txt', 'f5.txt', 'f2.txt', 'f4.txt']) {
          await file(name);
        }

        const found = await repo.findFilesByPrefix('f', 3, null);

        expect(found.map((n) => n.name)).toEqual(['f1.txt', 'f2.txt', 'f3.txt']);
      });

      it('limits the search to a folder and all its subfolders', async () => {
        const docs = await folder('docs');
        const sub = await folder('sub', docs.id);
        await file('report.pdf');
        const inDocs = await file('report-a.txt', docs.id);
        const deep = await file('report-b.txt', sub.id);

        const found = await repo.findFilesByPrefix('report', 10, docs.id);

        expect(found.map((n) => n.id).sort()).toEqual([inDocs.id, deep.id].sort());
      });

      // Each prefix would also match `lookalike` if %, _ or \ were treated as LIKE wildcards/escapes
      it.each([
        { prefix: '%', matching: '%sale.txt', lookalike: 'sale.txt' },
        { prefix: 'a_', matching: 'a_b.txt', lookalike: 'axb.txt' },
        { prefix: 'a\\', matching: 'a\\b.txt', lookalike: 'ab.txt' },
      ])('treats %j literally, not as a wildcard', async ({ prefix, matching, lookalike }) => {
        await file(matching);
        await file(lookalike);

        const found = await repo.findFilesByPrefix(prefix, 10, null);

        expect(found.map((n) => n.name)).toEqual([matching]);
      });
    });
  });
}
