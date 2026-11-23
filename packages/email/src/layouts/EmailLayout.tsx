import type { Locale } from '@starter/i18n';
import { Card, Divider, Document, Eyebrow, Heading, Section, Text } from '@starter/ui/email';
import type { ReactElement, ReactNode } from 'react';

export interface EmailLayoutProps {
  locale: Locale;
  subject: string;
  preview: string;
  eyebrow?: string;
  heading: string;
  footerText?: string;
  children: ReactNode;
}

export function EmailLayout({
  locale,
  subject,
  preview,
  eyebrow = 'Bookstore Platform',
  heading,
  footerText = 'Sent automatically by Bookstore Platform.',
  children,
}: EmailLayoutProps): ReactElement {
  return (
    <Document lang={locale} title={subject} preview={preview}>
      <Card>
        <Section spacing="lg">
          <Eyebrow>{eyebrow}</Eyebrow>
          <Heading as="h1">{heading}</Heading>
        </Section>
        <Section>{children}</Section>
        <Divider spacing="lg" />
        <Text tone="muted" size="xs">
          {footerText}
        </Text>
      </Card>
    </Document>
  );
}
