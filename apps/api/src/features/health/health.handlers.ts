import { OpenAPIHono } from '@hono/zod-openapi';
import type { DbClient } from '@starter/runtime/types';
import { healthLiveRoute, healthReadyRoute } from './health.routes.ts';

const DB_PROBE_TIMEOUT_MS = 2000;

export function createHealthRouter(db: DbClient): OpenAPIHono {
  const router = new OpenAPIHono();

  router.openapi(healthLiveRoute, (c) => c.json({ status: 'ok' as const }, 200));

  router.openapi(healthReadyRoute, async (c) => {
    const ok = await db.ping(DB_PROBE_TIMEOUT_MS);
    if (ok) {
      return c.json(
        {
          status: 'ok' as const,
          checks: { database: 'ok' as const },
        },
        200,
      );
    }

    return c.json(
      {
        status: 'degraded' as const,
        checks: { database: 'error' as const },
      },
      503,
    );
  });

  return router;
}
