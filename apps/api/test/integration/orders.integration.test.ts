import path from 'node:path';
import { bookSchema, orderSchema } from '@starter/contracts';
import { createDb, migrateDb, sql } from '@starter/db';
import { createDbClient, createLogger } from '@starter/runtime';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, beforeAll, describe, expect, test } from 'vite-plus/test';
import { createApp } from '../../src/app.ts';
import { createAuth } from '../../src/features/auth/auth.service.ts';

const migrationsFolder = path.resolve(import.meta.dirname, '../../../../packages/db/drizzle');

function extractSessionCookie(response: Response): string {
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) {
    throw new Error('Expected set-cookie header from auth response');
  }
  const firstPair = setCookie.split(';')[0];
  if (!firstPair) {
    throw new Error('Malformed set-cookie header');
  }
  return firstPair;
}

describe('Orders, atomic stock, and RLS integration (apps/api)', () => {
  let container: Awaited<ReturnType<PostgreSqlContainer['start']>>;
  let appUri: string;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:17-alpine').start();
    const adminUri = container.getConnectionUri();

    const adminHandle = createDb(adminUri, 1);
    try {
      await adminHandle.db.execute(
        sql.raw(`
          CREATE ROLE app_user LOGIN PASSWORD 'app_password' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
          GRANT CONNECT ON DATABASE ${container.getDatabase()} TO app_user;
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
    appUri = parsed.toString();
  }, 60_000);

  afterAll(async () => {
    await container?.stop();
  }, 30_000);

  test('rejects concurrent oversells with 409, restores stock on cancel, and enforces RLS', async () => {
    const db = createDbClient({ url: appUri });
    const drizzleHandle = createDb(appUri);
    const logger = createLogger({ level: 'silent' });
    const auth = createAuth({
      db: drizzleHandle.db,
      secret: 'test-secret-with-at-least-32-characters',
      baseURL: 'http://localhost',
      trustedOrigins: ['http://localhost'],
    });
    const app = createApp({
      db,
      logger,
      drizzleDb: drizzleHandle.db,
      auth,
      multiTenancyEnabled: true,
    });

    try {
      const signUpA = await app.fetch(
        new Request('http://localhost/api/auth/sign-up/email', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: 'Owner A',
            email: 'ownera@orders.test',
            password: 'Password123!',
          }),
        }),
      );
      const cookieA = extractSessionCookie(signUpA);

      await app.fetch(
        new Request('http://localhost/api/v1/stores', {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie: cookieA },
          body: JSON.stringify({ name: 'Store One', slug: 'store-one' }),
        }),
      );

      const createBookRes = await app.fetch(
        new Request('http://localhost/api/v1/stores/store-one/books', {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie: cookieA },
          body: JSON.stringify({
            sku: 'HOT-1',
            title: 'Limited Edition',
            author: 'Ada',
            priceCents: 3000,
            stock: 3,
            published: true,
          }),
        }),
      );
      const book = bookSchema.parse(await createBookRes.json());

      // Fire 5 concurrent checkout requests for 1 unit each when stock = 3
      const attempts = await Promise.all(
        Array.from({ length: 5 }, (_unused, idx) =>
          app.fetch(
            new Request('http://localhost/api/v1/stores/store-one/orders', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                customerEmail: `buyer${String(idx)}@example.com`,
                customerName: `Buyer ${String(idx)}`,
                items: [{ bookId: book.id, quantity: 1 }],
              }),
            }),
          ),
        ),
      );

      const statuses = attempts.map((res) => res.status);
      expect(statuses.filter((s) => s === 201)).toHaveLength(3);
      expect(statuses.filter((s) => s === 409)).toHaveLength(2);

      const createdOrders = await Promise.all(
        attempts
          .filter((res) => res.status === 201)
          .map(async (res) => orderSchema.parse(await res.json())),
      );

      const afterOrdersBook = bookSchema.parse(
        await (
          await app.fetch(new Request(`http://localhost/api/v1/stores/store-one/books/${book.id}`))
        ).json(),
      );
      expect(afterOrdersBook.stock).toBe(0);

      const firstOrder = createdOrders[0];
      const secondOrder = createdOrders[1];
      expect(firstOrder).toBeDefined();
      expect(secondOrder).toBeDefined();
      if (!firstOrder || !secondOrder) {
        return;
      }

      // Fulfill order 1, then invalid transition fulfilled -> cancelled returns 409
      const fulfillRes = await app.fetch(
        new Request(`http://localhost/api/v1/stores/store-one/orders/${firstOrder.id}/status`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json', cookie: cookieA },
          body: JSON.stringify({ status: 'fulfilled' }),
        }),
      );
      expect(fulfillRes.status).toBe(200);

      const invalidCancel = await app.fetch(
        new Request(`http://localhost/api/v1/stores/store-one/orders/${firstOrder.id}/status`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json', cookie: cookieA },
          body: JSON.stringify({ status: 'cancelled' }),
        }),
      );
      expect(invalidCancel.status).toBe(409);

      // Cancel order 2 and verify stock is restored from 0 to 1
      const cancelRes = await app.fetch(
        new Request(`http://localhost/api/v1/stores/store-one/orders/${secondOrder.id}/status`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json', cookie: cookieA },
          body: JSON.stringify({ status: 'cancelled' }),
        }),
      );
      expect(cancelRes.status).toBe(200);

      const restoredBook = bookSchema.parse(
        await (
          await app.fetch(new Request(`http://localhost/api/v1/stores/store-one/books/${book.id}`))
        ).json(),
      );
      expect(restoredBook.stock).toBe(1);

      // Store B cannot list Store One orders or read Store One order by ID
      const signUpB = await app.fetch(
        new Request('http://localhost/api/auth/sign-up/email', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: 'Owner B',
            email: 'ownerb@orders.test',
            password: 'Password123!',
          }),
        }),
      );
      const cookieB = extractSessionCookie(signUpB);

      await app.fetch(
        new Request('http://localhost/api/v1/stores', {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie: cookieB },
          body: JSON.stringify({ name: 'Store Two', slug: 'store-two' }),
        }),
      );

      const crossList = await app.fetch(
        new Request('http://localhost/api/v1/stores/store-one/orders', {
          headers: { cookie: cookieB },
        }),
      );
      expect(crossList.status).toBe(403);

      const crossGet = await app.fetch(
        new Request(`http://localhost/api/v1/stores/store-two/orders/${firstOrder.id}`),
      );
      expect(crossGet.status).toBe(404);
    } finally {
      await drizzleHandle.close();
      await db.close();
    }
  });
});
