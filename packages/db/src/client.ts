import { setTimeout as delay } from 'node:timers/promises';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { relations } from './relations.ts';

export function createDb(url: string, maxConnections = 10) {
  const client = postgres(url, { max: maxConnections, connect_timeout: 5 });
  const db = drizzle({ client, relations });
  return {
    db,
    ping: async (timeoutMs = 2000): Promise<boolean> => {
      const controller = new AbortController();
      try {
        const timeoutPromise = delay(timeoutMs, undefined, { signal: controller.signal }).then(
          () => {
            throw new Error(`Database ping timed out after ${String(timeoutMs)} ms`);
          },
        );
        await Promise.race([client`SELECT 1`, timeoutPromise]);
        return true;
      } catch {
        return false;
      } finally {
        controller.abort();
      }
    },
    close: async (): Promise<void> => {
      await client.end({ timeout: 5 });
    },
  };
}

export type Database = ReturnType<typeof createDb>['db'];
export type DatabaseTransaction = Parameters<Parameters<Database['transaction']>[0]>[0];
export type DbExecutor = Database | DatabaseTransaction;

export async function migrateDb(adminUrl: string, migrationsFolder: string): Promise<void> {
  const client = postgres(adminUrl, { max: 1, connect_timeout: 10 });
  try {
    const db = drizzle({ client, relations });
    await migrate(db, { migrationsFolder });
  } finally {
    await client.end({ timeout: 5 });
  }
}
