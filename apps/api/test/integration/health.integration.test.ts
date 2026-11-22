import { createDbClient, createLogger } from '@starter/runtime';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, beforeAll, describe, expect, test } from 'vite-plus/test';
import { createApp } from '../../src/app.ts';

describe('API health integration (@testcontainers/postgresql)', () => {
  let container: Awaited<ReturnType<PostgreSqlContainer['start']>>;
  let connectionUri: string;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:17-alpine').start();
    connectionUri = container.getConnectionUri();
  }, 60_000);

  afterAll(async () => {
    await container?.stop();
  }, 30_000);

  test('returns 200 on /health/live, /health/ready, /openapi.json, and /docs against live Postgres', async () => {
    const db = createDbClient({ url: connectionUri });
    const logger = createLogger({ level: 'silent' });
    const app = createApp({ db, logger });

    try {
      const liveRes = await app.fetch(new Request('http://localhost/health/live'));
      expect(liveRes.status).toBe(200);
      expect(await liveRes.json()).toEqual({ status: 'ok' });

      const readyRes = await app.fetch(new Request('http://localhost/health/ready'));
      expect(readyRes.status).toBe(200);
      expect(await readyRes.json()).toEqual({
        status: 'ok',
        checks: { database: 'ok' },
      });

      const specRes = await app.fetch(new Request('http://localhost/openapi.json'));
      expect(specRes.status).toBe(200);

      const docsRes = await app.fetch(new Request('http://localhost/docs'));
      expect(docsRes.status).toBe(200);
    } finally {
      await db.close();
    }
  });

  test('returns 503 on /health/ready after database pool is closed', async () => {
    const db = createDbClient({ url: connectionUri });
    const logger = createLogger({ level: 'silent' });
    const app = createApp({ db, logger });

    await db.close();

    const readyRes = await app.fetch(new Request('http://localhost/health/ready'));
    expect(readyRes.status).toBe(503);
    expect(await readyRes.json()).toEqual({
      status: 'degraded',
      checks: { database: 'error' },
    });
  });
});
