import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components';
import { m } from '@starter/i18n';
import type { Locale } from '@starter/i18n';

export interface PasswordResetEmailProps {
  name: string;
  resetUrl: string;
  locale: Locale;
}

export function PasswordResetEmail({ name, resetUrl, locale }: PasswordResetEmailProps) {
  const opts = { locale };
  return (
    <Html lang={locale}>
      <Head />
      <Preview>{m.email_reset_subject({}, opts)}</Preview>
      <Body>
        <Container>
          <Heading>{m.email_reset_heading({}, opts)}</Heading>
          <Text>{m.email_reset_body({ name }, opts)}</Text>
          <Button href={resetUrl}>{m.email_reset_cta({}, opts)}</Button>
        </Container>
      </Body>
    </Html>
  );
}
