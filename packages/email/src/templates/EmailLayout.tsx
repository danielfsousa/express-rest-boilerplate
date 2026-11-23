import {
  Body,
  Container,
  Font,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import type { Locale } from '@starter/i18n';
import { starterLightTokens } from '@starter/ui/tokens';
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

const { colors, typography, radii, borders } = starterLightTokens;

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
    <Html lang={locale}>
      <Head>
        <title>{subject}</title>
        <Font
          fontFamily="Figtree"
          fallbackFontFamily={['Helvetica', 'Arial', 'sans-serif']}
          webFont={{
            url: 'https://fonts.gstatic.com/s/figtree/v5/_Xmz-HUzqDCFdgfMsYiV_F7wfS-Bs_d_QG5ZyEA2.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: colors.canvas,
          color: colors.ink,
          fontFamily: typography.bodyFamily,
          margin: '0',
          padding: '32px 16px',
        }}
      >
        <Container
          style={{
            backgroundColor: colors.surface,
            border: `${borders.width} solid ${colors.border}`,
            borderRadius: radii.container,
            margin: '0 auto',
            maxWidth: '560px',
            padding: '32px',
          }}
        >
          <Section style={{ marginBottom: '20px' }}>
            <Text
              style={{
                color: colors.inkMuted,
                fontSize: '12px',
                fontWeight: '600',
                letterSpacing: '0.06em',
                lineHeight: '16px',
                margin: '0 0 8px 0',
                textTransform: 'uppercase',
              }}
            >
              {eyebrow}
            </Text>
            <Heading
              as="h1"
              style={{
                color: colors.ink,
                fontFamily: typography.headingFamily,
                fontSize: '22px',
                fontWeight: '600',
                lineHeight: '30px',
                margin: '0',
              }}
            >
              {heading}
            </Heading>
          </Section>

          <Section>{children}</Section>

          <Hr style={{ borderColor: colors.border, margin: '24px 0 16px 0' }} />

          <Text
            style={{
              color: colors.inkMuted,
              fontSize: '12px',
              lineHeight: '18px',
              margin: '0',
            }}
          >
            {footerText}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
