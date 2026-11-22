import { OpenAPIHono } from '@hono/zod-openapi';
import type { Database } from '@starter/db';
import type Stripe from 'stripe';
import { getSessionUser } from '../auth/auth.service.ts';
import type { AuthInstance } from '../auth/auth.service.ts';
import { resolveStoreContext } from '../books/books.service.ts';
import { getStoreBillingRoute, upgradeStoreBillingRoute } from './billing.routes.ts';
import {
  getStoreBillingSummary,
  upgradeStoreSubscription,
  verifyAndProcessStripeWebhook,
} from './billing.service.ts';

export interface CreateBillingRouterOptions {
  drizzleDb: Database;
  auth: AuthInstance;
  stripe: Stripe;
  webhookSecret: string;
  proPriceId: string;
  webOrigin: string;
  multiTenancyEnabled: boolean;
}

export function createBillingRouter({
  drizzleDb,
  auth,
  stripe,
  webhookSecret,
  proPriceId,
  webOrigin,
  multiTenancyEnabled,
}: CreateBillingRouterOptions): OpenAPIHono {
  const router = new OpenAPIHono();

  router.openapi(getStoreBillingRoute, async (c) => {
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

    const summary = await getStoreBillingSummary(drizzleDb, store.id);
    return c.json(summary, 200);
  });

  router.openapi(upgradeStoreBillingRoute, async (c) => {
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

    const result = await upgradeStoreSubscription({
      db: drizzleDb,
      stripe,
      storeId: store.id,
      storeName: store.slug,
      proPriceId,
      webOrigin,
      storeSlug: store.slug,
    });
    return c.json(result, 200);
  });

  router.post('/api/v1/webhooks/stripe', async (c) => {
    const rawBody = await c.req.text();
    const signature = c.req.header('stripe-signature');
    const result = await verifyAndProcessStripeWebhook({
      stripe,
      webhookSecret,
      rawBody,
      signature,
      db: drizzleDb,
    });
    if (!result.ok) {
      return c.json({ error: result.error }, result.status);
    }
    return c.json({ received: true, eventType: result.eventType }, 200);
  });

  return router;
}
