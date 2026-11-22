import { OpenAPIHono } from '@hono/zod-openapi';
import type { Database } from '@starter/db';
import type { JobQueue } from '@starter/jobs';
import type { RealtimeBroker } from '@starter/runtime/realtime';
import { resolveMerchantStore, resolvePublicStore } from '#/middleware/store-context.ts';
import type { AuthInstance } from '../auth/auth.service.ts';
import {
  createOrderRoute,
  getOrderRoute,
  listOrdersRoute,
  updateOrderStatusRoute,
} from './orders.routes.ts';
import type { OrderBillingContext } from './orders.service.ts';
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
  billing?: OrderBillingContext | undefined;
  jobQueue?: JobQueue | undefined;
  realtimeBroker?: RealtimeBroker | undefined;
}

export function createOrdersRouter({
  drizzleDb,
  auth,
  multiTenancyEnabled,
  billing,
  jobQueue,
  realtimeBroker,
}: CreateOrdersRouterOptions): OpenAPIHono {
  const router = new OpenAPIHono();

  router.openapi(createOrderRoute, async (c) => {
    const { storeSlug } = c.req.valid('param');
    const store = await resolvePublicStore({
      db: drizzleDb,
      storeSlug,
      multiTenancyEnabled,
    });
    if (!store) {
      return c.json({ error: 'Store not found' }, 404);
    }

    const body = c.req.valid('json');
    const result = await createOrderForStore({
      db: drizzleDb,
      store,
      input: body,
      billing,
      jobQueue,
      realtimeBroker,
    });
    if (!result.ok) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json(result.order, 201);
  });

  router.openapi(listOrdersRoute, async (c) => {
    const { storeSlug } = c.req.valid('param');
    const ctx = await resolveMerchantStore({
      db: drizzleDb,
      auth,
      headers: c.req.raw.headers,
      storeSlug,
      multiTenancyEnabled,
    });
    if (!ctx.ok) {
      return c.json({ error: ctx.error }, ctx.status);
    }

    const items = await listOrdersForStore(drizzleDb, ctx.store);
    return c.json({ orders: items }, 200);
  });

  router.openapi(getOrderRoute, async (c) => {
    const { storeSlug, orderId } = c.req.valid('param');
    const store = await resolvePublicStore({
      db: drizzleDb,
      storeSlug,
      multiTenancyEnabled,
    });
    if (!store) {
      return c.json({ error: 'Store not found' }, 404);
    }

    const order = await getOrderForStore({ db: drizzleDb, store, orderId });
    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    return c.json(order, 200);
  });

  router.openapi(updateOrderStatusRoute, async (c) => {
    const { storeSlug, orderId } = c.req.valid('param');
    const ctx = await resolveMerchantStore({
      db: drizzleDb,
      auth,
      headers: c.req.raw.headers,
      storeSlug,
      multiTenancyEnabled,
    });
    if (!ctx.ok) {
      return c.json({ error: ctx.error }, ctx.status);
    }

    const { status } = c.req.valid('json');
    const result = await updateOrderStatusForStore({
      db: drizzleDb,
      store: ctx.store,
      orderId,
      nextStatus: status,
      realtimeBroker,
    });
    if (!result.ok) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json(result.order, 200);
  });

  return router;
}
