import { m } from '@starter/i18n';
import type { Locale } from '@starter/i18n';
import { Text } from '@starter/ui/email';
import type { ReactElement } from 'react';
import { defineTemplate } from '../define-template.ts';
import { EmailLayout } from '../layouts/EmailLayout.tsx';
import { EMAIL_TEMPLATES } from '../template-catalog.ts';

export interface WelcomeEmailProps {
  name: string;
  locale: Locale;
}

export function WelcomeEmail({ name, locale }: WelcomeEmailProps): ReactElement {
  const opts = { locale };
  const subject = m.email_welcome_subject({}, opts);
  const heading = m.email_welcome_heading({ name }, opts);
  const body = m.email_welcome_body({}, opts);

  return (
    <EmailLayout locale={locale} subject={subject} preview={body} heading={heading}>
      <Text tone="secondary">{body}</Text>
    </EmailLayout>
  );
}

export const welcomeEmailTemplate = defineTemplate<WelcomeEmailProps>({
  slug: EMAIL_TEMPLATES.WELCOME,
  name: 'Bookstore Welcome Email',
  description: 'Sent when a new merchant signs up.',
  component: WelcomeEmail,
  compileLanguage: (locale) => ({
    subject: m.email_welcome_subject({}, { locale }),
    previewText: m.email_welcome_body({}, { locale }),
    props: { name: '{{ name }}', locale },
  }),
});
