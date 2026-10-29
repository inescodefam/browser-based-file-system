import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { FileSystemItem, ItemType } from '../domain/item';
import { ItemAlreadyExistsError, ParentNotFoundError } from '../domain/item.errors';
import { CreateItemInput, ItemRepository } from '../domain/item.repository';
import { POSTGRES_SCHEMA } from './postgres-schema';

// PostgreSQL error codes
const UNIQUE_VIOLATION = '23505';
const FOREIGN_KEY_VIOLATION = '23503';

interface ItemRow {
  id: string;
  name: string;
  type: ItemType;
  parent_id: string | null;
  created_at: Date;
}

const COLUMNS = 'id, name, type, parent_id, created_at';

const toItem = (row: ItemRow): FileSystemItem => ({
  id: row.id,
  name: row.name,
  type: row.type,
  parentId: row.parent_id,
  createdAt: row.created_at,
});

const escapeLikePattern = (text: string): string => text.replace(/[\\%_]/g, '\\$&');

const hasPgCode = (error: unknown, code: string): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === code;

export class PostgresItemRepository implements ItemRepository, OnModuleInit, OnModuleDestroy {
  constructor(private readonly pool: Pool) {}

  async onModuleInit(): Promise<void> {
    await this.pool.query(POSTGRES_SCHEMA);
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  async create({ name, type, parentId }: CreateItemInput): Promise<FileSystemItem> {
    const id = randomUUID();
    const pathLabel = id.replaceAll('-', '_'); // ltree labels allow letters, digits and "_"

    try {
      // path = parent's path + own label (just the label at the top level)
      const { rows } = await this.pool.query<ItemRow>(
        `INSERT INTO items (id, name, type, parent_id, path)
         VALUES ($1, $2, $3, $4::uuid,
                 COALESCE((SELECT path FROM items WHERE id = $4::uuid), ''::ltree) || $5::text::ltree)
         RETURNING ${COLUMNS}`,
        [id, name, type, parentId, pathLabel],
      );
      return toItem(rows[0]);
    } catch (error) {
      if (hasPgCode(error, UNIQUE_VIOLATION)) throw new ItemAlreadyExistsError(name, parentId);
      if (hasPgCode(error, FOREIGN_KEY_VIOLATION)) throw new ParentNotFoundError(parentId as string);
      throw error;
    }
  }

  async findById(id: string): Promise<FileSystemItem | null> {
    const { rows } = await this.pool.query<ItemRow>(
      `SELECT ${COLUMNS} FROM items WHERE id = $1`,
      [id],
    );
    return rows.length > 0 ? toItem(rows[0]) : null;
  }

  async findChildren(parentId: string | null): Promise<FileSystemItem[]> {
    const { rows } =
      parentId === null
        ? await this.pool.query<ItemRow>(`SELECT ${COLUMNS} FROM items WHERE parent_id IS NULL`)
        : await this.pool.query<ItemRow>(`SELECT ${COLUMNS} FROM items WHERE parent_id = $1`, [
            parentId,
          ]);
    return rows.map(toItem);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM items WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async findFilesByExactName(name: string, folderId: string | null): Promise<FileSystemItem[]> {
    const { rows } =
      folderId === null
        ? await this.pool.query<ItemRow>(
            `SELECT ${COLUMNS} FROM items WHERE type = 'file' AND name = $1`,
            [name],
          )
        : await this.pool.query<ItemRow>(
            `SELECT ${COLUMNS} FROM items
             WHERE type = 'file' AND name = $1
               AND path <@ (SELECT path FROM items WHERE id = $2)`,
            [name, folderId],
          );
    return rows.map(toItem);
  }

  async findFilesByPrefix(
    prefix: string,
    limit: number,
    folderId: string | null,
  ): Promise<FileSystemItem[]> {
    const pattern = `${escapeLikePattern(prefix)}%`;
    const { rows } =
      folderId === null
        ? await this.pool.query<ItemRow>(
            `SELECT ${COLUMNS} FROM items
             WHERE type = 'file' AND LOWER(name) LIKE LOWER($1)
             ORDER BY name USING ~<~
             LIMIT $2`,
            [pattern, limit],
          )
        : await this.pool.query<ItemRow>(
            `SELECT ${COLUMNS} FROM items
             WHERE type = 'file' AND LOWER(name) LIKE LOWER($1)
               AND path <@ (SELECT path FROM items WHERE id = $3)
             ORDER BY name USING ~<~
             LIMIT $2`,
            [pattern, limit, folderId],
          );
    return rows.map(toItem);
  }

  async findAncestors(id: string): Promise<FileSystemItem[]> {
    const { rows } = await this.pool.query<ItemRow>(
      `SELECT ${COLUMNS} FROM items
       WHERE path @> (SELECT path FROM items WHERE id = $1)
       ORDER BY nlevel(path)`,
      [id],
    );
    return rows.map(toItem);
  }
}
