import { m } from '@starter/i18n';
import type { Locale } from '@starter/i18n';
import type { ReactElement } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';

export interface OrderReceiptItem {
  title: string;
  quantity: number;
  unitPriceFormatted: string;
}

export interface OrderReceiptEmailProps {
  storeName: string;
  orderId: string;
  customerName: string;
  totalFormatted: string;
  items: ReadonlyArray<OrderReceiptItem>;
  locale: Locale;
}

export function OrderReceiptEmail({
  storeName,
  orderId,
  customerName,
  totalFormatted,
  items,
  locale,
}: OrderReceiptEmailProps): ReactElement {
  const opts = { locale };
  return jsxs('html', {
    lang: locale,
    children: [
      jsx('head', {
        children: jsx('title', { children: m.email_receipt_subject({ storeName }, opts) }),
      }),
      jsx('body', {
        children: jsxs('div', {
          children: [
            jsx('h1', { children: m.email_receipt_heading({ customerName }, opts) }),
            jsx('p', { children: m.email_receipt_body({ orderId, totalFormatted }, opts) }),
            items.map((item) =>
              jsx(
                'p',
                {
                  children: `${item.title} × ${String(item.quantity)} (${item.unitPriceFormatted})`,
                },
                `${item.title}-${String(item.quantity)}`,
              ),
            ),
          ],
        }),
      }),
    ],
  });
}
