import {
  bookSchema,
  orderSchema,
  storeBillingSummarySchema,
  upgradeStoreResponseSchema,
} from '@starter/contracts';
import { extractSessionCookie, startTestPostgres } from '@starter/db/test-harness';
import type { TestPostgresHarness } from '@starter/db/test-harness';
import { createLogger } from '@starter/runtime';
import { createEmulator } from 'emulate';
import Stripe from 'stripe';
import { afterAll, beforeAll, describe, expect, test } from 'vite-plus/test';
import { createApp } from '../../src/app.ts';
import { createAuth } from '../../src/features/auth/auth.service.ts';
import { createStripeClient } from '../../src/features/billing/billing.service.ts';

describe('Stripe billing, subscriptions, and emulate integration (apps/api)', () => {
  let pg: TestPostgresHarness;
  let stripeEmulator: { close: () => Promise<void> };
  let stripePort: number;

  beforeAll(async () => {
    const [pgHarness, emulator] = await Promise.all([
      startTestPostgres(),
      createEmulator({ service: 'stripe', port: 0, hostname: '127.0.0.1' }),
    ]);
    pg = pgHarness;
    stripeEmulator = emulator;
    stripePort = Number.parseInt(new URL(emulator.url).port, 10);
  }, 60_000);

  afterAll(async () => {
    await Promise.all([pg?.stop(), stripeEmulator?.close()]);
  }, 30_000);

  test('enforces 25-book cap on free plan, lifts on pro upgrade, and processes Stripe Checkout webhooks', async () => {
    const webhookSecret = 'whsec_test_billing_secret';
    const stripeClient = createStripeClient({
      secretKey: 'sk_test_emulate',
      host: '127.0.0.1',
      port: stripePort,
      protocol: 'http',
    });

    const logger = createLogger({ level: 'silent' });
    const auth = createAuth({
      db: pg.drizzleHandle.db,
      secret: 'test-secret-with-at-least-32-characters',
      baseURL: 'http://localhost',
      trustedOrigins: ['http://localhost'],
      billingEnabled: true,
      stripeClient,
      stripeWebhookSecret: webhookSecret,
      proPriceId: 'price_pro_monthly',
    });

    const app = createApp({
      db: pg.drizzleHandle,
      logger,
      drizzleDb: pg.drizzleHandle.db,
      auth,
      multiTenancyEnabled: true,
      billingEnabled: true,
      stripeClient,
      stripeWebhookSecret: webhookSecret,
      stripeProPriceId: 'price_pro_monthly',
      webOrigin: 'http://127.0.0.1:3000',
    });

    const signUp = await app.fetch(
      new Request('http://localhost/api/auth/sign-up/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Billing Owner',
          email: 'billing@test.dev',
          password: 'Password123!',
        }),
      }),
    );
    const cookie = extractSessionCookie(signUp);

    await app.fetch(
      new Request('http://localhost/api/v1/stores', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie },
        body: JSON.stringify({ name: 'Pro Books', slug: 'pro-books' }),
      }),
    );

    let firstBookId = '';
    for (let i = 1; i <= 25; i += 1) {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/stores/pro-books/books', {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie },
          body: JSON.stringify({
            sku: `CAP-${String(i)}`,
            title: `Book ${String(i)}`,
            author: 'Author',
            priceCents: 1200,
            stock: 5,
            published: true,
          }),
        }),
      );
      expect(res.status).toBe(201);
      if (i === 1) {
        firstBookId = bookSchema.parse(await res.json()).id;
      }
    }

    // 26th published book is blocked on free plan
    const blocked26 = await app.fetch(
      new Request('http://localhost/api/v1/stores/pro-books/books', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie },
        body: JSON.stringify({
          sku: 'CAP-26',
          title: 'Book 26',
          author: 'Author',
          priceCents: 1200,
          stock: 5,
          published: true,
        }),
      }),
    );
    expect(blocked26.status).toBe(402);

    // Upgrade store to pro
    const upgradeRes = await app.fetch(
      new Request('http://localhost/api/v1/stores/pro-books/billing/upgrade', {
        method: 'POST',
        headers: { cookie },
      }),
    );
    expect(upgradeRes.status).toBe(200);
    expect(upgradeStoreResponseSchema.parse(await upgradeRes.json()).plan).toBe('pro');

    const summaryRes = await app.fetch(
      new Request('http://localhost/api/v1/stores/pro-books/billing', {
        headers: { cookie },
      }),
    );
    expect(summaryRes.status).toBe(200);
    const summary = storeBillingSummarySchema.parse(await summaryRes.json());
    expect(summary.plan).toBe('pro');
    expect(summary.bookLimit).toBeNull();

    // 26th published book now succeeds
    const allowed26 = await app.fetch(
      new Request('http://localhost/api/v1/stores/pro-books/books', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie },
        body: JSON.stringify({
          sku: 'CAP-26',
          title: 'Book 26',
          author: 'Author',
          priceCents: 1200,
          stock: 5,
          published: true,
        }),
      }),
    );
    expect(allowed26.status).toBe(201);

    // Order starts pending_payment with Stripe Checkout URL
    const orderRes = await app.fetch(
      new Request('http://localhost/api/v1/stores/pro-books/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          customerEmail: 'customer@billing.test',
          customerName: 'Stripe Buyer',
          items: [{ bookId: firstBookId, quantity: 1 }],
        }),
      }),
    );
    expect(orderRes.status).toBe(201);
    const createdOrder = orderSchema.parse(await orderRes.json());
    expect(createdOrder.status).toBe('pending_payment');
    expect(createdOrder.stripeCheckoutSessionId).toBeTruthy();

    // Invalid signature returns 400
    const badWebhook = await app.fetch(
      new Request('http://localhost/api/v1/webhooks/stripe', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'stripe-signature': 't=123,v1=bad',
        },
        body: JSON.stringify({ type: 'checkout.session.completed' }),
      }),
    );
    expect(badWebhook.status).toBe(400);

    // Validly signed checkout.session.completed webhook transitions order to paid
    const payload = JSON.stringify({
      id: 'evt_test_1',
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: createdOrder.stripeCheckoutSessionId,
          metadata: {
            storeId: createdOrder.storeId,
            orderId: createdOrder.id,
          },
        },
      },
    });
    const validSig = Stripe.webhooks.generateTestHeaderString({
      payload,
      secret: webhookSecret,
    });

    const goodWebhook = await app.fetch(
      new Request('http://localhost/api/v1/webhooks/stripe', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'stripe-signature': validSig,
        },
        body: payload,
      }),
    );
    expect(goodWebhook.status).toBe(200);

    const fetchedOrder = orderSchema.parse(
      await (
        await app.fetch(
          new Request(`http://localhost/api/v1/stores/pro-books/orders/${createdOrder.id}`),
        )
      ).json(),
    );
    expect(fetchedOrder.status).toBe('paid');
  });

  test('FEATURE_BILLING_ENABLED=false marks orders paid immediately and omits webhook route', async () => {
    const logger = createLogger({ level: 'silent' });
    const auth = createAuth({
      db: pg.drizzleHandle.db,
      secret: 'test-secret-with-at-least-32-characters',
      baseURL: 'http://localhost',
      trustedOrigins: ['http://localhost'],
      billingEnabled: false,
    });
    const app = createApp({
      db: pg.drizzleHandle,
      logger,
      drizzleDb: pg.drizzleHandle.db,
      auth,
      multiTenancyEnabled: true,
      billingEnabled: false,
    });

    const webhookRes = await app.fetch(
      new Request('http://localhost/api/v1/webhooks/stripe', {
        method: 'POST',
        body: '{}',
      }),
    );
    expect(webhookRes.status).toBe(404);
  });
});
