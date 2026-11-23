import { m } from '@starter/i18n';
import type { Locale } from '@starter/i18n';
import { Callout, Column, Divider, Row, Section, Text } from '@starter/ui/email';
import type { ReactElement } from 'react';
import { defineTemplate } from '../define-template.ts';
import { EmailLayout } from '../layouts/EmailLayout.tsx';
import { EMAIL_TEMPLATES } from '../template-catalog.ts';

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
  liquidItemsLoop?: boolean | undefined;
}

export function OrderReceiptEmail({
  storeName,
  orderId,
  customerName,
  totalFormatted,
  items,
  locale,
  liquidItemsLoop = false,
}: OrderReceiptEmailProps): ReactElement {
  const opts = { locale };
  const subject = m.email_receipt_subject({ storeName }, opts);
  const heading = m.email_receipt_heading({ customerName }, opts);
  const body = m.email_receipt_body({ orderId, totalFormatted }, opts);

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
      <Callout tone="muted">
        {liquidItemsLoop ? (
          <>
            <Text tone="primary" size="sm">
              {'{% for item in items %}'}
            </Text>
            <Text tone="primary" size="sm">
              {'{{ item.title }} × {{ item.quantity }} ({{ item.unit_price_formatted }})'}
            </Text>
            <Text tone="primary" size="sm">
              {'{% endfor %}'}
            </Text>
          </>
        ) : (
          items.map((item, index) => (
            <Section key={`${item.title}-${String(item.quantity)}`}>
              {index > 0 ? <Divider spacing="xs" /> : null}
              <Row>
                <Column>
                  <Text tone="primary" size="sm">
                    {`${item.title} × ${String(item.quantity)} (${item.unitPriceFormatted})`}
                  </Text>
                </Column>
              </Row>
            </Section>
          ))
        )}
        <Divider tone="strong" spacing="sm" />
        <Row>
          <Column>
            <Text tone="success" size="sm" weight="semibold">
              {totalFormatted}
            </Text>
          </Column>
        </Row>
      </Callout>
    </EmailLayout>
  );
}

export const orderReceiptEmailTemplate = defineTemplate<OrderReceiptEmailProps>({
  slug: EMAIL_TEMPLATES.ORDER_RECEIPT,
  name: 'Bookstore Order Receipt',
  description: 'Sent when a customer order is paid.',
  component: OrderReceiptEmail,
  compileLanguage: (locale) => ({
    subject: m.email_receipt_subject({ storeName: '{{ store_name }}' }, { locale }),
    previewText: m.email_receipt_body(
      { orderId: '{{ order_id }}', totalFormatted: '{{ total_formatted }}' },
      { locale },
    ),
    props: {
      storeName: '{{ store_name }}',
      orderId: '{{ order_id }}',
      customerName: '{{ customer_name }}',
      totalFormatted: '{{ total_formatted }}',
      items: [],
      locale,
      liquidItemsLoop: true,
    },
  }),
});
