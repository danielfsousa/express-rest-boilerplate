import { Text } from '@react-email/components';
import { m } from '@starter/i18n';
import type { Locale } from '@starter/i18n';
import { starterLightTokens } from '@starter/ui/tokens';
import type { ReactElement } from 'react';
import { EmailLayout } from './EmailLayout.tsx';

export interface WelcomeEmailProps {
  name: string;
  locale: Locale;
}

const { colors } = starterLightTokens;

export function WelcomeEmail({ name, locale }: WelcomeEmailProps): ReactElement {
  const opts = { locale };
  const subject = m.email_welcome_subject({}, opts);
  const heading = m.email_welcome_heading({ name }, opts);
  const body = m.email_welcome_body({}, opts);

  return (
    <EmailLayout locale={locale} subject={subject} preview={body} heading={heading}>
      <Text
        style={{
          color: colors.inkSecondary,
          fontSize: '15px',
          lineHeight: '24px',
          margin: '0',
        }}
      >
        {body}
      </Text>
    </EmailLayout>
  );
}
