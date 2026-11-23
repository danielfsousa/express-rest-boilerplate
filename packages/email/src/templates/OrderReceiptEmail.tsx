import { Column, Hr, Row, Section, Text } from '@react-email/components';
import { m } from '@starter/i18n';
import type { Locale } from '@starter/i18n';
import { starterLightTokens } from '@starter/ui/tokens';
import type { ReactElement } from 'react';
import { EmailLayout } from './EmailLayout.tsx';

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

const { colors, radii, borders } = starterLightTokens;

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
      <Text
        style={{
          color: colors.inkSecondary,
          fontSize: '15px',
          lineHeight: '24px',
          margin: '0 0 20px 0',
        }}
      >
        {body}
      </Text>
      <Section
        style={{
          backgroundColor: colors.mutedSurface,
          border: `${borders.width} solid ${colors.border}`,
          borderRadius: radii.element,
          padding: '16px',
        }}
      >
        {liquidItemsLoop ? (
          <>
            <Text style={{ color: colors.ink, fontSize: '14px', lineHeight: '20px', margin: '0' }}>
              {'{% for item in items %}'}
            </Text>
            <Text
              style={{
                color: colors.ink,
                fontSize: '14px',
                lineHeight: '22px',
                margin: '4px 0',
              }}
            >
              {'{{ item.title }} × {{ item.quantity }} ({{ item.unit_price_formatted }})'}
            </Text>
            <Text style={{ color: colors.ink, fontSize: '14px', lineHeight: '20px', margin: '0' }}>
              {'{% endfor %}'}
            </Text>
          </>
        ) : (
          items.map((item, index) => (
            <Section key={`${item.title}-${String(item.quantity)}`}>
              {index > 0 ? <Hr style={{ borderColor: colors.border, margin: '8px 0' }} /> : null}
              <Row>
                <Column>
                  <Text
                    style={{
                      color: colors.ink,
                      fontSize: '14px',
                      lineHeight: '20px',
                      margin: '0',
                    }}
                  >
                    {`${item.title} × ${String(item.quantity)} (${item.unitPriceFormatted})`}
                  </Text>
                </Column>
              </Row>
            </Section>
          ))
        )}
        <Hr style={{ borderColor: colors.borderStrong, margin: '12px 0' }} />
        <Row>
          <Column>
            <Text
              style={{
                color: colors.successText,
                fontSize: '14px',
                fontWeight: '600',
                lineHeight: '20px',
                margin: '0',
              }}
            >
              {totalFormatted}
            </Text>
          </Column>
        </Row>
      </Section>
    </EmailLayout>
  );
}
