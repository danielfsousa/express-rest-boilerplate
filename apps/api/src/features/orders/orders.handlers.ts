import { OpenAPIHono } from '@hono/zod-openapi';
import type { Database } from '@starter/db';
import { getSessionUser } from '../auth/auth.service.ts';
import type { AuthInstance } from '../auth/auth.service.ts';
import { resolveStoreContext } from '../books/books.service.ts';
import {
  createOrderRoute,
  getOrderRoute,
  listOrdersRoute,
  updateOrderStatusRoute,
} from './orders.routes.ts';
import {
  createOrderForStore,
  getOrderForStore,
  listOrdersForStore,
  updateOrderStatusForStore,
} from './orders.service.ts';

export interface CreateOrdersRouterOptions {
  drizzleDb: Database;
  auth: AuthInstance;
  multiTenancyEnabled: boolean;
}

export function createOrdersRouter({
  drizzleDb,
  auth,
  multiTenancyEnabled,
}: CreateOrdersRouterOptions): OpenAPIHono {
  const router = new OpenAPIHono();

  router.openapi(createOrderRoute, async (c) => {
    const { storeSlug } = c.req.valid('param');
    const store = await resolveStoreContext(drizzleDb, storeSlug, null, multiTenancyEnabled);
    if (!store) {
      return c.json({ error: 'Store not found' }, 404);
    }

    const body = c.req.valid('json');
    const result = await createOrderForStore(drizzleDb, store, body);
    if (!result.ok) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json(result.order, 201);
  });

  router.openapi(listOrdersRoute, async (c) => {
    const sessionUser = await getSessionUser(auth, c.req.raw.headers);
    if (!sessionUser) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const { storeSlug } = c.req.valid('param');
    const store = await resolveStoreContext(
      drizzleDb,
      storeSlug,
      sessionUser.id,
      multiTenancyEnabled,
    );
    if (!store) {
      return c.json({ error: 'Store not found' }, 404);
    }
    if (!store.isMember) {
      return c.json({ error: 'Store membership required' }, 403);
    }

    const orders = await listOrdersForStore(drizzleDb, store);
    return c.json({ orders }, 200);
  });

  router.openapi(getOrderRoute, async (c) => {
    const { storeSlug, orderId } = c.req.valid('param');
    const store = await resolveStoreContext(drizzleDb, storeSlug, null, multiTenancyEnabled);
    if (!store) {
      return c.json({ error: 'Store not found' }, 404);
    }

    const order = await getOrderForStore(drizzleDb, store, orderId);
    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    return c.json(order, 200);
  });

  router.openapi(updateOrderStatusRoute, async (c) => {
    const sessionUser = await getSessionUser(auth, c.req.raw.headers);
    if (!sessionUser) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const { storeSlug, orderId } = c.req.valid('param');
    const store = await resolveStoreContext(
      drizzleDb,
      storeSlug,
      sessionUser.id,
      multiTenancyEnabled,
    );
    if (!store) {
      return c.json({ error: 'Store not found' }, 404);
    }
    if (!store.isMember) {
      return c.json({ error: 'Store membership required' }, 403);
    }

    const body = c.req.valid('json');
    const result = await updateOrderStatusForStore(drizzleDb, store, orderId, body.status);
    if (!result.ok) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json(result.order, 200);
  });

  return router;
}
