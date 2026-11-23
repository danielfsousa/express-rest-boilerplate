import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { m } from '@starter/i18n';
import type { Locale } from '@starter/i18n';
import type { ReactElement } from 'react';

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
    <Html lang={locale}>
      <Head>
        <title>{subject}</title>
      </Head>
      <Preview>{body}</Preview>
      <Body style={{ backgroundColor: '#f8fafc', fontFamily: 'sans-serif', padding: '24px' }}>
        <Container
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '560px',
          }}
        >
          <Heading as="h1" style={{ fontSize: '20px', marginBottom: '12px' }}>
            {heading}
          </Heading>
          <Text style={{ fontSize: '15px', lineHeight: '22px', color: '#334155' }}>{body}</Text>
          <Section style={{ marginTop: '16px' }}>
            {liquidItemsLoop ? (
              <>
                <Text>{'{% for item in items %}'}</Text>
                <Text style={{ fontSize: '14px', lineHeight: '20px', color: '#0f172a' }}>
                  {'{{ item.title }} × {{ item.quantity }} ({{ item.unit_price_formatted }})'}
                </Text>
                <Text>{'{% endfor %}'}</Text>
              </>
            ) : (
              items.map((item) => (
                <Text
                  key={`${item.title}-${String(item.quantity)}`}
                  style={{ fontSize: '14px', lineHeight: '20px', color: '#0f172a' }}
                >
                  {`${item.title} × ${String(item.quantity)} (${item.unitPriceFormatted})`}
                </Text>
              ))
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
