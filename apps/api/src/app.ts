import { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import type { Database } from '@starter/db';
import type { JobQueue } from '@starter/jobs';
import { createWebSocketAdapter } from '@starter/runtime';
import type { RealtimeBroker } from '@starter/runtime/realtime';
import type { ObjectStorage } from '@starter/runtime/storage';
import type { DbClient, RuntimeLogger, WebSocketAdapter } from '@starter/runtime/types';
import { cors } from 'hono/cors';
import type Stripe from 'stripe';
import { createAdminRouter } from './features/admin/admin.handlers.ts';
import type { AuthInstance } from './features/auth/auth.service.ts';
import { createBillingRouter } from './features/billing/billing.handlers.ts';
import { createStripePaymentGateway } from './features/billing/billing.service.ts';
import type { PaymentGateway } from './features/billing/billing.service.ts';
import { createBooksRouter } from './features/books/books.handlers.ts';
import { createExportsRouter } from './features/exports/exports.handlers.ts';
import { createHealthRouter } from './features/health/health.handlers.ts';
import { createOrdersRouter } from './features/orders/orders.handlers.ts';
import { registerRealtimeRoute } from './features/realtime/realtime.handlers.ts';
import { createStoresRouter } from './features/stores/stores.handlers.ts';

export interface CreateAppOptions {
  dbHealth: DbClient;
  logger: RuntimeLogger;
  db?: Database;
  auth?: AuthInstance;
  storage?: ObjectStorage;
  jobQueue?: JobQueue | undefined;
  realtimeEnabled?: boolean | undefined;
  realtimeBroker?: RealtimeBroker | undefined;
  onWebSocketAdapter?: ((adapter: WebSocketAdapter) => void) | undefined;
  multiTenancyEnabled?: boolean;
  adminEnabled?: boolean;
  i18nEnabled?: boolean;
  billingEnabled?: boolean;
  stripeClient?: Stripe | undefined;
  paymentGateway?: PaymentGateway | undefined;
  stripeWebhookSecret?: string;
  stripeProPriceId?: string;
  webOrigin?: string;
  trustedOrigins?: Array<string>;
}

export function createApp({
  dbHealth,
  logger,
  db,
  auth,
  storage,
  jobQueue,
  realtimeEnabled = false,
  realtimeBroker,
  onWebSocketAdapter,
  multiTenancyEnabled = true,
  adminEnabled = true,
  i18nEnabled = true,
  billingEnabled = false,
  stripeClient,
  paymentGateway,
  stripeWebhookSecret = '',
  stripeProPriceId = 'price_pro_monthly',
  webOrigin = 'http://127.0.0.1:3000',
  trustedOrigins = ['http://127.0.0.1:3000'],
}: CreateAppOptions): OpenAPIHono {
  const app = new OpenAPIHono();

  app.use(
    '*',
    cors({
      origin: trustedOrigins,
      allowHeaders: ['Content-Type', 'Authorization'],
      allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true,
    }),
  );

  app.use('*', async (c, next) => {
    const requestId = c.req.header('x-request-id') ?? crypto.randomUUID();
    const start = Date.now();
    await next();
    c.header('x-request-id', requestId);
    logger.info(
      {
        requestId,
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        durationMs: Date.now() - start,
      },
      'HTTP request completed',
    );
  });

  app.route('/', createHealthRouter(dbHealth));

  if (auth) {
    app.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw));
  }

  if (db && auth) {
    if (adminEnabled) {
      app.route('/', createAdminRouter({ db, auth }));
    }
    app.route('/', createStoresRouter({ db, auth, multiTenancyEnabled }));
    app.route(
      '/',
      createBooksRouter({
        db,
        auth,
        multiTenancyEnabled,
        billingEnabled,
        storage,
      }),
    );

    const resolvedGateway =
      paymentGateway ?? (stripeClient ? createStripePaymentGateway(stripeClient) : undefined);
    const billingContext =
      billingEnabled && resolvedGateway
        ? { enabled: true, paymentGateway: resolvedGateway, webOrigin }
        : undefined;

    app.route(
      '/',
      createOrdersRouter({
        db,
        auth,
        multiTenancyEnabled,
        i18nEnabled,
        billing: billingContext,
        jobQueue,
        realtimeBroker,
      }),
    );

    app.route(
      '/',
      createExportsRouter({
        db,
        auth,
        multiTenancyEnabled,
        storage,
        jobQueue,
      }),
    );

    if (realtimeEnabled && realtimeBroker) {
      const webSocketAdapter = createWebSocketAdapter(app);
      onWebSocketAdapter?.(webSocketAdapter);
      registerRealtimeRoute({
        app,
        db,
        auth,
        multiTenancyEnabled,
        broker: realtimeBroker,
        webSocketAdapter,
      });
    }

    if (billingEnabled && stripeClient) {
      app.route(
        '/',
        createBillingRouter({
          db,
          auth,
          stripe: stripeClient,
          webhookSecret: stripeWebhookSecret,
          proPriceId: stripeProPriceId,
          webOrigin,
          multiTenancyEnabled,
          jobQueue,
          realtimeBroker,
        }),
      );
    }
  }

  app.doc31('/openapi.json', {
    openapi: '3.1.0',
    info: {
      title: 'nodejs-fullstack-starter API',
      version: '2.0.0',
    },
  });

  app.get(
    '/docs',
    Scalar({
      url: '/openapi.json',
      pageTitle: 'nodejs-fullstack-starter API Docs',
    }),
  );

  return app;
}
