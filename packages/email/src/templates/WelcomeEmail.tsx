import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';
import { m } from '@starter/i18n';
import type { Locale } from '@starter/i18n';
import type { ReactElement } from 'react';

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
    <Html lang={locale}>
      <Head>
        <title>{subject}</title>
      </Head>
      <Preview>{body}</Preview>
      <Body style={{ backgroundColor: '#f8fafc', fontFamily: 'sans-serif', padding: '24px' }}>
        <Container
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '560px',
          }}
        >
          <Heading as="h1" style={{ fontSize: '20px', marginBottom: '12px' }}>
            {heading}
          </Heading>
          <Text style={{ fontSize: '15px', lineHeight: '22px', color: '#334155' }}>{body}</Text>
        </Container>
      </Body>
    </Html>
  );
}
