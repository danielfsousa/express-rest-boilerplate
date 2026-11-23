import { OpenAPIHono } from '@hono/zod-openapi';
import type { Database } from '@starter/db';
import type { JobQueue } from '@starter/jobs';
import type { RealtimeBroker } from '@starter/runtime/realtime';
import type Stripe from 'stripe';
import { resolveMerchantStore } from '#/middleware/store-context.ts';
import type { AuthInstance } from '../auth/auth.service.ts';
import { getStoreBillingRoute, upgradeStoreBillingRoute } from './billing.routes.ts';
import {
  getStoreBillingSummary,
  upgradeStoreSubscription,
  verifyAndProcessStripeWebhook,
} from './billing.service.ts';

export interface CreateBillingRouterOptions {
  db: Database;
  auth: AuthInstance;
  stripe: Stripe;
  webhookSecret: string;
  proPriceId: string;
  webOrigin: string;
  multiTenancyEnabled: boolean;
  jobQueue?: JobQueue | undefined;
  realtimeBroker?: RealtimeBroker | undefined;
}

export function createBillingRouter({
  db,
  auth,
  stripe,
  webhookSecret,
  proPriceId,
  webOrigin,
  multiTenancyEnabled,
  jobQueue,
  realtimeBroker,
}: CreateBillingRouterOptions): OpenAPIHono {
  const router = new OpenAPIHono();

  router.openapi(getStoreBillingRoute, async (c) => {
    const { storeSlug } = c.req.valid('param');
    const ctx = await resolveMerchantStore({
      db,
      auth,
      headers: c.req.raw.headers,
      storeSlug,
      multiTenancyEnabled,
    });
    if (!ctx.ok) {
      return c.json({ error: ctx.error }, ctx.status);
    }

    const summary = await getStoreBillingSummary(db, ctx.store.id);
    return c.json(summary, 200);
  });

  router.openapi(upgradeStoreBillingRoute, async (c) => {
    const { storeSlug } = c.req.valid('param');
    const ctx = await resolveMerchantStore({
      db,
      auth,
      headers: c.req.raw.headers,
      storeSlug,
      multiTenancyEnabled,
    });
    if (!ctx.ok) {
      return c.json({ error: ctx.error }, ctx.status);
    }

    const result = await upgradeStoreSubscription({
      db,
      stripe,
      storeId: ctx.store.id,
      storeName: ctx.store.name,
      proPriceId,
      webOrigin,
      storeSlug: ctx.store.slug,
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
      db,
      jobQueue,
      realtimeBroker,
    });
    if (!result.ok) {
      return c.json({ error: result.error }, result.status);
    }
    return c.json({ received: true, eventType: result.eventType }, 200);
  });

  return router;
}
