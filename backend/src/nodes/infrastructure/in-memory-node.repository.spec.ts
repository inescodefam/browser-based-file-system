import { NodeType } from '../domain/node';
import { NodeAlreadyExistsError, ParentNotFoundError } from '../domain/node.errors';
import { InMemoryNodeRepository } from './in-memory-node.repository';

describe('InMemoryNodeRepository', () => {
  let repo: InMemoryNodeRepository;

  const folder = (name: string, parentId: string | null = null) =>
    repo.create({ name, type: NodeType.FOLDER, parentId });
  const file = (name: string, parentId: string | null = null) =>
    repo.create({ name, type: NodeType.FILE, parentId });

  beforeEach(() => {
    repo = new InMemoryNodeRepository();
  });

  it('creates a node and finds it by id', async () => {
    const created = await folder('docs');

    expect(created).toMatchObject({ name: 'docs', type: NodeType.FOLDER, parentId: null });
    await expect(repo.findById(created.id)).resolves.toEqual(created);
  });

  it('returns null for an unknown id', async () => {
    await expect(repo.findById('nope')).resolves.toBeNull();
  });

  it('lists only the direct children of a folder', async () => {
    const docs = await folder('docs');
    const sub = await folder('sub', docs.id);
    await file('a.txt', docs.id);
    await file('deep.txt', sub.id);
    await file('root.txt');

    const names = (await repo.findChildren(docs.id)).map((n) => n.name);

    expect(names).toEqual(['sub', 'a.txt']);
    expect((await repo.findChildren(null)).map((n) => n.name)).toEqual(['docs', 'root.txt']);
  });

  it('rejects a duplicate name in the same folder', async () => {
    await folder('docs');

    await expect(file('docs')).rejects.toBeInstanceOf(NodeAlreadyExistsError);
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
    await expect(file('a.txt', 'missing-id')).rejects.toBeInstanceOf(ParentNotFoundError);
  });

  it('lets only one of two concurrent creates with the same name succeed', async () => {
    const results = await Promise.allSettled([folder('race'), folder('race')]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
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
    await expect(repo.delete('nope')).resolves.toBe(false);
  });
});