import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';
import { m } from '@starter/i18n';
import type { Locale } from '@starter/i18n';
import type { ReactElement } from 'react';

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
        </Container>
      </Body>
    </Html>
  );
}
