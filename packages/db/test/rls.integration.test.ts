import { afterAll, beforeAll, describe, expect, test } from 'vite-plus/test';
import { books, eq, organization, withStoreContext } from '../src/index.ts';
import { startTestPostgres } from './harness.ts';
import type { TestPostgresHarness } from './harness.ts';

describe('PostgreSQL RLS multi-tenancy (packages/db)', () => {
  let pg: TestPostgresHarness;

  beforeAll(async () => {
    pg = await startTestPostgres();
  }, 60_000);

  afterAll(async () => {
    await pg?.stop();
  }, 30_000);

  test('app_user cannot read, mutate, or insert another store rows across RLS boundary', async () => {
    const { db } = pg.drizzleHandle;
    const storeA = 'store-a-id';
    const storeB = 'store-b-id';

    await db.insert(organization).values([
      { id: storeA, name: 'Store A', slug: 'store-a' },
      { id: storeB, name: 'Store B', slug: 'store-b' },
    ]);

    await withStoreContext(db, storeA, async (tx) => {
      await tx.insert(books).values({
        storeId: storeA,
        sku: 'SKU-A1',
        title: 'Book A',
        author: 'Author A',
        priceCents: 1500,
        stock: 10,
      });
    });

    await withStoreContext(db, storeB, async (tx) => {
      await tx.insert(books).values({
        storeId: storeB,
        sku: 'SKU-B1',
        title: 'Book B',
        author: 'Author B',
        priceCents: 2000,
        stock: 5,
      });
    });

    const storeABooks = await withStoreContext(db, storeA, async (tx) => tx.select().from(books));
    expect(storeABooks).toHaveLength(1);
    expect(storeABooks[0]?.storeId).toBe(storeA);
    expect(storeABooks[0]?.title).toBe('Book A');

    const updatedFromStoreA = await withStoreContext(db, storeA, async (tx) =>
      tx.update(books).set({ title: 'Tampered' }).where(eq(books.storeId, storeB)).returning(),
    );
    expect(updatedFromStoreA).toHaveLength(0);

    await expect(
      withStoreContext(db, storeA, async (tx) =>
        tx.insert(books).values({
          storeId: storeB,
          sku: 'SKU-CROSS',
          title: 'Cross-Tenant Inject',
          author: 'Attacker',
          priceCents: 100,
          stock: 1,
        }),
      ),
    ).rejects.toThrow();

    const noContextBooks = await db.select().from(books);
    expect(noContextBooks).toHaveLength(0);
  });
});
