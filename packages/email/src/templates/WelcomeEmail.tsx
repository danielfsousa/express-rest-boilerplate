import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';
import { m } from '@starter/i18n';
import type { Locale } from '@starter/i18n';

export interface WelcomeEmailProps {
  name: string;
  locale: Locale;
}

export function WelcomeEmail({ name, locale }: WelcomeEmailProps) {
  const opts = { locale };
  return (
    <Html lang={locale}>
      <Head />
      <Preview>{m.email_welcome_subject({}, opts)}</Preview>
      <Body>
        <Container>
          <Heading>{m.email_welcome_heading({ name }, opts)}</Heading>
          <Text>{m.email_welcome_body({}, opts)}</Text>
        </Container>
      </Body>
    </Html>
  );
}
