import { describe, expect, test } from 'vite-plus/test';
import { bookInsertSchema, orderSelectSchema, storeExportSelectSchema } from './zod.ts';

describe('Drizzle Zod schemas (packages/db)', () => {
  test('validates book inserts, order selects, and store export selects', () => {
    const validBook = bookInsertSchema.safeParse({
      storeId: 'store-1',
      sku: 'SKU-001',
      title: 'Clean Architecture',
      author: 'Robert C. Martin',
      priceCents: 3500,
    });
    expect(validBook.success).toBe(true);

    const invalidBook = bookInsertSchema.safeParse({
      storeId: 'store-1',
      sku: 'SKU-001',
      title: 'Missing Price',
      author: 'Someone',
    });
    expect(invalidBook.success).toBe(false);

    const now = new Date();
    const validOrder = orderSelectSchema.safeParse({
      id: '01950000-0000-7000-8000-000000000001',
      storeId: 'store-1',
      customerId: '01950000-0000-7000-8000-000000000002',
      status: 'paid',
      totalCents: 3500,
      currency: 'USD',
      stripeCheckoutSessionId: null,
      createdAt: now,
      updatedAt: now,
    });
    expect(validOrder.success).toBe(true);

    const validExport = storeExportSelectSchema.safeParse({
      id: '01950000-0000-7000-8000-000000000003',
      storeId: 'store-1',
      requestedByUserId: 'user-1',
      status: 'completed',
      fileKey: 'stores/store-1/exports/01950000.csv',
      createdAt: now,
      completedAt: now,
    });
    expect(validExport.success).toBe(true);
  });
});
