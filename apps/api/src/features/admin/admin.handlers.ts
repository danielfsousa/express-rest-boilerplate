import { OpenAPIHono } from '@hono/zod-openapi';
import type { Database } from '@starter/db';
import { getSessionUser } from '../auth/auth.service.ts';
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
    const sessionUser = await getSessionUser(auth, c.req.raw.headers);
    if (!sessionUser) {
      return c.json({ error: 'Authentication required' }, 401);
    }
    if (sessionUser.role !== 'admin') {
      return c.json({ error: 'Admin role required' }, 403);
    }

    const overview = await getAdminOverview(drizzleDb);
    return c.json(overview, 200);
  });

  router.openapi(updateAdminStorePlanRoute, async (c) => {
    const sessionUser = await getSessionUser(auth, c.req.raw.headers);
    if (!sessionUser) {
      return c.json({ error: 'Authentication required' }, 401);
    }
    if (sessionUser.role !== 'admin') {
      return c.json({ error: 'Admin role required' }, 403);
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
    const sessionUser = await getSessionUser(auth, c.req.raw.headers);
    if (!sessionUser) {
      return c.json({ error: 'Authentication required' }, 401);
    }
    if (sessionUser.role !== 'admin') {
      return c.json({ error: 'Admin role required' }, 403);
    }

    const { userId } = c.req.valid('param');
    const body = c.req.valid('json');
    const updated = await updateAdminUser({
      db: drizzleDb,
      userId,
      input: body,
    });
    if (!updated) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json(updated, 200);
  });

  return router;
}
