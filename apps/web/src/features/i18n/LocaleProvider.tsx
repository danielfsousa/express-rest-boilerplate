import { resolveLocale } from '@starter/i18n';
import type { Locale } from '@starter/i18n';
import { Store, useStore } from '@tanstack/react-store';
import { createContext, use } from 'react';
import type { ReactNode } from 'react';
import { isI18nEnabled } from '#/lib/env.ts';

export const localeStore = new Store<{ locale: Locale }>({
  locale: 'en',
});

export function setActiveLocale(next: Locale, enabled = isI18nEnabled()): void {
  const resolved = resolveLocale(next, enabled);
  localeStore.setState(() => ({ locale: resolved }));
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  enabled: boolean;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  children,
  enabled = isI18nEnabled(),
}: {
  children: ReactNode;
  enabled?: boolean;
}) {
  const rawLocale = useStore(localeStore, (state) => state.locale);
  const locale = resolveLocale(rawLocale, enabled);

  function setLocale(next: Locale) {
    setActiveLocale(next, enabled);
  }

  return <LocaleContext value={{ locale, setLocale, enabled }}>{children}</LocaleContext>;
}

export function useLocale(): LocaleContextValue {
  const ctx = use(LocaleContext);
  const rawLocale = useStore(localeStore, (state) => state.locale);
  if (ctx) {
    return ctx;
  }
  const enabled = isI18nEnabled();
  return {
    locale: resolveLocale(rawLocale, enabled),
    setLocale: (next) => {
      setActiveLocale(next, enabled);
    },
    enabled,
  };
}
