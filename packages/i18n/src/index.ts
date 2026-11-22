import { m as paraglideMessages } from './paraglide/messages.js';

export const SUPPORTED_LOCALES = ['en', 'pt-BR'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export function isSupportedLocale(value: string | undefined): value is Locale {
  return value === 'en' || value === 'pt-BR';
}

export function resolveLocale(requested: string | undefined, enabled: boolean): Locale {
  if (!enabled) {
    return 'en';
  }
  return isSupportedLocale(requested) ? requested : 'en';
}

export const m = paraglideMessages;
