import { m } from '@starter/i18n';
import type { Locale } from '@starter/i18n';
import { Callout, Column, Divider, Row, Text } from '@starter/ui/email';
import type { ReactElement } from 'react';
import { defineTemplate } from '../define-template.ts';
import { EmailLayout } from '../layouts/EmailLayout.tsx';
import { EMAIL_TEMPLATES } from '../template-catalog.ts';

export interface LowStockAlertEmailProps {
  storeName: string;
  bookTitle: string;
  sku: string;
  stock: number | string;
  threshold: number | string;
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
  const subject = m.email_low_stock_subject({ bookTitle }, opts);
  const heading = m.email_low_stock_heading({ storeName }, opts);
  const body = m.email_low_stock_body(
    {
      bookTitle,
      sku,
      stock: String(stock),
      threshold: String(threshold),
    },
    opts,
  );

  return (
    <EmailLayout
      locale={locale}
      subject={subject}
      preview={body}
      eyebrow={storeName}
      heading={heading}
    >
      <Text tone="secondary" spacing="lg">
        {body}
      </Text>
      <Callout tone="warning">
        <Row>
          <Column>
            <Text tone="warning" size="xs" weight="semibold">
              SKU: {sku}
            </Text>
          </Column>
          <Column align="right">
            <Text tone="warning" size="xs" weight="semibold">
              {String(stock)} / {String(threshold)}
            </Text>
          </Column>
        </Row>
        <Divider spacing="xs" />
        <Text tone="primary" size="sm">
          {bookTitle}
        </Text>
      </Callout>
    </EmailLayout>
  );
}

export const lowStockAlertEmailTemplate = defineTemplate<LowStockAlertEmailProps>({
  slug: EMAIL_TEMPLATES.LOW_STOCK_ALERT,
  name: 'Bookstore Low Stock Alert',
  description: 'Sent to store owners when a book falls below the low stock threshold.',
  component: LowStockAlertEmail,
  compileLanguage: (locale) => ({
    subject: m.email_low_stock_subject({ bookTitle: '{{ book_title }}' }, { locale }),
    previewText: m.email_low_stock_body(
      {
        bookTitle: '{{ book_title }}',
        sku: '{{ sku }}',
        stock: '{{ stock }}',
        threshold: '{{ threshold }}',
      },
      { locale },
    ),
    props: {
      storeName: '{{ store_name }}',
      bookTitle: '{{ book_title }}',
      sku: '{{ sku }}',
      stock: '{{ stock }}',
      threshold: '{{ threshold }}',
      locale,
    },
  }),
});
