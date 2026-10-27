import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { FileSystemNode, NodeType } from '../domain/node';
import { NodeAlreadyExistsError, ParentNotFoundError } from '../domain/node.errors';
import { CreateNodeInput, NodeRepository } from '../domain/node.repository';
import { POSTGRES_SCHEMA } from './postgres-schema';

// PostgreSQL error codes
const UNIQUE_VIOLATION = '23505';
const FOREIGN_KEY_VIOLATION = '23503';

interface NodeRow {
  id: string;
  name: string;
  type: NodeType;
  parent_id: string | null;
  created_at: Date;
}

const COLUMNS = 'id, name, type, parent_id, created_at';

const toNode = (row: NodeRow): FileSystemNode => ({
  id: row.id,
  name: row.name,
  type: row.type,
  parentId: row.parent_id,
  createdAt: row.created_at,
});

const hasPgCode = (error: unknown, code: string): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === code;

export class PostgresNodeRepository implements NodeRepository, OnModuleInit, OnModuleDestroy {
  constructor(private readonly pool: Pool) {}

  async onModuleInit(): Promise<void> {
    await this.pool.query(POSTGRES_SCHEMA);
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  async create({ name, type, parentId }: CreateNodeInput): Promise<FileSystemNode> {
    const id = randomUUID();
    const pathLabel = id.replaceAll('-', '_'); // ltree labels allow letters, digits and "_"

    try {
      // path = parent's path + own label (just the label at the top level)
      const { rows } = await this.pool.query<NodeRow>(
        `INSERT INTO nodes (id, name, type, parent_id, path)
         VALUES ($1, $2, $3, $4::uuid,
                 COALESCE((SELECT path FROM nodes WHERE id = $4::uuid), ''::ltree) || $5::text::ltree)
         RETURNING ${COLUMNS}`,
        [id, name, type, parentId, pathLabel],
      );
      return toNode(rows[0]);
    } catch (error) {
      if (hasPgCode(error, UNIQUE_VIOLATION)) throw new NodeAlreadyExistsError(name, parentId);
      if (hasPgCode(error, FOREIGN_KEY_VIOLATION)) throw new ParentNotFoundError(parentId as string);
      throw error;
    }
  }

  async findById(id: string): Promise<FileSystemNode | null> {
    const { rows } = await this.pool.query<NodeRow>(
      `SELECT ${COLUMNS} FROM nodes WHERE id = $1`,
      [id],
    );
    return rows.length > 0 ? toNode(rows[0]) : null;
  }

  async findChildren(parentId: string | null): Promise<FileSystemNode[]> {
    const { rows } =
      parentId === null
        ? await this.pool.query<NodeRow>(`SELECT ${COLUMNS} FROM nodes WHERE parent_id IS NULL`)
        : await this.pool.query<NodeRow>(`SELECT ${COLUMNS} FROM nodes WHERE parent_id = $1`, [
            parentId,
          ]);
    return rows.map(toNode);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM nodes WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
