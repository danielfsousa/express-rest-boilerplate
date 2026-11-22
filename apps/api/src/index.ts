import { createDb, ensureDefaultStore } from '@starter/db';
import { createBirdMailer } from '@starter/email';
import { createDbClient, createLogger, createServer, onShutdown, readEnv } from '@starter/runtime';
import { createS3Storage } from '@starter/runtime/storage';
import { createApp } from './app.ts';
import { parseEnv } from './config/env.ts';
import { createAuth } from './features/auth/auth.service.ts';

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

  const trustedOrigins = [env.WEB_ORIGIN, env.BETTER_AUTH_URL];
  const auth = createAuth({
    db: drizzleHandle.db,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins,
    mailer,
    i18nEnabled: env.FEATURE_I18N_ENABLED,
  });

  const storage = createS3Storage({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    bucket: env.S3_BUCKET,
  });

  const app = createApp({
    db,
    logger,
    drizzleDb: drizzleHandle.db,
    auth,
    storage,
    multiTenancyEnabled: env.FEATURE_MULTI_TENANCY_ENABLED,
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
      await drizzleHandle.close();
      await db.close();
      logger.info('API server stopped');
    },
    { drainTimeoutMs: 10_000, logger },
  );
}

await main();
