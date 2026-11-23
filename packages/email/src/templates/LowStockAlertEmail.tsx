import { Column, Hr, Row, Section, Text } from '@react-email/components';
import { m } from '@starter/i18n';
import type { Locale } from '@starter/i18n';
import { starterLightTokens } from '@starter/ui/tokens';
import type { ReactElement } from 'react';
import { EmailLayout } from './EmailLayout.tsx';

export interface LowStockAlertEmailProps {
  storeName: string;
  bookTitle: string;
  sku: string;
  stock: number | string;
  threshold: number | string;
  locale: Locale;
}

const { colors, radii, borders } = starterLightTokens;

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
          backgroundColor: colors.warningBg,
          border: `${borders.width} solid ${colors.warning}`,
          borderRadius: radii.element,
          padding: '16px',
        }}
      >
        <Row>
          <Column>
            <Text
              style={{
                color: colors.warningText,
                fontSize: '13px',
                fontWeight: '600',
                lineHeight: '20px',
                margin: '0',
              }}
            >
              SKU: {sku}
            </Text>
          </Column>
          <Column align="right">
            <Text
              style={{
                color: colors.warningText,
                fontSize: '13px',
                fontWeight: '600',
                lineHeight: '20px',
                margin: '0',
              }}
            >
              {String(stock)} / {String(threshold)}
            </Text>
          </Column>
        </Row>
        <Hr style={{ borderColor: colors.border, margin: '10px 0' }} />
        <Text
          style={{
            color: colors.ink,
            fontSize: '14px',
            lineHeight: '20px',
            margin: '0',
          }}
        >
          {bookTitle}
        </Text>
      </Section>
    </EmailLayout>
  );
}
