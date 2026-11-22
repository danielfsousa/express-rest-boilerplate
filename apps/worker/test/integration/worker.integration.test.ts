import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { bookSchema, orderSchema, storeExportSchema } from '@starter/contracts';
import { createDb, migrateDb, sql } from '@starter/db';
import { createBirdEmulatorFetch, createBirdMailer } from '@starter/email';
import {
  createInlineJobQueue,
  createPgBossJobQueue,
  registerDefaultJobHandlers,
} from '@starter/jobs';
import { createDbClient, createLogger } from '@starter/runtime';
import { createS3Storage } from '@starter/runtime/storage';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { GenericContainer } from 'testcontainers';
import { afterAll, beforeAll, describe, expect, test } from 'vite-plus/test';
import { z } from 'zod';
import { createApp } from '../../../../apps/api/src/app.ts';
import { createAuth } from '../../../../apps/api/src/features/auth/auth.service.ts';

const migrationsFolder = path.resolve(import.meta.dirname, '../../../../packages/db/drizzle');

const capturedMessagesSchema = z.object({
  messages: z.array(
    z.object({
      to: z.array(z.string()),
      subject: z.string(),
      html: z.string(),
      text: z.string(),
    }),
  ),
});

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

async function waitFor<T>(
  check: () => Promise<T | null>,
  timeoutMs = 10_000,
  intervalMs = 150,
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = await check();
    if (result !== null) {
      return result;
    }
    await delay(intervalMs);
  }
  throw new Error(`Timed out after ${String(timeoutMs)}ms waiting for condition`);
}

