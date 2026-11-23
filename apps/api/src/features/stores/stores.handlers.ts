import { OpenAPIHono } from '@hono/zod-openapi';
import type { Database } from '@starter/db';
import { resolveAuthenticatedUser } from '#/middleware/store-context.ts';
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
  db: Database;
  auth: AuthInstance;
  multiTenancyEnabled: boolean;
}

export function createStoresRouter({
  db,
  auth,
  multiTenancyEnabled,
}: CreateStoresRouterOptions): OpenAPIHono {
  const router = new OpenAPIHono();

  router.openapi(listStoresRoute, async (c) => {
    const authResult = await resolveAuthenticatedUser(auth, c.req.raw.headers);
    if (!authResult.ok) {
      return c.json({ error: authResult.error }, authResult.status);
    }

    const stores = await listStoresForUser({
      db,
      userId: authResult.user.id,
      multiTenancyEnabled,
    });
    return c.json({ stores }, 200);
  });

  router.openapi(createStoreRoute, async (c) => {
    const authResult = await resolveAuthenticatedUser(auth, c.req.raw.headers);
    if (!authResult.ok) {
      return c.json({ error: authResult.error }, authResult.status);
    }

    const body = c.req.valid('json');
    const result = await createStoreForUser({
      db,
      userId: authResult.user.id,
      input: body,
      multiTenancyEnabled,
    });

    if (!result.ok) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json(result.store, 201);
  });

  router.openapi(getStoreRoute, async (c) => {
    const { storeSlug } = c.req.valid('param');
    const store = await getStoreBySlug({
      db,
      slug: storeSlug,
      multiTenancyEnabled,
    });
    if (!store) {
      return c.json({ error: 'Store not found' }, 404);
    }
    return c.json(store, 200);
  });

  router.openapi(updateStoreRoute, async (c) => {
    const authResult = await resolveAuthenticatedUser(auth, c.req.raw.headers);
    if (!authResult.ok) {
      return c.json({ error: authResult.error }, authResult.status);
    }

    const { storeSlug } = c.req.valid('param');
    const body = c.req.valid('json');
    const result = await updateStoreForUser({
      db,
      userId: authResult.user.id,
      slug: storeSlug,
      input: body,
      multiTenancyEnabled,
    });

    if (!result.ok) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json(result.store, 200);
  });

  return router;
}
