import { bookSchema, orderSchema } from '@starter/contracts';
import { extractSessionCookie, startTestPostgres } from '@starter/db/test-harness';
import type { TestPostgresHarness } from '@starter/db/test-harness';
import { createLogger } from '@starter/runtime';
import { afterAll, beforeAll, describe, expect, test } from 'vite-plus/test';
import { createApp } from '../../src/app.ts';
import { createAuth } from '../../src/features/auth/auth.service.ts';

describe('Orders, atomic stock, and RLS integration (apps/api)', () => {
  let pg: TestPostgresHarness;

  beforeAll(async () => {
    pg = await startTestPostgres();
  }, 60_000);

  afterAll(async () => {
    await pg?.stop();
  }, 30_000);

  test('rejects concurrent oversells with 409, restores stock on cancel, and enforces RLS', async () => {
    const logger = createLogger({ level: 'silent' });
    const auth = createAuth({
      db: pg.drizzleHandle.db,
      secret: 'test-secret-with-at-least-32-characters',
      baseURL: 'http://localhost',
      trustedOrigins: ['http://localhost'],
    });
    const app = createApp({
      db: pg.drizzleHandle,
      logger,
      drizzleDb: pg.drizzleHandle.db,
      auth,
      multiTenancyEnabled: true,
    });

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
  });
});
