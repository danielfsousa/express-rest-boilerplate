import { m } from '@starter/i18n';
import type { Locale } from '@starter/i18n';
import type { ReactElement } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';

export interface WelcomeEmailProps {
  name: string;
  locale: Locale;
}

export function WelcomeEmail({ name, locale }: WelcomeEmailProps): ReactElement {
  const opts = { locale };
  return jsxs('html', {
    lang: locale,
    children: [
      jsx('head', {
        children: jsx('title', { children: m.email_welcome_subject({}, opts) }),
      }),
      jsx('body', {
        children: jsxs('div', {
          children: [
            jsx('h1', { children: m.email_welcome_heading({ name }, opts) }),
            jsx('p', { children: m.email_welcome_body({}, opts) }),
          ],
        }),
      }),
    ],
  });
}
