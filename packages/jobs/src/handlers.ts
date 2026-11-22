import { books, storeExports, withStoreContext } from '@starter/db';
import type { Database } from '@starter/db';
import { renderLowStockAlertEmail, renderOrderReceiptEmail } from '@starter/email';
import type { Mailer } from '@starter/email';
import { m } from '@starter/i18n';
import type { ObjectStorage } from '@starter/runtime/storage';
import type { RuntimeLogger } from '@starter/runtime/types';
import { asc, eq } from 'drizzle-orm';
import { JOB_NAMES } from './types.ts';
import type { JobQueue } from './types.ts';

export interface JobHandlersDeps {
  drizzleDb: Database;
  mailer: Mailer;
  storage: ObjectStorage;
  logger: RuntimeLogger;
}

function formatMoney(cents: number, currency: string): string {
  return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
}

function escapeCsvField(value: string | number | boolean): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

export async function registerDefaultJobHandlers(
  queue: JobQueue,
  deps: JobHandlersDeps,
): Promise<void> {
  await queue.registerHandlers({
    [JOB_NAMES.ORDER_RECEIPT]: async (payload) => {
      const rendered = await renderOrderReceiptEmail({
        storeName: payload.storeName,
        orderId: payload.orderId,
        customerName: payload.customerName,
        totalFormatted: formatMoney(payload.totalCents, payload.currency),
        items: payload.items.map((item) => ({
          title: item.title,
          quantity: item.quantity,
          unitPriceFormatted: formatMoney(item.unitPriceCents, payload.currency),
        })),
        locale: payload.locale,
      });

      await deps.mailer.send({
        to: payload.customerEmail,
        subject: m.email_receipt_subject(
          { storeName: payload.storeName },
          { locale: payload.locale },
        ),
        html: rendered.html,
        text: rendered.text,
      });

      deps.logger.info(
        { orderId: payload.orderId, storeId: payload.storeId, to: payload.customerEmail },
        'Sent order receipt email',
      );
    },
    [JOB_NAMES.LOW_STOCK_ALERT]: async (payload) => {
      const rendered = await renderLowStockAlertEmail({
        storeName: payload.storeName,
        bookTitle: payload.bookTitle,
        sku: payload.sku,
        stock: payload.stock,
        threshold: payload.threshold,
        locale: payload.locale,
      });

      await deps.mailer.send({
        to: payload.ownerEmail,
        subject: m.email_low_stock_subject(
          { bookTitle: payload.bookTitle },
          { locale: payload.locale },
        ),
        html: rendered.html,
        text: rendered.text,
      });

      deps.logger.info(
        {
          bookId: payload.bookId,
          storeId: payload.storeId,
          stock: payload.stock,
          to: payload.ownerEmail,
        },
        'Sent low stock alert email',
      );
    },
    [JOB_NAMES.EXPORT_STORE_BOOKS_CSV]: async (payload) => {
      await withStoreContext(deps.drizzleDb, payload.storeId, async (tx) => {
        await tx
          .update(storeExports)
          .set({ status: 'processing' })
          .where(eq(storeExports.id, payload.exportId));
      });

      try {
        const storeBooks = await withStoreContext(deps.drizzleDb, payload.storeId, async (tx) =>
          tx
            .select({
              id: books.id,
              sku: books.sku,
              title: books.title,
              author: books.author,
              priceCents: books.priceCents,
              currency: books.currency,
              stock: books.stock,
              published: books.published,
            })
            .from(books)
            .orderBy(asc(books.createdAt)),
        );

        const header = 'id,sku,title,author,priceCents,currency,stock,published';
        const rows = storeBooks.map((book) =>
          [
            escapeCsvField(book.id),
            escapeCsvField(book.sku),
            escapeCsvField(book.title),
            escapeCsvField(book.author),
            escapeCsvField(book.priceCents),
            escapeCsvField(book.currency),
            escapeCsvField(book.stock),
            escapeCsvField(book.published),
          ].join(','),
        );
        const csv = `${[header, ...rows].join('\n')}\n`;
        const fileKey = `stores/${payload.storeId}/exports/${payload.exportId}.csv`;

        await deps.storage.putObject({
          key: fileKey,
          body: new TextEncoder().encode(csv),
          contentType: 'text/csv; charset=utf-8',
        });

        await withStoreContext(deps.drizzleDb, payload.storeId, async (tx) => {
          await tx
            .update(storeExports)
            .set({
              status: 'completed',
              fileKey,
              completedAt: new Date(),
            })
            .where(eq(storeExports.id, payload.exportId));
        });

        deps.logger.info(
          { exportId: payload.exportId, storeId: payload.storeId, rowCount: storeBooks.length },
          'Completed store books CSV export',
        );
      } catch (error) {
        await withStoreContext(deps.drizzleDb, payload.storeId, async (tx) => {
          await tx
            .update(storeExports)
            .set({ status: 'failed' })
            .where(eq(storeExports.id, payload.exportId));
        });
        throw error;
      }
    },
  });
}
