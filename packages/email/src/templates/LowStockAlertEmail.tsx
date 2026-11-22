import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';
import { m } from '@starter/i18n';
import type { Locale } from '@starter/i18n';

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
}: LowStockAlertEmailProps) {
  const opts = { locale };
  return (
    <Html lang={locale}>
      <Head />
      <Preview>{m.email_low_stock_subject({ bookTitle }, opts)}</Preview>
      <Body>
        <Container>
          <Heading>{m.email_low_stock_heading({ storeName }, opts)}</Heading>
          <Text>
            {m.email_low_stock_body(
              {
                bookTitle,
                sku,
                stock: String(stock),
                threshold: String(threshold),
              },
              opts,
            )}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
