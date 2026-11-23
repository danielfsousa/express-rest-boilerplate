import { renderLowStockAlertEmail } from '@starter/email';
import { m } from '@starter/i18n';
import type { JOB_NAMES, JobHandler } from '../types.ts';
import type { JobHandlersDeps } from './deps.ts';

export function createLowStockAlertHandler(
  deps: JobHandlersDeps,
): JobHandler<typeof JOB_NAMES.LOW_STOCK_ALERT> {
  return async (payload) => {
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
  };
}
