import { setTimeout as delay } from 'node:timers/promises';
import { bookSchema, orderSchema, storeExportSchema } from '@starter/contracts';
import { extractSessionCookie, startTestPostgres } from '@starter/db/test-harness';
import type { TestPostgresHarness } from '@starter/db/test-harness';
import { createBirdEmulator } from '@starter/email';
import {
  createInlineJobQueue,
  createPgBossJobQueue,
  registerDefaultJobHandlers,
} from '@starter/jobs';
import type { JobQueue } from '@starter/jobs';
import { createLogger } from '@starter/runtime';
import { createMemoryStorage, createS3Storage } from '@starter/runtime/storage';
import { GenericContainer } from 'testcontainers';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vite-plus/test';
import { createApp } from '../../../../apps/api/src/app.ts';
import { createAuth } from '../../../../apps/api/src/features/auth/auth.service.ts';

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
  let pg: TestPostgresHarness;
  let flociContainer: Awaited<ReturnType<GenericContainer['start']>>;
  let flociEndpoint: string;
  const openQueues: Array<JobQueue> = [];

  beforeAll(async () => {
    const [pgHarness, floci] = await Promise.all([
      startTestPostgres(),
      new GenericContainer('floci/floci:latest').withExposedPorts(4566).start(),
    ]);
    pg = pgHarness;
    flociContainer = floci;

    flociEndpoint = `http://${floci.getHost()}:${String(floci.getMappedPort(4566))}`;
    const bucketRes = await fetch(`${flociEndpoint}/bookstore-media`, {
      method: 'PUT',
    });
    expect(bucketRes.ok).toBe(true);
  }, 120_000);

  afterEach(async () => {
    await Promise.all(openQueues.splice(0).map((q) => q.stop()));
  });

  afterAll(async () => {
    await Promise.all([pg?.stop(), flociContainer?.stop()]);
  });

  test('processes pg-boss order receipt, low-stock alert, and CSV export jobs', async () => {
    const logger = createLogger({ level: 'silent' });
    const emulator = createBirdEmulator();
    const mailer = emulator.createMailer('noreply@bookstore.local');
    const storage = createS3Storage({
      endpoint: flociEndpoint,
      region: 'us-east-1',
      accessKeyId: 'test',
      secretAccessKey: 'test',
      bucket: 'bookstore-media',
    });

    const apiQueue = createPgBossJobQueue({
      connectionString: pg.appUri,
      schema: 'pgboss',
      retryLimit: 3,
      retryDelay: 30,
      retryBackoff: true,
    });
    const workerQueue = createPgBossJobQueue({
      connectionString: pg.appUri,
      schema: 'pgboss',
      retryLimit: 3,
      retryDelay: 30,
      retryBackoff: true,
      pollingIntervalSeconds: 0.5,
    });
    openQueues.push(apiQueue, workerQueue);

    await apiQueue.start();
    await workerQueue.start();
    await registerDefaultJobHandlers(workerQueue, {
      drizzleDb: pg.drizzleHandle.db,
      mailer,
      storage,
      logger,
    });

    const auth = createAuth({
      db: pg.drizzleHandle.db,
      secret: 'integration-test-secret-32-characters',
      baseURL: 'http://127.0.0.1:3001',
      trustedOrigins: ['http://127.0.0.1:3000'],
      mailer,
      i18nEnabled: true,
    });

    const app = createApp({
      db: pg.drizzleHandle,
      logger,
      drizzleDb: pg.drizzleHandle.db,
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

    const captured = await waitFor(async () => {
      const msgs = emulator.getMessages();
      const hasReceipt = msgs.some((msg) => msg.to.includes('joao@example.com'));
      const hasLowStock = msgs.some(
        (msg) =>
          msg.to.includes('ada-worker@example.com') &&
          msg.subject.includes('Designing Event-Driven Systems'),
      );
      return hasReceipt && hasLowStock ? msgs : null;
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

    const listExportsRes = await app.request('/api/v1/stores/worker-books/exports', {
      method: 'GET',
      headers: { cookie },
    });
    expect(listExportsRes.status).toBe(200);

    const downloadRes = await app.request(
      `/api/v1/stores/worker-books/exports/${queuedExport.id}/download`,
      { method: 'GET', headers: { cookie } },
    );
    expect(downloadRes.status).toBe(200);
    expect(downloadRes.headers.get('content-type')).toContain('text/csv');
    const downloadedCsv = await downloadRes.text();
    expect(downloadedCsv).toContain('WRK-1,Designing Event-Driven Systems');
  }, 30_000);

  test('FEATURE_JOBS_ENABLED=false inline fallback completes CSV export synchronously', async () => {
    const logger = createLogger({ level: 'silent' });
    const emulator = createBirdEmulator();
    const mailer = emulator.createMailer('noreply@bookstore.local');
    const storage = createMemoryStorage();

    const inlineQueue = createInlineJobQueue();
    openQueues.push(inlineQueue);
    await inlineQueue.start();
    await registerDefaultJobHandlers(inlineQueue, {
      drizzleDb: pg.drizzleHandle.db,
      mailer,
      storage,
      logger,
    });

    const auth = createAuth({
      db: pg.drizzleHandle.db,
      secret: 'integration-test-secret-32-characters',
      baseURL: 'http://127.0.0.1:3001',
      trustedOrigins: ['http://127.0.0.1:3000'],
    });

    const app = createApp({
      db: pg.drizzleHandle,
      logger,
      drizzleDb: pg.drizzleHandle.db,
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
  }, 30_000);
});
