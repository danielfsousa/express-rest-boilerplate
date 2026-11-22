import { m } from '@starter/i18n';
import type { Locale } from '@starter/i18n';
import type { ReactElement } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';

export interface LowStockAlertEmailProps {
  storeName: string;
  bookTitle: string;
  sku: string;
  stock: number;
  threshold: number;
  locale: Locale;
}

export function LowStockAlertEmail({
  storeName,
  bookTitle,
  sku,
  stock,
  threshold,
  locale,
}: LowStockAlertEmailProps): ReactElement {
  const opts = { locale };
  return jsxs('html', {
    lang: locale,
    children: [
      jsx('head', {
        children: jsx('title', { children: m.email_low_stock_subject({ bookTitle }, opts) }),
      }),
      jsx('body', {
        children: jsxs('div', {
          children: [
            jsx('h1', { children: m.email_low_stock_heading({ storeName }, opts) }),
            jsx('p', {
              children: m.email_low_stock_body(
                {
                  bookTitle,
                  sku,
                  stock: String(stock),
                  threshold: String(threshold),
                },
                opts,
              ),
            }),
          ],
        }),
      }),
    ],
  });
}
