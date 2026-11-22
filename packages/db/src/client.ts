import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { relations } from './relations.ts';

export function createDb(url: string, maxConnections = 10) {
  const client = postgres(url, { max: maxConnections, connect_timeout: 5 });
  const db = drizzle({ client, relations });
  return {
    db,
    close: async (): Promise<void> => {
      await client.end({ timeout: 5 });
    },
  };
}

export type Database = ReturnType<typeof createDb>['db'];
export type DatabaseTransaction = Parameters<Parameters<Database['transaction']>[0]>[0];

export async function migrateDb(adminUrl: string, migrationsFolder: string): Promise<void> {
  const client = postgres(adminUrl, { max: 1, connect_timeout: 10 });
  try {
    const db = drizzle({ client, relations });
    await migrate(db, { migrationsFolder });
  } finally {
    await client.end({ timeout: 5 });
  }
}
