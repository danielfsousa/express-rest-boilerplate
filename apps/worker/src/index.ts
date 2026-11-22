import 'varlock/auto-load';
import { createDb } from '@starter/db';
import { createBirdMailer } from '@starter/email';
import { createPgBossJobQueue, registerDefaultJobHandlers } from '@starter/jobs';
import { createLogger, onShutdown, readEnv } from '@starter/runtime';
import { createS3Storage } from '@starter/runtime/storage';
import { initTelemetry } from '@starter/runtime/telemetry';
import { z } from 'zod';

const workerEnvSchema = z.object({
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('json'),
  OTEL_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  OTEL_SERVICE_NAME: z.string().min(1).default('bookstore-worker'),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().default('http://127.0.0.1:4318'),
  OTEL_EXPORTER_OTLP_HEADERS: z.string().optional(),
  DATABASE_URL: z.string().min(1),
  DATABASE_DIRECT_URL: z.string().optional(),
  S3_ENDPOINT: z.string().default('http://127.0.0.1:4566'),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY_ID: z.string().default('test'),
  S3_SECRET_ACCESS_KEY: z.string().default('test'),
  S3_BUCKET: z.string().default('bookstore-media'),
  BIRD_API_BASE_URL: z.string().default('http://127.0.0.1:4010'),
  BIRD_API_KEY: z.string().default('local-bird-dev-key'),
  BIRD_FROM_EMAIL: z.string().email().default('noreply@bookstore.local'),
});

async function main(): Promise<void> {
  const env = workerEnvSchema.parse(readEnv());
  const telemetry = initTelemetry({
    serviceName: env.OTEL_SERVICE_NAME,
    enabled: env.OTEL_ENABLED,
    endpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT,
    headers: env.OTEL_EXPORTER_OTLP_HEADERS,
  });
  const logger = createLogger({
    level: env.LOG_LEVEL,
    format: env.LOG_FORMAT,
    otelEnabled: env.OTEL_ENABLED,
  });
  const drizzleHandle = createDb(env.DATABASE_URL);
  const mailer = createBirdMailer({
    apiBaseUrl: env.BIRD_API_BASE_URL,
    apiKey: env.BIRD_API_KEY,
    fromEmail: env.BIRD_FROM_EMAIL,
  });
  const storage = createS3Storage({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    bucket: env.S3_BUCKET,
  });

  const queue = createPgBossJobQueue({
    connectionString: env.DATABASE_DIRECT_URL ?? env.DATABASE_URL,
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
