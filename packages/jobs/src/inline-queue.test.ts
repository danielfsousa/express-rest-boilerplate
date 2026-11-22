import { describe, expect, test } from 'vite-plus/test';
import { createInlineJobQueue } from './inline-queue.ts';
import { JOB_NAMES } from './types.ts';

describe('createInlineJobQueue (packages/jobs)', () => {
  test('executes all three job handlers inline and clears on stop', async () => {
    const queue = createInlineJobQueue();
    const seen: Array<string> = [];

    await queue.start();
    await queue.registerHandlers({
      [JOB_NAMES.ORDER_RECEIPT]: async (payload) => {
        seen.push(`receipt:${payload.orderId}`);
      },
      [JOB_NAMES.LOW_STOCK_ALERT]: async (payload) => {
        seen.push(`low-stock:${payload.bookId}`);
      },
      [JOB_NAMES.EXPORT_STORE_BOOKS_CSV]: async (payload) => {
        seen.push(`export:${payload.exportId}`);
      },
    });

    await queue.enqueue({
      name: JOB_NAMES.ORDER_RECEIPT,
      payload: {
        storeId: 's1',
        storeName: 'Store',
        orderId: 'o1',
        customerEmail: 'a@b.com',
        customerName: 'A',
        locale: 'en',
        totalCents: 100,
        currency: 'USD',
        items: [],
      },
    });
    await queue.enqueue({
      name: JOB_NAMES.LOW_STOCK_ALERT,
      payload: {
        storeId: 's1',
        storeName: 'Store',
        ownerEmail: 'o@b.com',
        bookId: 'b1',
        bookTitle: 'Book',
        sku: 'SKU',
        stock: 2,
        threshold: 5,
        locale: 'en',
      },
    });
    await queue.enqueue({
      name: JOB_NAMES.EXPORT_STORE_BOOKS_CSV,
      payload: { storeId: 's1', exportId: 'e1' },
    });

    expect(seen).toEqual(['receipt:o1', 'low-stock:b1', 'export:e1']);

    await queue.stop();
    await queue.enqueue({
      name: JOB_NAMES.EXPORT_STORE_BOOKS_CSV,
      payload: { storeId: 's1', exportId: 'e2' },
    });
    expect(seen).toHaveLength(3);
  });
});
