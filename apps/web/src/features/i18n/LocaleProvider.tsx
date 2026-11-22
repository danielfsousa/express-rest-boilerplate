import { resolveLocale } from '@starter/i18n';
import type { Locale } from '@starter/i18n';
import { createContext, use, useState } from 'react';
import type { ReactNode } from 'react';
import { isI18nEnabled } from '../../lib/env.ts';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  enabled: boolean;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  setLocale: () => {},
  enabled: true,
});

export function LocaleProvider({
  children,
  enabled = isI18nEnabled(),
}: {
  children: ReactNode;
  enabled?: boolean;
}) {
  const [locale, setRawLocale] = useState<Locale>('en');

  function setLocale(next: Locale) {
    setRawLocale(resolveLocale(next, enabled));
  }

  return (
    <LocaleContext value={{ locale: resolveLocale(locale, enabled), setLocale, enabled }}>
      {children}
    </LocaleContext>
  );
}

export function useLocale(): LocaleContextValue {
  return use(LocaleContext);
}
