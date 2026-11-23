import { Body, Container, Head, Heading, Html, Link, Preview, Text } from '@react-email/components';
import { m } from '@starter/i18n';
import type { Locale } from '@starter/i18n';
import type { ReactElement } from 'react';

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
          <Link
            href={resetUrl}
            style={{
              display: 'inline-block',
              marginTop: '12px',
              padding: '10px 16px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              borderRadius: '6px',
              textDecoration: 'none',
            }}
          >
            {cta}
          </Link>
        </Container>
      </Body>
    </Html>
  );
}
