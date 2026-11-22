import { OpenAPIHono } from '@hono/zod-openapi';
import type { Database } from '@starter/db';
import { resolvePlatformAdmin } from '#/middleware/store-context.ts';
import type { AuthInstance } from '../auth/auth.service.ts';
import {
  getAdminOverviewRoute,
  updateAdminStorePlanRoute,
  updateAdminUserRoute,
} from './admin.routes.ts';
import { getAdminOverview, updateAdminStorePlan, updateAdminUser } from './admin.service.ts';

export interface CreateAdminRouterOptions {
  drizzleDb: Database;
  auth: AuthInstance;
}

export function createAdminRouter({ drizzleDb, auth }: CreateAdminRouterOptions): OpenAPIHono {
  const router = new OpenAPIHono();

  router.openapi(getAdminOverviewRoute, async (c) => {
    const adminResult = await resolvePlatformAdmin(auth, c.req.raw.headers);
    if (!adminResult.ok) {
      return c.json({ error: adminResult.error }, adminResult.status);
    }

    const overview = await getAdminOverview(drizzleDb);
    return c.json(overview, 200);
  });

  router.openapi(updateAdminStorePlanRoute, async (c) => {
    const adminResult = await resolvePlatformAdmin(auth, c.req.raw.headers);
    if (!adminResult.ok) {
      return c.json({ error: adminResult.error }, adminResult.status);
    }

    const { storeSlug } = c.req.valid('param');
    const body = c.req.valid('json');
    const summary = await updateAdminStorePlan({
      db: drizzleDb,
      storeSlug,
      input: body,
    });
    if (!summary) {
      return c.json({ error: 'Store not found' }, 404);
    }

    return c.json(summary, 200);
  });

  router.openapi(updateAdminUserRoute, async (c) => {
    const adminResult = await resolvePlatformAdmin(auth, c.req.raw.headers);
    if (!adminResult.ok) {
      return c.json({ error: adminResult.error }, adminResult.status);
    }

    const { userId } = c.req.valid('param');
    const body = c.req.valid('json');
    const result = await updateAdminUser({
      db: drizzleDb,
      actorUserId: adminResult.user.id,
      userId,
      input: body,
    });
    if (!result.ok) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json(result.user, 200);
  });

  return router;
}
