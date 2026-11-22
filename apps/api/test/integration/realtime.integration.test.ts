import { bookSchema, orderSchema, realtimeEventSchema } from '@starter/contracts';
import type { RealtimeEvent } from '@starter/contracts';
import { createDb } from '@starter/db';
import { createLogger, createServer } from '@starter/runtime';
import {
  createMemoryRealtimeBroker,
  createNoopRealtimeBroker,
  createPostgresRealtimeBroker,
} from '@starter/runtime/realtime';
import type { WebSocketAdapter } from '@starter/runtime/types';
import { afterAll, beforeAll, describe, expect, test } from 'vite-plus/test';
import WsClient from 'ws';
import { startTestPostgres } from '../../../../packages/db/test/harness.ts';
import type { TestPostgresHarness } from '../../../../packages/db/test/harness.ts';
import { createApp } from '../../src/app.ts';
import { createAuth } from '../../src/features/auth/auth.service.ts';

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

function connectWebSocket(url: string, cookie?: string): Promise<WsClient> {
  return new Promise((resolve, reject) => {
    const ws = cookie ? new WsClient(url, { headers: { cookie } }) : new WsClient(url);
    ws.once('open', () => {
      resolve(ws);
    });
    ws.once('error', () => {
      reject(new Error(`WebSocket connection failed for ${url}`));
    });
  });
}

