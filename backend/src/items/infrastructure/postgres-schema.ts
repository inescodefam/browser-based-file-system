export const POSTGRES_SCHEMA = `
  CREATE EXTENSION IF NOT EXISTS ltree;

  CREATE TABLE IF NOT EXISTS items (
    id         uuid        PRIMARY KEY,
    name       text        NOT NULL,
    type       text        NOT NULL CHECK (type IN ('file', 'folder')),
    parent_id  uuid        REFERENCES items (id) ON DELETE CASCADE,
    path       ltree       NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  );

  CREATE UNIQUE INDEX IF NOT EXISTS items_parent_name_key
    ON items (parent_id, name) NULLS NOT DISTINCT;

  CREATE INDEX IF NOT EXISTS items_path_gist ON items USING GIST (path);

  CREATE INDEX IF NOT EXISTS items_file_name_idx
    ON items (name text_pattern_ops) WHERE type = 'file';
`;
