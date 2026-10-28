import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.api-spec.ts'],
    env: { DB_DRIVER: 'memory', SEARCH_LIMIT: '10' },
  },
});
