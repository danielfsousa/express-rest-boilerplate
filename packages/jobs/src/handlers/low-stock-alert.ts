import { EMAIL_TEMPLATES } from '@starter/email';
import type { JOB_NAMES, JobHandler } from '../types.ts';
import type { JobHandlersDeps } from './deps.ts';

export function createLowStockAlertHandler({
  mailer,
  logger,
}: JobHandlersDeps): JobHandler<typeof JOB_NAMES.LOW_STOCK_ALERT> {
  return async (payload) => {
    await mailer.sendTemplate({
      to: payload.ownerEmail,
      slug: EMAIL_TEMPLATES.LOW_STOCK_ALERT,
      language: payload.locale,
      parameters: {
        store_name: payload.storeName,
        book_title: payload.bookTitle,
        sku: payload.sku,
        stock: payload.stock,
        threshold: payload.threshold,
      },
    });

    logger.info(
      {
        bookId: payload.bookId,
        storeId: payload.storeId,
        stock: payload.stock,
        to: payload.ownerEmail,
      },
      'Sent low stock alert email',
    );
  };
}
