import { Pool } from 'pg';
import { ItemType } from '../domain/item';
import { describeItemRepositoryContract } from './item-repository.contract-spec';
import { PostgresItemRepository } from './postgres-item.repository';

// WARNING: Use a throwaway database
// (local Docker, or a separate Neon branch), never your real data.
const databaseUrl = process.env.TEST_DATABASE_URL;

describeItemRepositoryContract(
  'PostgresItemRepository',
  async () => {
    const pool = new Pool({ connectionString: databaseUrl });
    const repo = new PostgresItemRepository(pool);
    await repo.onModuleInit(); 
    await pool.query('TRUNCATE items CASCADE'); 
    return { repo, cleanup: () => repo.onModuleDestroy() };
  },
  { skip: !databaseUrl }, // no TEST_DATABASE_URL = suite is skipped, not failed
);

describe.skipIf(!databaseUrl)('PostgresItemRepository (ltree paths)', () => {
  it('stores the path as parent path + own id', async () => {
    const pool = new Pool({ connectionString: databaseUrl });
    const repo = new PostgresItemRepository(pool);
    await repo.onModuleInit();
    await pool.query('TRUNCATE items CASCADE');

    const parent = await repo.create({ name: 'docs', type: ItemType.FOLDER, parentId: null });
    const child = await repo.create({ name: 'a.txt', type: ItemType.FILE, parentId: parent.id });

    const { rows } = await pool.query<{ path: string }>('SELECT path::text FROM items WHERE id = $1', [
      child.id,
    ]);
    const label = (id: string) => id.replaceAll('-', '_');
    expect(rows[0].path).toBe(`${label(parent.id)}.${label(child.id)}`);

    await repo.onModuleDestroy();
  });
});
