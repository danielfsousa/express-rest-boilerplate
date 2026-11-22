import { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import type { DbClient, RuntimeLogger } from '@starter/runtime/types';
import { createHealthRouter } from './features/health/health.handlers.ts';

export interface CreateAppOptions {
  db: DbClient;
  logger: RuntimeLogger;
}

export function createApp({ db, logger }: CreateAppOptions): OpenAPIHono {
  const app = new OpenAPIHono();

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
