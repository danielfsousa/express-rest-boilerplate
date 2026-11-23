import { sql } from 'drizzle-orm';
import type { DatabaseTransaction, DbExecutor } from './client.ts';

export async function withStoreContext<T>(
  db: DbExecutor,
  storeId: string,
  fn: (tx: DatabaseTransaction) => Promise<T>,
): Promise<T> {
  return await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.current_store_id', ${storeId}, true)`);
    return await fn(tx);
  });
}
