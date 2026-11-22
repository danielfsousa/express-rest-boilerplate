import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';
import { m } from '@starter/i18n';
import type { Locale } from '@starter/i18n';

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
}: OrderReceiptEmailProps) {
  const opts = { locale };
  return (
    <Html lang={locale}>
      <Head />
      <Preview>{m.email_receipt_subject({ storeName }, opts)}</Preview>
      <Body>
        <Container>
          <Heading>{m.email_receipt_heading({ customerName }, opts)}</Heading>
          <Text>{m.email_receipt_body({ orderId, totalFormatted }, opts)}</Text>
          {items.map((item) => (
            <Text key={`${item.title}-${String(item.quantity)}`}>
              {item.title} × {String(item.quantity)} ({item.unitPriceFormatted})
            </Text>
          ))}
        </Container>
      </Body>
    </Html>
  );
}