function nextRealtimeEvent(ws: WsClient, timeoutMs = 5000): Promise<RealtimeEvent> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timed out waiting for WebSocket event after ${String(timeoutMs)}ms`));
    }, timeoutMs);

    ws.once('message', (data) => {
      clearTimeout(timer);
      const text = typeof data === 'string' ? data : data.toString('utf8');
      resolve(realtimeEventSchema.parse(JSON.parse(text)));
    });
  });
}

describe('Hono WebSockets and Postgres LISTEN/NOTIFY realtime integration (apps/api)', () => {
  let pg: TestPostgresHarness;

  beforeAll(async () => {
    pg = await startTestPostgres();
  }, 120_000);

  afterAll(async () => {
    await pg?.stop();
  });

  test('streams order.created and order.status_changed with tenant isolation', async () => {
    const logger = createLogger({ level: 'silent' });
    const drizzleHandle = createDb(pg.appUri);
    const broker = createMemoryRealtimeBroker();
    let webSocketAdapter: WebSocketAdapter | undefined;

    const auth = createAuth({
      db: drizzleHandle.db,
      secret: 'integration-test-secret-32-characters',
      baseURL: 'http://127.0.0.1:3001',
      trustedOrigins: ['http://127.0.0.1:3000'],
    });

    const app = createApp({
      db: drizzleHandle,
      logger,
      drizzleDb: drizzleHandle.db,
      auth,
      realtimeEnabled: true,
      realtimeBroker: broker,
      onWebSocketAdapter: (adapter) => {
        webSocketAdapter = adapter;
      },
      multiTenancyEnabled: true,
      billingEnabled: false,
    });

    const server = await createServer({
      fetch: app.fetch,
      port: 0,
      hostname: '127.0.0.1',
      webSocketAdapter,
    });

    const wsBase = server.url.replace(/^http/, 'ws');
    let merchantWs: WsClient | undefined;
    let customerWs: WsClient | undefined;

    try {
      const signUpA = await fetch(`${server.url}/api/auth/sign-up/email`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Store A Owner',
          email: 'owner-a@example.com',
          password: 'Password123!',
        }),
      });
      const cookieA = extractSessionCookie(signUpA);

      const signUpB = await fetch(`${server.url}/api/auth/sign-up/email`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Store B Owner',
          email: 'owner-b@example.com',
          password: 'Password123!',
        }),
      });
      const cookieB = extractSessionCookie(signUpB);

      await fetch(`${server.url}/api/v1/stores`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: cookieA },
        body: JSON.stringify({ name: 'Store A', slug: 'rt-store-a' }),
      });
      await fetch(`${server.url}/api/v1/stores`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: cookieB },
        body: JSON.stringify({ name: 'Store B', slug: 'rt-store-b' }),
      });

      const bookARes = await fetch(`${server.url}/api/v1/stores/rt-store-a/books`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: cookieA },
        body: JSON.stringify({
          sku: 'RT-A1',
          title: 'Realtime Book A',
          author: 'Author A',
          description: 'Live updates',
          priceCents: 2500,
          currency: 'USD',
          stock: 10,
          published: true,
        }),
      });
      const bookA = bookSchema.parse(await bookARes.json());

      const bookBRes = await fetch(`${server.url}/api/v1/stores/rt-store-b/books`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: cookieB },
        body: JSON.stringify({
          sku: 'RT-B1',
          title: 'Realtime Book B',
          author: 'Author B',
          description: 'Isolated store',
          priceCents: 3000,
          currency: 'USD',
          stock: 10,
          published: true,
        }),
      });
      const bookB = bookSchema.parse(await bookBRes.json());

      // Connect Store A merchant WebSocket.
      merchantWs = await connectWebSocket(`${wsBase}/api/v1/stores/rt-store-a/ws`, cookieA);

      // Create an order in Store B first -> Store A merchant must NOT receive it.
      const orderBRes = await fetch(`${server.url}/api/v1/stores/rt-store-b/orders`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Bob',
          customerEmail: 'bob@example.com',
          customerLocale: 'en',
          items: [{ bookId: bookB.id, quantity: 1 }],
        }),
      });
      const orderB = orderSchema.parse(await orderBRes.json());

      // Cross-tenant order channel request on Store A for Store B's orderId returns 404.
      const crossTenantRes = await fetch(
        `${server.url}/api/v1/stores/rt-store-a/ws?orderId=${orderB.id}`,
      );
      expect(crossTenantRes.status).toBe(404);

      // Now create an order in Store A -> Store A merchant receives order.created for Store A (NOT Store B).
      const createdEventPromise = nextRealtimeEvent(merchantWs);
      const orderARes = await fetch(`${server.url}/api/v1/stores/rt-store-a/orders`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Alice',
          customerEmail: 'alice@example.com',
          customerLocale: 'en',
          items: [{ bookId: bookA.id, quantity: 1 }],
        }),
      });
      const orderA = orderSchema.parse(await orderARes.json());

      const createdEvent = await createdEventPromise;
      expect(createdEvent.type).toBe('order.created');
      expect(createdEvent.orderId).toBe(orderA.id);
      expect(createdEvent.storeId).toBe(orderA.storeId);

      // Customer subscribes to order:<orderA.id> and receives order.status_changed when merchant fulfills.
      customerWs = await connectWebSocket(
        `${wsBase}/api/v1/stores/rt-store-a/ws?orderId=${orderA.id}`,
      );
      const customerEventPromise = nextRealtimeEvent(customerWs);
      const merchantStatusPromise = nextRealtimeEvent(merchantWs);

      const fulfillRes = await fetch(
        `${server.url}/api/v1/stores/rt-store-a/orders/${orderA.id}/status`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json', cookie: cookieA },
          body: JSON.stringify({ status: 'fulfilled' }),
        },
      );
      expect(fulfillRes.status).toBe(200);

      const [customerEvent, merchantStatusEvent] = await Promise.all([
        customerEventPromise,
        merchantStatusPromise,
      ]);
      expect(customerEvent.type).toBe('order.status_changed');
      expect(customerEvent.status).toBe('fulfilled');
      expect(merchantStatusEvent.type).toBe('order.status_changed');
      expect(merchantStatusEvent.status).toBe('fulfilled');
    } finally {
      merchantWs?.close();
      customerWs?.close();
      await server.close();
      await broker.close();
      await drizzleHandle.close();
    }
  }, 30_000);

  test('Postgres LISTEN/NOTIFY broker fans out events across separate broker instances', async () => {
    const [brokerA, brokerB] = await Promise.all([
      createPostgresRealtimeBroker({ url: pg.appUri }),
      createPostgresRealtimeBroker({ url: pg.appUri }),
    ]);

    try {
      const received = new Promise<string>((resolve) => {
        brokerB.subscribe('store:fanout:orders', (payload) => {
          resolve(payload);
        });
      });

      await brokerA.publish('store:fanout:orders', JSON.stringify({ hello: 'fanout' }));
      expect(await received).toBe(JSON.stringify({ hello: 'fanout' }));
    } finally {
      await Promise.all([brokerA.close(), brokerB.close()]);
    }
  });

  test('FEATURE_REALTIME_ENABLED=false omits the WebSocket route (404)', async () => {
    const logger = createLogger({ level: 'silent' });
    const drizzleHandle = createDb(pg.appUri);
    const broker = createNoopRealtimeBroker();

    try {
      const auth = createAuth({
        db: drizzleHandle.db,
        secret: 'integration-test-secret-32-characters',
        baseURL: 'http://127.0.0.1:3001',
        trustedOrigins: ['http://127.0.0.1:3000'],
      });

      const app = createApp({
        db: drizzleHandle,
        logger,
        drizzleDb: drizzleHandle.db,
        auth,
        realtimeEnabled: false,
        realtimeBroker: broker,
      });

      const res = await app.request('/api/v1/stores/rt-store-a/ws');
      expect(res.status).toBe(404);
    } finally {
      await broker.close();
      await drizzleHandle.close();
    }
  });
});
