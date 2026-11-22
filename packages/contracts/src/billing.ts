import { z } from 'zod';

export const storePlanSchema = z.enum(['free', 'pro']);

export type StorePlan = z.infer<typeof storePlanSchema>;

export const storeBillingSummarySchema = z.object({
  plan: storePlanSchema,
  status: z.string(),
  publishedBookCount: z.number().int().min(0),
  bookLimit: z.number().int().nullable(),
  stripeCustomerId: z.string().nullable(),
  stripeSubscriptionId: z.string().nullable(),
});

export type StoreBillingSummary = z.infer<typeof storeBillingSummarySchema>;

export const upgradeStoreResponseSchema = z.object({
  plan: storePlanSchema,
  status: z.string(),
  checkoutUrl: z.string().nullable(),
});

export type UpgradeStoreResponse = z.infer<typeof upgradeStoreResponseSchema>;
