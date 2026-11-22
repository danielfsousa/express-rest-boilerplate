import { z } from 'zod';

export const storeSlugSchema = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const storeMetadataSchema = z.object({
  lowStockThreshold: z.number().int().min(0).max(10_000).default(5),
});

export type StoreMetadata = z.infer<typeof storeMetadataSchema>;

export const storeSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  logo: z.string().nullable(),
  lowStockThreshold: z.number().int().min(0),
  role: z.enum(['owner', 'staff']).optional(),
});

export type Store = z.infer<typeof storeSchema>;

export const createStoreSchema = z.object({
  name: z.string().min(2).max(120),
  slug: storeSlugSchema,
  lowStockThreshold: z.number().int().min(0).max(10_000).default(5),
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;

export const updateStoreSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  lowStockThreshold: z.number().int().min(0).max(10_000).optional(),
});

export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;

export const storeListResponseSchema = z.object({
  stores: z.array(storeSchema),
});

export type StoreListResponse = z.infer<typeof storeListResponseSchema>;

export const errorResponseSchema = z.object({
  error: z.string(),
});
