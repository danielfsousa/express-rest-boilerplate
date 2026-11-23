import { EMAIL_TEMPLATES } from '@starter/email';
import type { JOB_NAMES, JobHandler } from '../types.ts';
import type { JobHandlersDeps } from './deps.ts';

function formatMoney(cents: number, currency: string): string {
  return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
}

export function createOrderReceiptHandler({
  mailer,
  logger,
}: JobHandlersDeps): JobHandler<typeof JOB_NAMES.ORDER_RECEIPT> {
  return async (payload) => {
    await mailer.sendTemplate({
      to: payload.customerEmail,
      slug: EMAIL_TEMPLATES.ORDER_RECEIPT,
      language: payload.locale,
      parameters: {
        store_name: payload.storeName,
        order_id: payload.orderId,
        customer_name: payload.customerName,
        total_formatted: formatMoney(payload.totalCents, payload.currency),
        items: payload.items.map((item) => ({
          title: item.title,
          quantity: item.quantity,
          unit_price_formatted: formatMoney(item.unitPriceCents, payload.currency),
        })),
      },
    });

    logger.info(
      { orderId: payload.orderId, storeId: payload.storeId, to: payload.customerEmail },
      'Sent order receipt email',
    );
  };
}
