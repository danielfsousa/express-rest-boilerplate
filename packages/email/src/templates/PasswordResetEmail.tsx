import { m } from '@starter/i18n';
import type { Locale } from '@starter/i18n';
import { Button, Divider, Link, Section, Text } from '@starter/ui/email';
import type { ReactElement } from 'react';
import { defineTemplate } from '../define-template.ts';
import { EmailLayout } from '../layouts/EmailLayout.tsx';
import { EMAIL_TEMPLATES } from '../template-catalog.ts';

export interface PasswordResetEmailProps {
  name: string;
  resetUrl: string;
  locale: Locale;
}

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
      <Text tone="secondary" spacing="lg">
        {body}
      </Text>
      <Section spacing="lg">
        <Button href={resetUrl}>{cta}</Button>
      </Section>
      <Divider spacing="md" />
      <Text tone="muted" size="xs" breakAll>
        <Link href={resetUrl}>{resetUrl}</Link>
      </Text>
    </EmailLayout>
  );
}

export const passwordResetEmailTemplate = defineTemplate<PasswordResetEmailProps>({
  slug: EMAIL_TEMPLATES.PASSWORD_RESET,
  name: 'Bookstore Password Reset',
  description: 'Sent when a user requests a password reset link.',
  component: PasswordResetEmail,
  compileLanguage: (locale) => ({
    subject: m.email_reset_subject({}, { locale }),
    previewText: m.email_reset_body({ name: '{{ name }}' }, { locale }),
    props: { name: '{{ name }}', resetUrl: '{{ reset_url }}', locale },
  }),
});
