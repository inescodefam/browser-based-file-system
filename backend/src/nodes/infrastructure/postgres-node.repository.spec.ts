import { Pool } from 'pg';
import { NodeType } from '../domain/node';
import { describeNodeRepositoryContract } from './node-repository.contract-spec';
import { PostgresNodeRepository } from './postgres-node.repository';

// WARNING: Use a throwaway database
// (local Docker, or a separate Neon branch), never your real data.
const databaseUrl = process.env.TEST_DATABASE_URL;

describeNodeRepositoryContract(
  'PostgresNodeRepository',
  async () => {
    const pool = new Pool({ connectionString: databaseUrl });
    const repo = new PostgresNodeRepository(pool);
    await repo.onModuleInit(); 
    await pool.query('TRUNCATE nodes CASCADE'); 
    return { repo, cleanup: () => repo.onModuleDestroy() };
  },
  { skip: !databaseUrl }, // no TEST_DATABASE_URL = suite is skipped, not failed
);

describe.skipIf(!databaseUrl)('PostgresNodeRepository (ltree paths)', () => {
  it('stores the path as parent path + own id', async () => {
    const pool = new Pool({ connectionString: databaseUrl });
    const repo = new PostgresNodeRepository(pool);
    await repo.onModuleInit();
    await pool.query('TRUNCATE nodes CASCADE');

    const parent = await repo.create({ name: 'docs', type: NodeType.FOLDER, parentId: null });
    const child = await repo.create({ name: 'a.txt', type: NodeType.FILE, parentId: parent.id });

    const { rows } = await pool.query<{ path: string }>('SELECT path::text FROM nodes WHERE id = $1', [
      child.id,
    ]);
    const label = (id: string) => id.replaceAll('-', '_');
    expect(rows[0].path).toBe(`${label(parent.id)}.${label(child.id)}`);

    await repo.onModuleDestroy();
  });
});
