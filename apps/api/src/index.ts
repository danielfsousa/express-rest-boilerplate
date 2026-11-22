import { createDb, ensureDefaultStore } from '@starter/db';
import { createBirdMailer } from '@starter/email';
import {
  createInlineJobQueue,
  createPgBossJobQueue,
  registerDefaultJobHandlers,
} from '@starter/jobs';
import { createDbClient, createLogger, createServer, onShutdown, readEnv } from '@starter/runtime';
import { createS3Storage } from '@starter/runtime/storage';
import { createApp } from './app.ts';
import { parseEnv } from './config/env.ts';
import { createAuth } from './features/auth/auth.service.ts';
import { createStripeClient } from './features/billing/billing.service.ts';

async function main(): Promise<void> {
  const env = parseEnv(readEnv());
  const logger = createLogger({ level: env.LOG_LEVEL });
  const db = createDbClient({ url: env.DATABASE_URL });
  const drizzleHandle = createDb(env.DATABASE_URL);

  if (!env.FEATURE_MULTI_TENANCY_ENABLED) {
    await ensureDefaultStore(drizzleHandle.db);
  }

  const mailer = createBirdMailer({
    apiBaseUrl: env.BIRD_API_BASE_URL,
    apiKey: env.BIRD_API_KEY,
    fromEmail: env.BIRD_FROM_EMAIL,
  });

  const stripeClient = env.FEATURE_BILLING_ENABLED
    ? createStripeClient({
        secretKey: env.STRIPE_SECRET_KEY,
        host: env.STRIPE_API_HOST,
        port: env.STRIPE_API_PORT,
        protocol: env.STRIPE_API_PROTOCOL,
      })
    : undefined;

  const trustedOrigins = [env.WEB_ORIGIN, env.BETTER_AUTH_URL];
  const auth = createAuth({
    db: drizzleHandle.db,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins,
    mailer,
    i18nEnabled: env.FEATURE_I18N_ENABLED,
    billingEnabled: env.FEATURE_BILLING_ENABLED,
    stripeClient,
    stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
    proPriceId: env.STRIPE_PRO_PRICE_ID,
  });

  const storage = createS3Storage({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    bucket: env.S3_BUCKET,
  });

  const jobQueue = env.FEATURE_JOBS_ENABLED
    ? createPgBossJobQueue({
        connectionString: env.DATABASE_DIRECT_URL ?? env.DATABASE_URL,
        schema: 'pgboss',
        retryLimit: 3,
        retryDelay: 30,
        retryBackoff: true,
      })
    : createInlineJobQueue();

  await jobQueue.start();
  if (!env.FEATURE_JOBS_ENABLED || env.WORKER_INLINE) {
    await registerDefaultJobHandlers(jobQueue, {
      drizzleDb: drizzleHandle.db,
      mailer,
      storage,
      logger,
    });
  }

  const app = createApp({
    db,
    logger,
    drizzleDb: drizzleHandle.db,
    auth,
    storage,
    jobQueue,
    multiTenancyEnabled: env.FEATURE_MULTI_TENANCY_ENABLED,
    billingEnabled: env.FEATURE_BILLING_ENABLED,
    stripeClient,
    stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
    stripeProPriceId: env.STRIPE_PRO_PRICE_ID,
    webOrigin: env.WEB_ORIGIN,
    trustedOrigins,
  });

  const server = await createServer({
    fetch: app.fetch,
    port: env.PORT,
    hostname: env.HOST,
  });

  logger.info(
    { port: server.port, hostname: server.hostname, url: server.url },
    'API server listening',
  );

  onShutdown(
    async () => {
      await server.close();
      await jobQueue.stop();
      await drizzleHandle.close();
      await db.close();
      logger.info('API server stopped');
    },
    { drainTimeoutMs: 10_000, logger },
  );
}

await main();
