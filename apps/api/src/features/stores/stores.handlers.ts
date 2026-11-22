import { OpenAPIHono } from '@hono/zod-openapi';
import type { Database } from '@starter/db';
import { getSessionUser } from '../auth/auth.service.ts';
import type { AuthInstance } from '../auth/auth.service.ts';
import {
  createStoreRoute,
  getStoreRoute,
  listStoresRoute,
  updateStoreRoute,
} from './stores.routes.ts';
import {
  createStoreForUser,
  getStoreBySlug,
  listStoresForUser,
  updateStoreForUser,
} from './stores.service.ts';

export interface CreateStoresRouterOptions {
  drizzleDb: Database;
  auth: AuthInstance;
  multiTenancyEnabled: boolean;
}

export function createStoresRouter({
  drizzleDb,
  auth,
  multiTenancyEnabled,
}: CreateStoresRouterOptions): OpenAPIHono {
  const router = new OpenAPIHono();

  router.openapi(listStoresRoute, async (c) => {
    const sessionUser = await getSessionUser(auth, c.req.raw.headers);
    if (!sessionUser) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const stores = await listStoresForUser(drizzleDb, sessionUser.id, multiTenancyEnabled);
    return c.json({ stores }, 200);
  });

  router.openapi(createStoreRoute, async (c) => {
    const sessionUser = await getSessionUser(auth, c.req.raw.headers);
    if (!sessionUser) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const body = c.req.valid('json');
    const result = await createStoreForUser(drizzleDb, sessionUser.id, body, multiTenancyEnabled);

    if (!result.ok) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json(result.store, 201);
  });

  router.openapi(getStoreRoute, async (c) => {
    const { storeSlug } = c.req.valid('param');
    const store = await getStoreBySlug(drizzleDb, storeSlug, multiTenancyEnabled);
    if (!store) {
      return c.json({ error: 'Store not found' }, 404);
    }
    return c.json(store, 200);
  });

  router.openapi(updateStoreRoute, async (c) => {
    const sessionUser = await getSessionUser(auth, c.req.raw.headers);
    if (!sessionUser) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const { storeSlug } = c.req.valid('param');
    const body = c.req.valid('json');
    const result = await updateStoreForUser(
      drizzleDb,
      sessionUser.id,
      storeSlug,
      body,
      multiTenancyEnabled,
    );

    if (!result.ok) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json(result.store, 200);
  });

  return router;
}
