import path from 'node:path';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { sql } from 'drizzle-orm';
import { createDb, migrateDb } from '../src/client.ts';

const defaultMigrationsFolder = path.resolve(import.meta.dirname, '../drizzle');

export interface TestPostgresHarness {
  adminUri: string;
  appUri: string;
  database: string;
  drizzleHandle: ReturnType<typeof createDb>;
  stop: () => Promise<void>;
}

export async function startTestPostgres(
  migrationsFolder = defaultMigrationsFolder,
): Promise<TestPostgresHarness> {
  const container = await new PostgreSqlContainer('postgres:17-alpine').start();
  const adminUri = container.getConnectionUri();
  const database = container.getDatabase();

  const adminHandle = createDb(adminUri, 1);
  await adminHandle.db.execute(
    sql.raw(`
      CREATE ROLE app_user LOGIN PASSWORD 'app_password' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
      GRANT CONNECT, CREATE ON DATABASE ${database} TO app_user;
      CREATE SCHEMA IF NOT EXISTS pgboss AUTHORIZATION app_user;
      GRANT USAGE ON SCHEMA public TO app_user;
    `),
  );
  await adminHandle.close();

  await migrateDb(adminUri, migrationsFolder);

  const parsed = new URL(adminUri);
  parsed.username = 'app_user';
  parsed.password = 'app_password';
  const appUri = parsed.toString();
  const drizzleHandle = createDb(appUri);

  return {
    adminUri,
    appUri,
    database,
    drizzleHandle,
    stop: async () => {
      await drizzleHandle.close();
      await container.stop();
    },
  };
}

export function extractSessionCookie(response: Response): string {
  const cookieJar = new Map<string, string>();
  for (const header of response.headers.getSetCookie()) {
    const firstPair = header.split(';')[0]?.trim();
    if (!firstPair) {
      continue;
    }
    const eqIndex = firstPair.indexOf('=');
    if (eqIndex <= 0) {
      continue;
    }
    const name = firstPair.slice(0, eqIndex).trim();
    const value = firstPair.slice(eqIndex + 1).trim();
    if (value.length > 0) {
      cookieJar.set(name, `${name}=${value}`);
    }
  }
  if (cookieJar.size === 0) {
    throw new Error('Expected set-cookie header from auth response');
  }
  return [...cookieJar.values()].join('; ');
}
