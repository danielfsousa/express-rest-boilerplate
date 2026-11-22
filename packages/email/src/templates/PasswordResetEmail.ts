import { m } from '@starter/i18n';
import type { Locale } from '@starter/i18n';
import type { ReactElement } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';

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
  return jsxs('html', {
    lang: locale,
    children: [
      jsx('head', {
        children: jsx('title', { children: m.email_reset_subject({}, opts) }),
      }),
      jsx('body', {
        children: jsxs('div', {
          children: [
            jsx('h1', { children: m.email_reset_heading({}, opts) }),
            jsx('p', { children: m.email_reset_body({ name }, opts) }),
            jsx('a', { href: resetUrl, children: m.email_reset_cta({}, opts) }),
          ],
        }),
      }),
    ],
  });
}
