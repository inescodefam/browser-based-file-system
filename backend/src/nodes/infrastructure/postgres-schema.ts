export const POSTGRES_SCHEMA = `
  CREATE EXTENSION IF NOT EXISTS ltree;

  CREATE TABLE IF NOT EXISTS nodes (
    id         uuid        PRIMARY KEY,
    name       text        NOT NULL,
    type       text        NOT NULL CHECK (type IN ('file', 'folder')),
    parent_id  uuid        REFERENCES nodes (id) ON DELETE CASCADE,
    path       ltree       NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  );

  CREATE UNIQUE INDEX IF NOT EXISTS nodes_parent_name_key
    ON nodes (parent_id, name) NULLS NOT DISTINCT;

  CREATE INDEX IF NOT EXISTS nodes_path_gist ON nodes USING GIST (path);

  CREATE INDEX IF NOT EXISTS nodes_file_name_idx
    ON nodes (name text_pattern_ops) WHERE type = 'file';
`;
