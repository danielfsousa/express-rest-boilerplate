import { z } from 'zod';

export const healthLiveResponseSchema = z.object({
  status: z.literal('ok'),
});

export type HealthLiveResponse = z.infer<typeof healthLiveResponseSchema>;

export const healthReadyResponseSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  checks: z.object({
    database: z.enum(['ok', 'error']),
  }),
});

export type HealthReadyResponse = z.infer<typeof healthReadyResponseSchema>;
