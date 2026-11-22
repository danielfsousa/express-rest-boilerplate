import { createDbClient, createLogger, createServer, onShutdown, readEnv } from '@starter/runtime';
import { createApp } from './app.ts';
import { parseEnv } from './config/env.ts';

async function main(): Promise<void> {
  const env = parseEnv(readEnv());
  const logger = createLogger({ level: env.LOG_LEVEL });
  const db = createDbClient({ url: env.DATABASE_URL });
  const app = createApp({ db, logger });

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
      await db.close();
      logger.info('API server stopped');
    },
    { drainTimeoutMs: 10_000, logger },
  );
}

await main();
