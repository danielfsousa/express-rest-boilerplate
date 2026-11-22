import { z } from 'zod';
import { storePlanSchema } from './billing.ts';

export const userRoleSchema = z.enum(['user', 'admin']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const adminStoreSummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  plan: storePlanSchema,
  subscriptionStatus: z.string(),
  memberCount: z.number().int().nonnegative(),
  publishedBookCount: z.number().int().nonnegative(),
  orderCount: z.number().int().nonnegative(),
  revenueCents: z.number().int().nonnegative(),
  createdAt: z.string(),
});

export type AdminStoreSummary = z.infer<typeof adminStoreSummarySchema>;

export const adminUserSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: userRoleSchema,
  banned: z.boolean(),
  banReason: z.string().nullable(),
  storeCount: z.number().int().nonnegative(),
  createdAt: z.string(),
});

export type AdminUserSummary = z.infer<typeof adminUserSummarySchema>;

export const adminOverviewResponseSchema = z.object({
  totalStores: z.number().int().nonnegative(),
  activeProStores: z.number().int().nonnegative(),
  totalUsers: z.number().int().nonnegative(),
  totalOrders: z.number().int().nonnegative(),
  totalRevenueCents: z.number().int().nonnegative(),
  stores: z.array(adminStoreSummarySchema),
  users: z.array(adminUserSummarySchema),
});

export type AdminOverviewResponse = z.infer<typeof adminOverviewResponseSchema>;

export const adminUpdateStorePlanSchema = z.object({
  plan: storePlanSchema,
  status: z.enum(['active', 'trialing', 'canceled']).default('active'),
});

export type AdminUpdateStorePlanInput = z.infer<typeof adminUpdateStorePlanSchema>;

export const adminUpdateUserSchema = z.object({
  role: userRoleSchema.optional(),
  banned: z.boolean().optional(),
  banReason: z.string().max(500).nullable().optional(),
});

export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
