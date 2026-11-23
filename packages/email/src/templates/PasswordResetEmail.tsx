import { Button, Hr, Link, Section, Text } from '@react-email/components';
import { m } from '@starter/i18n';
import type { Locale } from '@starter/i18n';
import { starterLightTokens } from '@starter/ui/tokens';
import type { ReactElement } from 'react';
import { EmailLayout } from './EmailLayout.tsx';

export interface PasswordResetEmailProps {
  name: string;
  resetUrl: string;
  locale: Locale;
}

const { colors, radii } = starterLightTokens;

export function PasswordResetEmail({
  name,
  resetUrl,
  locale,
}: PasswordResetEmailProps): ReactElement {
  const opts = { locale };
  const subject = m.email_reset_subject({}, opts);
  const heading = m.email_reset_heading({}, opts);
  const body = m.email_reset_body({ name }, opts);
  const cta = m.email_reset_cta({}, opts);

  return (
    <EmailLayout locale={locale} subject={subject} preview={body} heading={heading}>
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
      <Section style={{ marginBottom: '20px' }}>
        <Button
          href={resetUrl}
          style={{
            backgroundColor: colors.accent,
            borderRadius: radii.element,
            color: colors.onAccent,
            display: 'inline-block',
            fontSize: '14px',
            fontWeight: '600',
            lineHeight: '20px',
            padding: '12px 20px',
            textDecoration: 'none',
          }}
        >
          {cta}
        </Button>
      </Section>
      <Hr style={{ borderColor: colors.border, margin: '16px 0' }} />
      <Text
        style={{
          color: colors.inkMuted,
          fontSize: '12px',
          lineHeight: '18px',
          margin: '0',
          wordBreak: 'break-all',
        }}
      >
        <Link href={resetUrl} style={{ color: colors.inkSecondary, textDecoration: 'underline' }}>
          {resetUrl}
        </Link>
      </Text>
    </EmailLayout>
  );
}