describe('pg-boss worker, emails, and CSV exports integration (apps/worker)', () => {
  let pgContainer: Awaited<ReturnType<PostgreSqlContainer['start']>>;
  let flociContainer: Awaited<ReturnType<GenericContainer['start']>>;
  let appUri: string;
  let flociEndpoint: string;

  beforeAll(async () => {
    const [pg, floci] = await Promise.all([
      new PostgreSqlContainer('postgres:17-alpine').start(),
      new GenericContainer('floci/floci:latest').withExposedPorts(4566).start(),
    ]);
    pgContainer = pg;
    flociContainer = floci;

    const adminUri = pg.getConnectionUri();
    const adminHandle = createDb(adminUri, 1);
    try {
      await adminHandle.db.execute(
        sql.raw(`
          CREATE ROLE app_user LOGIN PASSWORD 'app_password' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
          GRANT CONNECT, CREATE ON DATABASE ${pg.getDatabase()} TO app_user;
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
    appUri = parsed.toString();

    flociEndpoint = `http://${floci.getHost()}:${String(floci.getMappedPort(4566))}`;
    const bucketRes = await fetch(`${flociEndpoint}/bookstore-media`, {
      method: 'PUT',
    });
    expect(bucketRes.ok).toBe(true);
  }, 120_000);

  afterAll(async () => {
    await Promise.all([pgContainer?.stop(), flociContainer?.stop()]);
  });

  test('processes pg-boss order receipt, low-stock alert, and CSV export jobs', async () => {
    const logger = createLogger({ level: 'silent' });
    const dbClient = createDbClient({ url: appUri });
    const drizzleHandle = createDb(appUri);
    const emulatorFetch = createBirdEmulatorFetch();
    const mailer = createBirdMailer({
      apiBaseUrl: 'http://bird.emulator.test',
      apiKey: 'test-bird-key',
      fromEmail: 'noreply@bookstore.local',
      fetchImpl: emulatorFetch,
    });
    const storage = createS3Storage({
      endpoint: flociEndpoint,
      region: 'us-east-1',
      accessKeyId: 'test',
      secretAccessKey: 'test',
      bucket: 'bookstore-media',
    });

    const apiQueue = createPgBossJobQueue({
      connectionString: appUri,
      schema: 'pgboss',
      retryLimit: 3,
      retryDelay: 30,
      retryBackoff: true,
    });
    const workerQueue = createPgBossJobQueue({
      connectionString: appUri,
      schema: 'pgboss',
      retryLimit: 3,
      retryDelay: 30,
      retryBackoff: true,
      pollingIntervalSeconds: 0.5,
    });

    try {
      await apiQueue.start();
      await workerQueue.start();
      await registerDefaultJobHandlers(workerQueue, {
        drizzleDb: drizzleHandle.db,
        mailer,
        storage,
        logger,
      });
      const auth = createAuth({
        db: drizzleHandle.db,
        secret: 'integration-test-secret-32-characters',
        baseURL: 'http://127.0.0.1:3001',
        trustedOrigins: ['http://127.0.0.1:3000'],
        mailer,
        i18nEnabled: true,
      });

      const app = createApp({
        db: dbClient,
        logger,
        drizzleDb: drizzleHandle.db,
        auth,
        storage,
        jobQueue: apiQueue,
        multiTenancyEnabled: true,
        billingEnabled: false,
      });

      const signUpRes = await app.request('/api/auth/sign-up/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Ada Merchant',
          email: 'ada-worker@example.com',
          password: 'Password123!',
        }),
      });
      expect(signUpRes.status).toBe(200);
      const cookie = extractSessionCookie(signUpRes);

      const storeRes = await app.request('/api/v1/stores', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie },
        body: JSON.stringify({ name: 'Worker Books', slug: 'worker-books' }),
      });
      expect(storeRes.status).toBe(201);

      const bookRes = await app.request('/api/v1/stores/worker-books/books', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie },
        body: JSON.stringify({
          sku: 'WRK-1',
          title: 'Designing Event-Driven Systems',
          author: 'Ben Stopford',
          description: 'Kafka and queues',
          priceCents: 3500,
          currency: 'USD',
          stock: 6,
          published: true,
        }),
      });
      expect(bookRes.status).toBe(201);
      const book = bookSchema.parse(await bookRes.json());

      // Order 2 units so stock drops to 4 (<= default threshold 5), localized in pt-BR.
      const orderRes = await app.request('/api/v1/stores/worker-books/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Joao Silva',
          customerEmail: 'joao@example.com',
          customerLocale: 'pt-BR',
          items: [{ bookId: book.id, quantity: 2 }],
        }),
      });
      expect(orderRes.status).toBe(201);
      const order = orderSchema.parse(await orderRes.json());
      expect(order.status).toBe('paid');

      // Wait for pg-boss worker to deliver both order receipt (pt-BR) and low-stock alert emails.
      const captured = await waitFor(async () => {
        const res = await emulatorFetch(new Request('http://bird.emulator.test/__messages'));
        const parsed = capturedMessagesSchema.parse(await res.json());
        const hasReceipt = parsed.messages.some((msg) => msg.to.includes('joao@example.com'));
        const hasLowStock = parsed.messages.some(
          (msg) =>
            msg.to.includes('ada-worker@example.com') &&
            msg.subject.includes('Designing Event-Driven Systems'),
        );
        return hasReceipt && hasLowStock ? parsed.messages : null;
      });

      const receiptMsg = captured.find((msg) => msg.to.includes('joao@example.com'));
      expect(receiptMsg?.subject).toContain('Worker Books');
      expect(receiptMsg?.html).toContain(order.id);

      const lowStockMsg = captured.find(
        (msg) =>
          msg.to.includes('ada-worker@example.com') &&
          msg.subject.includes('Designing Event-Driven Systems'),
      );
      expect(lowStockMsg?.subject).toContain('Designing Event-Driven Systems');
      expect(lowStockMsg?.text).toContain('4');

      // Trigger CSV export job and poll until completed.
      const exportCreateRes = await app.request('/api/v1/stores/worker-books/exports/books', {
        method: 'POST',
        headers: { cookie },
      });
      expect(exportCreateRes.status).toBe(202);
      const queuedExport = storeExportSchema.parse(await exportCreateRes.json());

      const completedExport = await waitFor(async () => {
        const res = await app.request(`/api/v1/stores/worker-books/exports/${queuedExport.id}`, {
          method: 'GET',
          headers: { cookie },
        });
        const exp = storeExportSchema.parse(await res.json());
        return exp.status === 'completed' ? exp : null;
      });

      expect(completedExport.fileKey).toBeTruthy();
      expect(completedExport.downloadUrl).toBe(
        `/api/v1/stores/worker-books/exports/${queuedExport.id}/download`,
      );

      if (completedExport.fileKey) {
        const stored = await storage.getObject(completedExport.fileKey);
        expect(stored).not.toBeNull();
        const csvInFloci = new TextDecoder().decode(stored?.body);
        expect(csvInFloci).toContain('id,sku,title,author,priceCents,currency,stock,published');
        expect(csvInFloci).toContain(
          'WRK-1,Designing Event-Driven Systems,Ben Stopford,3500,USD,4,true',
        );
      }

      const downloadRes = await app.request(
        `/api/v1/stores/worker-books/exports/${queuedExport.id}/download`,
        { method: 'GET', headers: { cookie } },
      );
      expect(downloadRes.status).toBe(200);
      expect(downloadRes.headers.get('content-type')).toContain('text/csv');
      const downloadedCsv = await downloadRes.text();
      expect(downloadedCsv).toContain('WRK-1,Designing Event-Driven Systems');
    } finally {
      await Promise.all([apiQueue.stop(), workerQueue.stop()]);
      await Promise.all([drizzleHandle.close(), dbClient.close()]);
    }
  }, 30_000);

  test('FEATURE_JOBS_ENABLED=false inline fallback completes CSV export synchronously', async () => {
    const logger = createLogger({ level: 'silent' });
    const dbClient = createDbClient({ url: appUri });
    const drizzleHandle = createDb(appUri);
    const emulatorFetch = createBirdEmulatorFetch();
    const mailer = createBirdMailer({
      apiBaseUrl: 'http://bird.emulator.test',
      apiKey: 'test-bird-key',
      fromEmail: 'noreply@bookstore.local',
      fetchImpl: emulatorFetch,
    });
    const storage = createS3Storage({
      endpoint: flociEndpoint,
      region: 'us-east-1',
      accessKeyId: 'test',
      secretAccessKey: 'test',
      bucket: 'bookstore-media',
    });

    const inlineQueue = createInlineJobQueue();
    await inlineQueue.start();
    await registerDefaultJobHandlers(inlineQueue, {
      drizzleDb: drizzleHandle.db,
      mailer,
      storage,
      logger,
    });

    try {
      const auth = createAuth({
        db: drizzleHandle.db,
        secret: 'integration-test-secret-32-characters',
        baseURL: 'http://127.0.0.1:3001',
        trustedOrigins: ['http://127.0.0.1:3000'],
      });

      const app = createApp({
        db: dbClient,
        logger,
        drizzleDb: drizzleHandle.db,
        auth,
        storage,
        jobQueue: inlineQueue,
        multiTenancyEnabled: true,
        billingEnabled: false,
      });

      const signUpRes = await app.request('/api/auth/sign-up/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Inline Merchant',
          email: 'inline-worker@example.com',
          password: 'Password123!',
        }),
      });
      const cookie = extractSessionCookie(signUpRes);

      await app.request('/api/v1/stores', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie },
        body: JSON.stringify({ name: 'Inline Books', slug: 'inline-books' }),
      });

      await app.request('/api/v1/stores/inline-books/books', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie },
        body: JSON.stringify({
          sku: 'INL-1',
          title: 'Inline Queue Book',
          author: 'Grace Hopper',
          description: 'Synchronous fallback',
          priceCents: 2000,
          currency: 'USD',
          stock: 10,
          published: true,
        }),
      });

      const exportRes = await app.request('/api/v1/stores/inline-books/exports/books', {
        method: 'POST',
        headers: { cookie },
      });
      expect(exportRes.status).toBe(202);
      const exp = storeExportSchema.parse(await exportRes.json());
      expect(exp.status).toBe('completed');
      expect(exp.downloadUrl).toBeTruthy();
    } finally {
      await inlineQueue.stop();
      await Promise.all([drizzleHandle.close(), dbClient.close()]);
    }
  }, 30_000);
});
