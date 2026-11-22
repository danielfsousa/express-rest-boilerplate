import { z } from 'zod';

export const storeExportStatusSchema = z.enum(['queued', 'processing', 'completed', 'failed']);

export type StoreExportStatus = z.infer<typeof storeExportStatusSchema>;

export const storeExportSchema = z.object({
  id: z.uuid(),
  storeId: z.string(),
  requestedByUserId: z.string(),
  status: storeExportStatusSchema,
  fileKey: z.string().nullable(),
  downloadUrl: z.string().nullable(),
  createdAt: z.string(),
  completedAt: z.string().nullable(),
});

export type StoreExport = z.infer<typeof storeExportSchema>;

export const listStoreExportsResponseSchema = z.object({
  items: z.array(storeExportSchema),
});

export type ListStoreExportsResponse = z.infer<typeof listStoreExportsResponseSchema>;
