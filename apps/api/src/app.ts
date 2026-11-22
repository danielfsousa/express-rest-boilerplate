import { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import type { Database } from '@starter/db';
import type { DbClient, RuntimeLogger } from '@starter/runtime/types';
import { cors } from 'hono/cors';
import type { AuthInstance } from './features/auth/auth.service.ts';
import { createHealthRouter } from './features/health/health.handlers.ts';
import { createStoresRouter } from './features/stores/stores.handlers.ts';

export interface CreateAppOptions {
  db: DbClient;
  logger: RuntimeLogger;
  drizzleDb?: Database;
  auth?: AuthInstance;
  multiTenancyEnabled?: boolean;
  trustedOrigins?: Array<string>;
}

export function createApp({
  db,
  logger,
  drizzleDb,
  auth,
  multiTenancyEnabled = true,
  trustedOrigins = ['http://127.0.0.1:3000'],
}: CreateAppOptions): OpenAPIHono {
  const app = new OpenAPIHono();

  app.use(
    '*',
    cors({
      origin: trustedOrigins,
      allowHeaders: ['Content-Type', 'Authorization'],
      allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true,
    }),
  );

  app.use('*', async (c, next) => {
    const requestId = c.req.header('x-request-id') ?? crypto.randomUUID();
    const start = Date.now();
    await next();
    c.header('x-request-id', requestId);
    logger.info(
      {
        requestId,
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        durationMs: Date.now() - start,
      },
      'HTTP request completed',
    );
  });

  app.route('/', createHealthRouter(db));

  if (auth) {
    app.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw));
  }

  if (drizzleDb && auth) {
    app.route('/', createStoresRouter({ drizzleDb, auth, multiTenancyEnabled }));
  }

  app.doc31('/openapi.json', {
    openapi: '3.1.0',
    info: {
      title: 'nodejs-fullstack-starter API',
      version: '2.0.0',
    },
  });

  app.get(
    '/docs',
    Scalar({
      url: '/openapi.json',
      pageTitle: 'nodejs-fullstack-starter API Docs',
    }),
  );

  return app;
}
