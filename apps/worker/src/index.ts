import 'varlock/auto-load';
import { ENV } from 'varlock/env';
import { createDb } from '@starter/db';
import { createBirdMailer } from '@starter/email';
import { createPgBossJobQueue, registerDefaultJobHandlers } from '@starter/jobs';
import { createLogger, onShutdown } from '@starter/runtime';
import { createS3Storage } from '@starter/runtime/storage';
import { initTelemetry } from '@starter/runtime/telemetry';

async function main(): Promise<void> {
  const telemetry = initTelemetry({
    serviceName:
      ENV.OTEL_SERVICE_NAME === 'bookstore-api' ? 'bookstore-worker' : ENV.OTEL_SERVICE_NAME,
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
  const mailer = createBirdMailer({
    apiBaseUrl: ENV.BIRD_API_BASE_URL,
    apiKey: ENV.BIRD_API_KEY,
    fromEmail: ENV.BIRD_FROM_EMAIL,
  });
  const storage = createS3Storage({
    endpoint: ENV.S3_ENDPOINT,
    region: ENV.S3_REGION,
    accessKeyId: ENV.S3_ACCESS_KEY_ID,
    secretAccessKey: ENV.S3_SECRET_ACCESS_KEY,
    bucket: ENV.S3_BUCKET,
  });

  const queue = createPgBossJobQueue({
    connectionString: ENV.DATABASE_DIRECT_URL ?? ENV.DATABASE_URL,
    schema: 'pgboss',
    retryLimit: 3,
    retryDelay: 30,
    retryBackoff: true,
  });

  await queue.start();
  await registerDefaultJobHandlers(queue, {
    drizzleDb: drizzleHandle.db,
    mailer,
    storage,
    logger,
  });

  logger.info('Worker started and listening for pg-boss jobs');

  onShutdown(
    async () => {
      await queue.stop();
      await drizzleHandle.close();
      await telemetry.shutdown();
      logger.info('Worker stopped');
    },
    { drainTimeoutMs: 10_000, logger },
  );
}

await main();
