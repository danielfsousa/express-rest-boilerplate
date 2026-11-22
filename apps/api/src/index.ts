import { createDb, ensureDefaultStore } from '@starter/db';
import { createDbClient, createLogger, createServer, onShutdown, readEnv } from '@starter/runtime';
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

  const trustedOrigins = [env.WEB_ORIGIN, env.BETTER_AUTH_URL];
  const auth = createAuth({
    db: drizzleHandle.db,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins,
  });

  const app = createApp({
    db,
    logger,
    drizzleDb: drizzleHandle.db,
    auth,
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
