import type { DbClient, RuntimeLogger } from '@starter/runtime/types';
import { describe, expect, test, vi } from 'vite-plus/test';
import { z } from 'zod';
import { createApp } from '#/app.ts';

const openApiDocSchema = z.object({
  openapi: z.string(),
  paths: z.object({
    '/health/live': z.object({}),
    '/health/ready': z.object({}),
  }),
});

function createSilentLogger(): RuntimeLogger {
  const logger: RuntimeLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: () => logger,
  };
  return logger;
}

describe('GET /health/live, /health/ready, /openapi.json, /docs', () => {
  test('GET /health/live returns 200 ok', async () => {
    const dbHealth: DbClient = {
      ping: vi.fn().mockResolvedValue(true),
      close: vi.fn().mockResolvedValue(undefined),
    };
    const app = createApp({ dbHealth, logger: createSilentLogger() });

    const response = await app.fetch(new Request('http://localhost/health/live'));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  test('GET /health/ready returns 200 when database probe succeeds', async () => {
    const ping = vi.fn().mockResolvedValue(true);
    const dbHealth: DbClient = {
      ping,
      close: vi.fn().mockResolvedValue(undefined),
    };
    const app = createApp({ dbHealth, logger: createSilentLogger() });

    const response = await app.fetch(new Request('http://localhost/health/ready'));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: 'ok',
      checks: { database: 'ok' },
    });
    expect(ping).toHaveBeenCalledWith(2000);
  });

  test('GET /health/ready returns 503 when database probe fails or rejects', async () => {
    const dbHealth: DbClient = {
      ping: vi.fn().mockResolvedValue(false),
      close: vi.fn().mockResolvedValue(undefined),
    };
    const app = createApp({ dbHealth, logger: createSilentLogger() });

    const response = await app.fetch(new Request('http://localhost/health/ready'));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      status: 'degraded',
      checks: { database: 'error' },
    });
  });

  test('GET /openapi.json serves OpenAPI 3.1 document including health routes', async () => {
    const dbHealth: DbClient = {
      ping: vi.fn().mockResolvedValue(true),
      close: vi.fn().mockResolvedValue(undefined),
    };
    const app = createApp({ dbHealth, logger: createSilentLogger() });

    const response = await app.fetch(new Request('http://localhost/openapi.json'));
    expect(response.status).toBe(200);
    const doc = openApiDocSchema.parse(await response.json());
    expect(doc.openapi).toBe('3.1.0');
    expect(doc.paths['/health/live']).toBeDefined();
    expect(doc.paths['/health/ready']).toBeDefined();
  });

  test('GET /docs serves Scalar API reference HTML', async () => {
    const dbHealth: DbClient = {
      ping: vi.fn().mockResolvedValue(true),
      close: vi.fn().mockResolvedValue(undefined),
    };
    const app = createApp({ dbHealth, logger: createSilentLogger() });

    const response = await app.fetch(new Request('http://localhost/docs'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    const html = await response.text();
    expect(html).toContain('/openapi.json');
  });
});
