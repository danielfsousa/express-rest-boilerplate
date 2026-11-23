import { renderOrderReceiptEmail } from '@starter/email';
import { m } from '@starter/i18n';
import type { JOB_NAMES, JobHandler } from '../types.ts';
import type { JobHandlersDeps } from './deps.ts';

function formatMoney(cents: number, currency: string): string {
  return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
}

export function createOrderReceiptHandler(
  deps: JobHandlersDeps,
): JobHandler<typeof JOB_NAMES.ORDER_RECEIPT> {
  return async (payload) => {
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
  };
}
