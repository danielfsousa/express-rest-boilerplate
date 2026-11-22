import { z } from 'zod';

const booleanFlagSchema = z
  .enum(['true', 'false'])
  .default('true')
  .transform((value) => value === 'true');

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().min(1).default('127.0.0.1'),
  PORT: z.coerce.number().int().min(0).max(65_535).default(3001),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  DATABASE_URL: z.string().min(1),
  DATABASE_DIRECT_URL: z.string().min(1).optional(),
  WORKER_INLINE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  BETTER_AUTH_SECRET: z.string().min(16).default('dev-only-secret-change-in-production-32chars'),
  BETTER_AUTH_URL: z.string().url().default('http://127.0.0.1:3001'),
  WEB_ORIGIN: z.string().url().default('http://127.0.0.1:3000'),
  S3_ENDPOINT: z.string().url().default('http://127.0.0.1:4566'),
  S3_REGION: z.string().min(1).default('us-east-1'),
  S3_ACCESS_KEY_ID: z.string().min(1).default('test'),
  S3_SECRET_ACCESS_KEY: z.string().min(1).default('test'),
  S3_BUCKET: z.string().min(1).default('bookstore-media'),
  BIRD_API_BASE_URL: z.string().url().default('http://127.0.0.1:4010'),
  BIRD_API_KEY: z.string().min(1).default('local-bird-dev-key'),
  BIRD_FROM_EMAIL: z.string().email().default('noreply@bookstore.local'),
  STRIPE_SECRET_KEY: z.string().min(1).default('sk_test_local_emulate'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).default('whsec_local_emulate'),
  STRIPE_API_HOST: z.string().optional(),
  STRIPE_API_PORT: z.coerce.number().int().positive().optional(),
  STRIPE_API_PROTOCOL: z.enum(['http', 'https']).optional(),
  STRIPE_PRO_PRICE_ID: z.string().min(1).default('price_pro_monthly'),
  FEATURE_MULTI_TENANCY_ENABLED: booleanFlagSchema,
  FEATURE_BILLING_ENABLED: booleanFlagSchema,
  FEATURE_JOBS_ENABLED: booleanFlagSchema,
  FEATURE_REALTIME_ENABLED: booleanFlagSchema,
  FEATURE_I18N_ENABLED: booleanFlagSchema,
});

export type ApiEnv = z.infer<typeof envSchema>;

export function parseEnv(raw: Record<string, string | undefined>): ApiEnv {
  return envSchema.parse(raw);
}
