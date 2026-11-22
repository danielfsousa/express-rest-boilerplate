import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env['DATABASE_ADMIN_URL'] ?? 'postgres://postgres:postgres@127.0.0.1:5432/bookstore',
  },
});
