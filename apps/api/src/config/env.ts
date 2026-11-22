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
  BETTER_AUTH_SECRET: z.string().min(16).default('dev-only-secret-change-in-production-32chars'),
  BETTER_AUTH_URL: z.string().url().default('http://127.0.0.1:3001'),
  WEB_ORIGIN: z.string().url().default('http://127.0.0.1:3000'),
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
