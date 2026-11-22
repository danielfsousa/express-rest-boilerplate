import type { Database } from './client.ts';
import { organization } from './schema/index.ts';

export const DEFAULT_STORE_ID = 'default-store';
export const DEFAULT_STORE_SLUG = 'default';
export const DEFAULT_STORE_NAME = 'Default Bookstore';

export async function ensureDefaultStore(db: Database): Promise<void> {
  await db
    .insert(organization)
    .values({
      id: DEFAULT_STORE_ID,
      slug: DEFAULT_STORE_SLUG,
      name: DEFAULT_STORE_NAME,
      metadata: JSON.stringify({ lowStockThreshold: 5 }),
    })
    .onConflictDoNothing({ target: organization.id });
}
