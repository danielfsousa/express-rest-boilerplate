import { z } from 'zod';

export const bookSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  sku: z.string(),
  title: z.string(),
  author: z.string(),
  description: z.string(),
  priceCents: z.number().int().min(0),
  currency: z.string().length(3),
  stock: z.number().int().min(0),
  coverKey: z.string().nullable(),
  coverUrl: z.string().nullable(),
  published: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Book = z.infer<typeof bookSchema>;

export const createBookSchema = z.object({
  sku: z.string().min(1).max(64),
  title: z.string().min(1).max(200),
  author: z.string().min(1).max(160),
  description: z.string().max(4000).default(''),
  priceCents: z.number().int().min(0),
  currency: z
    .string()
    .length(3)
    .transform((value) => value.toUpperCase())
    .default('USD'),
  stock: z.number().int().min(0).default(0),
  published: z.boolean().default(false),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;

export const updateBookSchema = z.object({
  sku: z.string().min(1).max(64).optional(),
  title: z.string().min(1).max(200).optional(),
  author: z.string().min(1).max(160).optional(),
  description: z.string().max(4000).optional(),
  priceCents: z.number().int().min(0).optional(),
  currency: z
    .string()
    .length(3)
    .transform((value) => value.toUpperCase())
    .optional(),
  stock: z.number().int().min(0).optional(),
  published: z.boolean().optional(),
});

export type UpdateBookInput = z.infer<typeof updateBookSchema>;

export const listBooksQuerySchema = z.object({
  q: z.string().optional(),
  published: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListBooksQuery = z.infer<typeof listBooksQuerySchema>;

export const listBooksResponseSchema = z.object({
  books: z.array(bookSchema),
  total: z.number().int().min(0),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
});

export type ListBooksResponse = z.infer<typeof listBooksResponseSchema>;

export const uploadCoverResponseSchema = z.object({
  coverKey: z.string(),
  coverUrl: z.string(),
});

export type UploadCoverResponse = z.infer<typeof uploadCoverResponseSchema>;

export const deleteBookResponseSchema = z.object({
  deleted: z.literal(true),
});

export const catalogSearchSchema = z.object({
  q: z.preprocess(
    (val) => (typeof val === 'string' && val.length > 0 ? val : undefined),
    z.string().optional(),
  ),
  offset: z.preprocess((val) => {
    const num =
      typeof val === 'number'
        ? val
        : typeof val === 'string'
          ? Number.parseInt(val, 10)
          : Number.NaN;
    return Number.isInteger(num) && num > 0 ? num : undefined;
  }, z.number().int().positive().optional()),
});

export type CatalogSearchParams = z.infer<typeof catalogSearchSchema>;

export function parseCatalogSearch(search: { q?: unknown; offset?: unknown }): CatalogSearchParams {
  return catalogSearchSchema.parse(search);
}
