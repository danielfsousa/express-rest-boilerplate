import { resolveLocale } from '@starter/i18n';
import type { Locale } from '@starter/i18n';
import { createStore, useSelector } from '@tanstack/react-store';
import { createContext, use } from 'react';
import type { ReactNode } from 'react';
import { isI18nEnabled } from '#/lib/env.ts';

export const localeStore = createStore(
  {
    locale: 'en',
  },
  ({ setState }) => ({
    setLocale: (next: Locale, enabled: boolean = isI18nEnabled()) => {
      const resolved = resolveLocale(next, enabled);
      setState((prev) => ({
        ...prev,
        locale: resolved,
      }));
    },
  }),
);

export function setActiveLocale(next: Locale, enabled = isI18nEnabled()): void {
  localeStore.actions.setLocale(next, enabled);
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
  const rawLocale = useSelector(localeStore, (state) => state.locale);
  const locale = resolveLocale(rawLocale, enabled);

  function setLocale(next: Locale) {
    localeStore.actions.setLocale(next, enabled);
  }

  return <LocaleContext value={{ locale, setLocale, enabled }}>{children}</LocaleContext>;
}

export function useLocale(): LocaleContextValue {
  const ctx = use(LocaleContext);
  const rawLocale = useSelector(localeStore, (state) => state.locale);
  if (ctx) {
    return ctx;
  }
  const enabled = isI18nEnabled();
  return {
    locale: resolveLocale(rawLocale, enabled),
    setLocale: (next) => {
      localeStore.actions.setLocale(next, enabled);
    },
    enabled,
  };
}
