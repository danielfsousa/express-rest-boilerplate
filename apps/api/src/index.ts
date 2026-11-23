import 'varlock/auto-load';
import { ENV } from 'varlock/env';
import { createDb, ensureDefaultStore } from '@starter/db';
import { createBirdMailer } from '@starter/email';
import {
  createInlineJobQueue,
  createPgBossJobQueue,
  registerDefaultJobHandlers,
} from '@starter/jobs';
import { createLogger, createServer, onShutdown } from '@starter/runtime';
import {
  createMemoryRealtimeBroker,
  createNoopRealtimeBroker,
  createPostgresRealtimeBroker,
} from '@starter/runtime/realtime';
import { createS3Storage } from '@starter/runtime/storage';
import { initTelemetry } from '@starter/runtime/telemetry';
import type { WebSocketAdapter } from '@starter/runtime/types';
import { createApp } from './app.ts';
import { createAuth } from './features/auth/auth.service.ts';
import { createStripeClient } from './features/billing/billing.service.ts';

async function main(): Promise<void> {
  const telemetry = initTelemetry({
    serviceName: ENV.OTEL_SERVICE_NAME,
    enabled: ENV.OTEL_ENABLED,
    endpoint: ENV.OTEL_EXPORTER_OTLP_ENDPOINT,
    headers: ENV.OTEL_EXPORTER_OTLP_HEADERS,
  });
  const logger = createLogger({
    level: ENV.LOG_LEVEL,
    format: ENV.LOG_FORMAT,
    otelEnabled: ENV.OTEL_ENABLED,
  });
  const drizzleHandle = createDb(ENV.DATABASE_URL);

  if (!ENV.FEATURE_MULTI_TENANCY_ENABLED) {
    await ensureDefaultStore(drizzleHandle.db);
  }

  const mailer = createBirdMailer({
    apiBaseUrl: ENV.BIRD_API_BASE_URL,
    apiKey: ENV.BIRD_API_KEY,
    fromEmail: ENV.BIRD_FROM_EMAIL,
  });

  const stripeClient = ENV.FEATURE_BILLING_ENABLED
    ? createStripeClient({
        secretKey: ENV.STRIPE_SECRET_KEY,
        host: ENV.STRIPE_API_HOST,
        port: ENV.STRIPE_API_PORT,
        protocol: ENV.STRIPE_API_PROTOCOL,
      })
    : undefined;

  const trustedOrigins = [ENV.WEB_ORIGIN, ENV.BETTER_AUTH_URL];
  const auth = createAuth({
    db: drizzleHandle.db,
    secret: ENV.BETTER_AUTH_SECRET,
    baseURL: ENV.BETTER_AUTH_URL,
    trustedOrigins,
    mailer,
    i18nEnabled: ENV.FEATURE_I18N_ENABLED,
    adminEnabled: ENV.FEATURE_ADMIN_ENABLED,
    billingEnabled: ENV.FEATURE_BILLING_ENABLED,
    stripeClient,
    stripeWebhookSecret: ENV.STRIPE_WEBHOOK_SECRET,
    proPriceId: ENV.STRIPE_PRO_PRICE_ID,
  });

  const storage = createS3Storage({
    endpoint: ENV.S3_ENDPOINT,
    region: ENV.S3_REGION,
    accessKeyId: ENV.S3_ACCESS_KEY_ID,
    secretAccessKey: ENV.S3_SECRET_ACCESS_KEY,
    bucket: ENV.S3_BUCKET,
  });

  const jobQueue = ENV.FEATURE_JOBS_ENABLED
    ? createPgBossJobQueue({
        connectionString: ENV.DATABASE_DIRECT_URL ?? ENV.DATABASE_URL,
        schema: 'pgboss',
        retryLimit: 3,
        retryDelay: 30,
        retryBackoff: true,
      })
    : createInlineJobQueue();

  await jobQueue.start();
  if (!ENV.FEATURE_JOBS_ENABLED || ENV.WORKER_INLINE) {
    await registerDefaultJobHandlers(jobQueue, {
      db: drizzleHandle.db,
      mailer,
      storage,
      logger,
    });
  }

  const realtimeBroker = !ENV.FEATURE_REALTIME_ENABLED
    ? createNoopRealtimeBroker()
    : ENV.REALTIME_BROKER === 'postgres'
      ? await createPostgresRealtimeBroker({
          url: ENV.DATABASE_DIRECT_URL ?? ENV.DATABASE_URL,
        })
      : createMemoryRealtimeBroker();

  let webSocketAdapter: WebSocketAdapter | undefined;

  const app = createApp({
    dbHealth: drizzleHandle,
    logger,
    db: drizzleHandle.db,
    auth,
    storage,
    jobQueue,
    realtimeEnabled: ENV.FEATURE_REALTIME_ENABLED,
    realtimeBroker,
    onWebSocketAdapter: (adapter) => {
      webSocketAdapter = adapter;
    },
    multiTenancyEnabled: ENV.FEATURE_MULTI_TENANCY_ENABLED,
    adminEnabled: ENV.FEATURE_ADMIN_ENABLED,
    i18nEnabled: ENV.FEATURE_I18N_ENABLED,
    billingEnabled: ENV.FEATURE_BILLING_ENABLED,
    stripeClient,
    stripeWebhookSecret: ENV.STRIPE_WEBHOOK_SECRET,
    stripeProPriceId: ENV.STRIPE_PRO_PRICE_ID,
    webOrigin: ENV.WEB_ORIGIN,
    trustedOrigins,
  });

  const server = await createServer({
    fetch: app.fetch,
    port: ENV.PORT,
    hostname: ENV.HOST,
    webSocketAdapter,
  });

  logger.info(
    { port: server.port, hostname: server.hostname, url: server.url },
    'API server listening',
  );

  onShutdown(
    async () => {
      await server.close();
      await realtimeBroker.close();
      await jobQueue.stop();
      await drizzleHandle.close();
      await telemetry.shutdown();
      logger.info('API server stopped');
    },
    { drainTimeoutMs: 10_000, logger },
  );
}

await main();
