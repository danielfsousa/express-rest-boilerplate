import path from 'node:path';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { sql } from 'drizzle-orm';
import { createDb, migrateDb } from '../src/client.ts';

const defaultMigrationsFolder = path.resolve(import.meta.dirname, '../drizzle');

export interface TestPostgresHarness {
  adminUri: string;
  appUri: string;
  database: string;
  stop: () => Promise<void>;
}

export async function startTestPostgres(
  migrationsFolder = defaultMigrationsFolder,
): Promise<TestPostgresHarness> {
  const container = await new PostgreSqlContainer('postgres:17-alpine').start();
  const adminUri = container.getConnectionUri();
  const database = container.getDatabase();

  const adminHandle = createDb(adminUri, 1);
  try {
    await adminHandle.db.execute(
      sql.raw(`
        CREATE ROLE app_user LOGIN PASSWORD 'app_password' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
        GRANT CONNECT, CREATE ON DATABASE ${database} TO app_user;
        CREATE SCHEMA IF NOT EXISTS pgboss AUTHORIZATION app_user;
        GRANT USAGE ON SCHEMA public TO app_user;
      `),
    );
  } finally {
    await adminHandle.close();
  }

  await migrateDb(adminUri, migrationsFolder);

  const parsed = new URL(adminUri);
  parsed.username = 'app_user';
  parsed.password = 'app_password';

  return {
    adminUri,
    appUri: parsed.toString(),
    database,
    stop: async () => {
      await container.stop();
    },
  };
}
